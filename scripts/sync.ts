/**
 * fossil-index Git 風格同步腳本
 * 讓本機 input.json 與遠端 Firestore 保持完全一致
 *
 * 使用方式：
 *   npx tsx scripts/sync.ts              # 預覽 diff（不執行）
 *   npx tsx scripts/sync.ts --apply      # 執行同步
 *   npx tsx scripts/sync.ts --apply --upload  # 同步 + 上傳圖片
 *
 * 流程：
 *   1. 預處理（Phase 1）：掃描 input.json，一次算出所有 slug / 圖片路徑
 *   2. 快照（Phase 2）：一次性把 Firestore 現有資料拉下來
 *   3. Diff（Phase 3）：比對本機 vs 遠端，分類成 CREATE / UPDATE / DELETE / SKIP
 *   4. 預覽（Phase 4）：印出 diff 結果（類似 git status）
 *   5. 執行（Phase 5）：--apply 才真正寫入，使用 Firestore batch write
 *   6. 上傳（Phase 6）：--upload 才上傳圖片到 Firebase Storage
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import type { DocumentReference } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { createRequire } from "module";
import * as fs from "fs";
import * as path from "path";
import type {
  ISpecies,
  IFossil,
  BodyPartCategory,
  SpecimenCondition,
  FossilCategory,
} from "../app/types/fossil";

const require = createRequire(import.meta.url);

// ============================================================
// 型別定義
// ============================================================

// 共用類型：尺寸資訊
type Measurements = {
  length?: number; // cm
  width?: number; // cm
  height?: number; // cm
  weight?: number; // g
};

interface InputSpecimen {
  species: string;
  country: string;
  state: string;
  city?: string;
  formation?: string;
  condition?: SpecimenCondition;
  completeness?: number;
  catalogNumber?: string;
  collectionDate?: string;
  bodyPart?: {
    category: BodyPartCategory;
    specific: string;
    position?: string;
    side?: "left" | "right" | null;
  };
  measurements?: Measurements;
  description?: {
    zh?: string;
    en?: string;
  };
  tags?: string[];
  category?: FossilCategory;
  images?: {
    folder?: string;
    files?: string[];
  };
}

interface InputData {
  specimens: InputSpecimen[];
}

// 預處理後的標本資料（含所有計算結果）
interface ProcessedSpecimen {
  fossilSlug: string;
  shortCode: string;
  speciesSlug: string;
  locationId: string;
  specimenNumber: number;
  imageBasePath: string;
  actualImageFolder: string | null;
  imageFiles: string[];
  input: InputSpecimen;
}

// Diff 結果
type DiffAction = "CREATE" | "UPDATE" | "DELETE" | "SKIP";

interface FossilDiff {
  action: DiffAction;
  slug: string;
  reason?: string; // UPDATE 時說明哪些欄位改變
}

interface SpeciesDiff {
  action: DiffAction;
  slug: string;
}

// ============================================================
// 工具函數
// ============================================================

function removeUndefined(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj))
    return obj.map(removeUndefined).filter((v) => v !== undefined);
  if (typeof obj === "object") {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) cleaned[key] = removeUndefined(value);
    }
    return cleaned;
  }
  return obj;
}

function generateShortCode(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    const char = slug.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString().slice(0, 11).padStart(11, "0");
}

function scientificToSlug(scientific: string): string {
  return scientific
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function countryToCode(country: string): string {
  const mapping: Record<string, string> = {
    摩洛哥: "morocco",
    Morocco: "morocco",
    美國: "usa",
    USA: "usa",
    "United States": "usa",
    加拿大: "canada",
    Canada: "canada",
    中國: "china",
    China: "china",
    墨西哥: "mexico",
    Mexico: "mexico",
  };
  return mapping[country] || country.toLowerCase().replace(/\s+/g, "-");
}

function stateToCode(state: string): string {
  return state.toLowerCase().replace(/\s+/g, "-");
}

// 比對兩個標本資料是否有實質差異（排除 updatedAt / 統計欄位）
function hasFossilChanged(local: Partial<IFossil>, remote: any): boolean {
  const checkFields = [
    "slug",
    "shortCode",
    "speciesRef",
    "specimen",
    "images",
    "thumbnail",
  ];
  for (const field of checkFields) {
    const localVal = JSON.stringify((local as any)[field] ?? null);
    const remoteVal = JSON.stringify(remote[field] ?? null);
    if (localVal !== remoteVal) return true;
  }
  return false;
}

// 取得 diff 原因說明
function getFossilDiffReason(local: Partial<IFossil>, remote: any): string {
  const changed: string[] = [];
  const checkFields = [
    "slug",
    "shortCode",
    "speciesRef",
    "specimen",
    "images",
    "thumbnail",
  ];
  for (const field of checkFields) {
    const localVal = JSON.stringify((local as any)[field] ?? null);
    const remoteVal = JSON.stringify(remote[field] ?? null);
    if (localVal !== remoteVal) changed.push(field);
  }
  return changed.join(", ");
}

// ============================================================
// Phase 1：預處理 input.json → 計算所有 slug / 圖片路徑
// ============================================================

function preprocessSpecimens(inputData: InputData): ProcessedSpecimen[] {
  const publicBaseDir = path.join(process.cwd(), "public");

  // 第一遍掃描：統計每個物種有幾個不同產區（解決 hasMultipleLocations 時序問題）
  const speciesLocationSets = new Map<string, Set<string>>();
  for (const input of inputData.specimens) {
    const speciesSlug = scientificToSlug(input.species);
    const locationId = `${countryToCode(input.country)}-${stateToCode(input.state)}`;
    if (!speciesLocationSets.has(speciesSlug)) {
      speciesLocationSets.set(speciesSlug, new Set());
    }
    speciesLocationSets.get(speciesSlug)!.add(locationId);
  }

  // 第二遍掃描：逐筆計算 slug、圖片路徑
  const locationCounters = new Map<string, number>(); // locationKey → 目前計數
  const results: ProcessedSpecimen[] = [];

  for (const input of inputData.specimens) {
    const speciesSlug = scientificToSlug(input.species);
    const countryCode = countryToCode(input.country);
    const stateCode = stateToCode(input.state);
    const locationId = `${countryCode}-${stateCode}`;
    const locationKey = `${speciesSlug}::${locationId}`;

    // 更新計數器（只基於 input.json 的順序）
    const prev = locationCounters.get(locationKey) ?? 0;
    const specimenNumber = prev + 1;
    locationCounters.set(locationKey, specimenNumber);

    // 決定 slug 格式（全局確認多產區，不再有時序問題）
    const hasMultipleLocations =
      (speciesLocationSets.get(speciesSlug)?.size ?? 0) > 1;
    const numStr = specimenNumber.toString().padStart(3, "0");
    const fossilSlug = hasMultipleLocations
      ? `${speciesSlug}-${locationId}-${numStr}`
      : `${speciesSlug}-${numStr}`;

    const shortCode = generateShortCode(fossilSlug);

    // 計算圖片路徑
    const bodyPartFolder =
      input.bodyPart && input.bodyPart.category !== "other"
        ? input.bodyPart.category
        : null;
    const imageBasePath = bodyPartFolder
      ? `images/fossils/${speciesSlug}/${locationId}/${numStr}/${bodyPartFolder}`
      : `images/fossils/${speciesSlug}/${locationId}/${numStr}`;

    // 決定圖片資料夾（優先 input folder，其次 fossils folder）
    const inputImageFolder = input.images?.folder
      ? path.join(publicBaseDir, "images", "input", input.images.folder)
      : null;
    const fossilImageFolder = bodyPartFolder
      ? path.join(
          publicBaseDir,
          "images",
          "fossils",
          speciesSlug,
          locationId,
          numStr,
          bodyPartFolder,
        )
      : path.join(
          publicBaseDir,
          "images",
          "fossils",
          speciesSlug,
          locationId,
          numStr,
        );

    let actualImageFolder: string | null = null;
    if (inputImageFolder && fs.existsSync(inputImageFolder)) {
      actualImageFolder = inputImageFolder;
    } else if (fs.existsSync(fossilImageFolder)) {
      actualImageFolder = fossilImageFolder;
    }

    // 決定圖片檔案列表
    let imageFiles: string[] = [];
    if (input.images?.files && input.images.files.length > 0) {
      imageFiles = input.images.files;
    } else if (actualImageFolder) {
      imageFiles = fs
        .readdirSync(actualImageFolder)
        .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
        .sort();
    }

    results.push({
      fossilSlug,
      shortCode,
      speciesSlug,
      locationId,
      specimenNumber,
      imageBasePath,
      actualImageFolder,
      imageFiles,
      input,
    });
  }

  return results;
}

// ============================================================
// Phase 2：建構本機端標本的完整 Firestore 資料
// ============================================================

function buildFossilData(
  processed: ProcessedSpecimen,
  existingRemote: any | null, // 傳入遠端資料，保留統計欄位
): { fossil: IFossil | null; skipReason: string | null } {
  const {
    fossilSlug,
    shortCode,
    speciesSlug,
    locationId,
    imageBasePath,
    actualImageFolder,
    imageFiles,
    input,
  } = processed;

  // 驗證：必須有 thumbnail.jpg
  const hasThumbnail = imageFiles.some(
    (f) => f.toLowerCase() === "thumbnail.jpg",
  );
  if (!hasThumbnail) {
    return {
      fossil: null,
      skipReason: `找不到 thumbnail.jpg（資料夾: ${actualImageFolder ?? "無"}）`,
    };
  }

  const thumbnail = `${imageBasePath}/thumbnail.jpg`;

  // 建構 images 陣列
  const images: IFossil["images"] = [];
  let order = 1;
  for (const file of imageFiles) {
    if (file.toLowerCase() === "thumbnail.jpg") continue;

    if (actualImageFolder) {
      const filePath = path.join(actualImageFolder, file);
      if (!fs.existsSync(filePath)) continue;
    }

    const imageType = file.toLowerCase().includes("main") ? "main" : "detail";
    images.push({
      url: `${imageBasePath}/${file}`,
      type: imageType,
      order: order++,
    });
  }

  const fossil: IFossil = {
    id: fossilSlug,
    slug: fossilSlug,
    shortCode,
    speciesRef: {
      id: speciesSlug,
      slug: speciesSlug,
      name: {
        zh: existingRemote?.speciesRef?.name?.zh ?? "",
        scientific: input.species,
      },
    },
    specimen: {
      type: "complete-skeleton",
      completeness: input.completeness ?? 100,
      condition: input.condition ?? "good",
      catalogNumber: input.catalogNumber,
      collectionDate: input.collectionDate,
      bodyPart: input.bodyPart,
      location: {
        locationId,
        country: input.country,
        state: input.state,
        city: input.city,
        formation: input.formation,
        displayName: [input.country, input.state, input.city]
          .filter(Boolean)
          .join(", "),
      },
      measurements: input.measurements,
    },
    images,
    thumbnail,
    tags: input.tags ?? existingRemote?.tags ?? [],
    category: input.category ?? existingRemote?.category ?? "other",
    likeCount: existingRemote?.likeCount ?? 0,
    viewCount: existingRemote?.viewCount ?? 0,
    isPublic: existingRemote?.isPublic ?? true,
    featured: existingRemote?.featured ?? false,
    description: input.description
      ? {
          zh: input.description.zh ?? "",
          en: input.description.en,
        }
      : existingRemote?.description,
    createdAt: existingRemote?.createdAt ?? Timestamp.now() as any,
    updatedAt: Timestamp.now() as any,
  };

  return { fossil, skipReason: null };
}

// ============================================================
// Phase 3：計算 Diff
// ============================================================

async function computeDiff(
  processed: ProcessedSpecimen[],
  remoteSnapshot: Map<string, any>,
) {
  const fossilDiffs: FossilDiff[] = [];
  const speciesDiffs: SpeciesDiff[] = [];
  const localFossilSlugs = new Set<string>();

  // 建構本機端的物種 slug set（供後續使用）
  const localSpeciesSlugs = new Set(processed.map((p) => p.speciesSlug));

  // 逐筆標本計算 diff
  for (const p of processed) {
    const { fossilSlug } = p;
    localFossilSlugs.add(fossilSlug);

    const remote = remoteSnapshot.get(fossilSlug);
    const { fossil, skipReason } = buildFossilData(p, remote ?? null);

    if (!fossil) {
      // 無法建構（缺圖片等）→ 視為 SKIP 並說明原因
      fossilDiffs.push({
        action: "SKIP",
        slug: fossilSlug,
        reason: skipReason ?? "未知原因",
      });
      continue;
    }

    if (!remote) {
      fossilDiffs.push({ action: "CREATE", slug: fossilSlug });
    } else if (hasFossilChanged(fossil, remote)) {
      fossilDiffs.push({
        action: "UPDATE",
        slug: fossilSlug,
        reason: getFossilDiffReason(fossil, remote),
      });
    } else {
      fossilDiffs.push({ action: "SKIP", slug: fossilSlug });
    }
  }

  // 遠端有但本機沒有 → DELETE
  for (const remoteSlug of remoteSnapshot.keys()) {
    if (!localFossilSlugs.has(remoteSlug)) {
      fossilDiffs.push({ action: "DELETE", slug: remoteSlug });
    }
  }

  return { fossilDiffs, localFossilSlugs };
}

// ============================================================
// Phase 4：印出 diff 結果
// ============================================================

function printDiff(fossilDiffs: FossilDiff[]) {
  const creates = fossilDiffs.filter((d) => d.action === "CREATE");
  const updates = fossilDiffs.filter((d) => d.action === "UPDATE");
  const deletes = fossilDiffs.filter((d) => d.action === "DELETE");
  const skips = fossilDiffs.filter((d) => d.action === "SKIP");

  console.log("─".repeat(60));
  console.log("📋 同步預覽（類似 git status）");
  console.log("─".repeat(60));

  if (creates.length > 0) {
    console.log(`\n✅ 新增 (${creates.length} 筆)`);
    for (const d of creates) console.log(`   + ${d.slug}`);
  }

  if (updates.length > 0) {
    console.log(`\n🔄 更新 (${updates.length} 筆)`);
    for (const d of updates) console.log(`   ~ ${d.slug}  [${d.reason}]`);
  }

  if (deletes.length > 0) {
    console.log(`\n🗑️  刪除 (${deletes.length} 筆)`);
    for (const d of deletes) console.log(`   - ${d.slug}`);
  }

  if (skips.length > 0) {
    // SKIP 分兩種：正常（無變化）vs 有問題（缺圖片）
    const normalSkips = skips.filter((d) => !d.reason);
    const warnSkips = skips.filter((d) => !!d.reason);

    if (normalSkips.length > 0) {
      console.log(`\n⏭️  無變化 (${normalSkips.length} 筆)`);
    }

    if (warnSkips.length > 0) {
      console.log(`\n⚠️  跳過 - 有問題 (${warnSkips.length} 筆)`);
      for (const d of warnSkips) console.log(`   ? ${d.slug}  [${d.reason}]`);
    }
  }

  console.log("\n" + "─".repeat(60));
  console.log(
    `總計: +${creates.length} 新增  ~${updates.length} 更新  -${deletes.length} 刪除  =${skips.filter((d) => !d.reason).length} 無變化  ?${skips.filter((d) => !!d.reason).length} 跳過`,
  );
  console.log("─".repeat(60));
}

// ============================================================
// Phase 5：批次寫入 Firestore
// ============================================================

async function applyChanges(
  processed: ProcessedSpecimen[],
  fossilDiffs: FossilDiff[],
  remoteSnapshot: Map<string, any>,
) {
  const db = getFirestore();
  const diffMap = new Map(fossilDiffs.map((d) => [d.slug, d]));

  // Firestore batch 最多 500 筆，超過要分批
  const BATCH_SIZE = 400;
  let batch = db.batch();
  let batchCount = 0;

  async function flushBatch() {
    if (batchCount > 0) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }

  async function addToBatch(ref: DocumentReference, data: any, merge = false) {
    if (merge) {
      batch.set(ref, data, { merge: true });
    } else {
      batch.set(ref, data);
    }
    batchCount++;
    if (batchCount >= BATCH_SIZE) await flushBatch();
  }

  // 處理標本
  for (const p of processed) {
    const diff = diffMap.get(p.fossilSlug);
    if (!diff || diff.action === "SKIP") continue;

    const remote = remoteSnapshot.get(p.fossilSlug) ?? null;
    const { fossil } = buildFossilData(p, remote);
    if (!fossil) continue; // SKIP（缺圖片）在 diff 階段已標記

    const fossilRef = db.collection("fossils").doc(p.fossilSlug);

    if (diff.action === "CREATE" || diff.action === "UPDATE") {
      await addToBatch(fossilRef, removeUndefined(fossil));
    }
  }

  // 處理刪除：先收集要刪除的 Storage 路徑，Firestore batch commit 後再刪
  const toDelete = fossilDiffs.filter((d) => d.action === "DELETE");
  const storagePathsToDelete: string[] = [];

  for (const diff of toDelete) {
    const fossilRef = db.collection("fossils").doc(diff.slug);
    batch.delete(fossilRef);
    batchCount++;
    if (batchCount >= BATCH_SIZE) await flushBatch();

    // 收集對應的 Storage 路徑（從遠端快照取得）
    const remoteData = remoteSnapshot.get(diff.slug);
    if (remoteData) {
      if (remoteData.thumbnail) storagePathsToDelete.push(remoteData.thumbnail);
      if (Array.isArray(remoteData.images)) {
        for (const img of remoteData.images) {
          if (img.url) storagePathsToDelete.push(img.url);
        }
      }
    }
  }

  // fossil batch 全部 commit（包含 CREATE / UPDATE / DELETE）
  await flushBatch();

  // Firestore 寫入完成後，才刪除 Storage 圖片
  // Storage 刪除失敗不中斷流程，只 warn
  if (storagePathsToDelete.length > 0) {
    const bucket = getStorage().bucket();
    console.log(
      `\n🗑️  刪除 Storage 圖片 (${storagePathsToDelete.length} 個)...`,
    );
    for (const storagePath of storagePathsToDelete) {
      try {
        const file = bucket.file(storagePath);
        const [exists] = await file.exists();
        if (exists) {
          await file.delete();
          console.log(`   ✅ 刪除: ${storagePath}`);
        }
      } catch (err: any) {
        console.warn(
          `   ⚠️  刪除 Storage 圖片失敗: ${storagePath} - ${err.message}`,
        );
      }
    }
  }

  // 更新物種資料
  // ⚠️ 注意：必須在 fossil batch commit 之後才查詢 specimenCount
  //    否則新增的標本還沒寫進 Firestore，count 會少算
  const speciesBatch = db.batch();
  let speciesBatchCount = 0;

  // 重新統計每個物種的標本數
  // fossil batch 已 commit，此時查詢結果包含剛新增的標本，count 正確
  const speciesSlugSet = new Set(processed.map((p) => p.speciesSlug));
  for (const speciesSlug of speciesSlugSet) {
    const speciesRef = db.collection("species").doc(speciesSlug);
    const speciesSnap = await speciesRef.get();

    // 計算遠端此物種的實際標本數
    const allFossilsForSpecies = await db
      .collection("fossils")
      .where("speciesRef.slug", "==", speciesSlug)
      .get();

    const newSpeciesData: Partial<ISpecies> = {
      id: speciesSlug,
      slug: speciesSlug,
      name: speciesSnap.exists
        ? speciesSnap.data()!.name
        : {
            zh: "",
            en: processed.find((p) => p.speciesSlug === speciesSlug)!.input
              .species,
            scientific: processed.find((p) => p.speciesSlug === speciesSlug)!
              .input.species,
          },
      taxonomy: speciesSnap.exists
        ? speciesSnap.data()!.taxonomy
        : {
            kingdom: "",
            phylum: "",
            class: "",
            order: "",
            family: "",
            genus:
              processed
                .find((p) => p.speciesSlug === speciesSlug)!
                .input.species.split(" ")[0] ?? "",
            species:
              processed
                .find((p) => p.speciesSlug === speciesSlug)!
                .input.species.split(" ")[1] ?? "",
          },
      period: speciesSnap.exists
        ? speciesSnap.data()!.period
        : { era: "", period: "", age: "" },
      description: speciesSnap.exists
        ? speciesSnap.data()!.description
        : { zh: "" },
      specimenCount: allFossilsForSpecies.size,
      tags: speciesSnap.exists ? speciesSnap.data()!.tags : [],
      category: speciesSnap.exists ? speciesSnap.data()!.category : "other",
      createdAt: speciesSnap.exists
        ? speciesSnap.data()!.createdAt
        : (Timestamp.now() as any),
      updatedAt: Timestamp.now() as any,
    };

    speciesBatch.set(speciesRef, removeUndefined(newSpeciesData));
    speciesBatchCount++;
  }

  if (speciesBatchCount > 0) await speciesBatch.commit();

  // 印出結果
  const created = fossilDiffs.filter((d) => d.action === "CREATE").length;
  const updated = fossilDiffs.filter((d) => d.action === "UPDATE").length;
  const deleted = fossilDiffs.filter((d) => d.action === "DELETE").length;

  console.log(
    `\n✅ 寫入完成: +${created} 新增  ~${updated} 更新  -${deleted} 刪除`,
  );
}

// ============================================================
// Phase 6：上傳圖片到 Firebase Storage
// ============================================================

async function uploadImages(forceUpdate: boolean) {
  const db = getFirestore();
  const bucket = getStorage().bucket();
  const publicBaseDir = path.join(process.cwd(), "public");

  console.log("\n📤 開始上傳圖片到 Firebase Storage...");
  if (forceUpdate) console.log("⚠️  --force 模式：強制覆蓋已存在的檔案");
  console.log("");

  // 一次性讀取所有標本
  const snapshot = await db.collection("fossils").get();
  let success = 0,
    skipped = 0,
    failed = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const fossilSlug = data.slug || doc.id;

    const allPaths: string[] = [];
    if (data.thumbnail) allPaths.push(data.thumbnail);
    if (Array.isArray(data.images)) {
      for (const img of data.images) {
        if (img.url) allPaths.push(img.url);
      }
    }

    // 如果這個標本有圖片，先輸出標本名稱
    if (allPaths.length > 0) {
      console.log(`📦 ${fossilSlug} (${allPaths.length} 個檔案)`);
    }

    for (const storagePath of allPaths) {
      const localPath = path.join(publicBaseDir, storagePath);
      if (!fs.existsSync(localPath)) {
        console.log(`   ⚠️  找不到本機檔案: ${storagePath}`);
        failed++;
        continue;
      }

      try {
        const file = bucket.file(storagePath);
        const [exists] = await file.exists();

        if (exists && !forceUpdate) {
          console.log(`   ⏭️  跳過（已存在）: ${storagePath}`);
          skipped++;
          continue;
        }

        if (exists && forceUpdate) {
          console.log(`   🔄 覆蓋: ${storagePath}`);
        } else {
          console.log(`   ⬆️  上傳: ${storagePath}`);
        }

        await bucket.upload(localPath, {
          destination: storagePath,
          metadata: {
            contentType: "image/jpeg",
            cacheControl: "public, max-age=31536000",
          },
        });
        console.log(`   ✅ 完成: ${storagePath}`);
        success++;
      } catch (err: any) {
        console.error(`   ❌ 上傳失敗: ${storagePath} - ${err.message}`);
        failed++;
      }
    }
  }

  console.log("");
  console.log("─".repeat(60));
  console.log(
    `📊 上傳完成: ${success} 成功  ${skipped} 跳過  ${failed} 失敗`,
  );
  console.log("─".repeat(60));
}

// ============================================================
// 主程式
// ============================================================

async function main() {
  const applyMode = process.argv.includes("--apply");
  const uploadMode = process.argv.includes("--upload");
  const forceUpload = process.argv.includes("--force");

  // 初始化 Firebase Admin
  if (getApps().length === 0) {
    try {
      const serviceAccount = require("../serviceAccountKey.json");
      initializeApp({
        credential: cert(serviceAccount),
        storageBucket:
          serviceAccount.storageBucket ||
          `${serviceAccount.project_id}.appspot.com`,
      });
    } catch (err: any) {
      if (err.code === "MODULE_NOT_FOUND") {
        console.error("❌ 找不到 serviceAccountKey.json，請確認在專案根目錄");
        process.exit(1);
      }
      throw err;
    }
  }

  const db = getFirestore();
  const inputPath = path.join(process.cwd(), "data", "input.json");

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ 找不到 input.json: ${inputPath}`);
    process.exit(1);
  }

  console.log("🔍 fossil-index sync");
  console.log(
    applyMode
      ? "🚀 模式：執行同步 (--apply)"
      : "👁️  模式：預覽 Diff（加 --apply 才會真正寫入）",
  );
  if (uploadMode) console.log("📤 圖片上傳：已啟用 (--upload)");
  console.log("");

  // Phase 1：預處理
  console.log("📂 Phase 1：讀取並預處理 input.json...");
  console.log("   → 以 input.json 和 images/fossils 為標準，Firebase 將完全同步");
  const inputData: InputData = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
  const processed = preprocessSpecimens(inputData);
  console.log(`   → ${processed.length} 筆標本`);

  // Phase 2：拉取 Firestore 快照
  console.log("☁️  Phase 2：讀取 Firestore 現有資料...");
  const remoteSnapshot = new Map<string, any>();
  const snapshot = await db.collection("fossils").get();
  snapshot.forEach((doc) => remoteSnapshot.set(doc.id, doc.data()));
  console.log(`   → 遠端現有 ${remoteSnapshot.size} 筆標本`);

  // Phase 3：計算 Diff
  console.log("🔄 Phase 3：計算 Diff...");
  const { fossilDiffs } = await computeDiff(processed, remoteSnapshot);

  // Phase 4：印出預覽
  console.log("");
  printDiff(fossilDiffs);

  // Phase 5：寫入（需要 --apply）
  if (applyMode) {
    console.log("\n⏳ Phase 5：寫入 Firestore...");
    await applyChanges(processed, fossilDiffs, remoteSnapshot);
  } else {
    console.log("\n💡 加上 --apply 參數來執行同步");
  }

  // Phase 6：上傳圖片（需要 --upload）
  if (uploadMode) {
    if (!applyMode) {
      console.log("\n⚠️  --upload 需要搭配 --apply 使用");
    } else {
      await uploadImages(forceUpload);
    }
  }

  console.log("\n✨ 完成!");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ 執行失敗:", err);
    process.exit(1);
  });
