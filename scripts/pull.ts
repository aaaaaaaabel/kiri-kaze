/**
 * 從 Firebase 同步到本地
 * 以 Firebase 上的 Firestore 和 Storage 版本為主，更新本地的 input.json 和 images/fossils
 * 
 * 使用方式：
 *   npx tsx scripts/pull.ts              # 預覽會同步的內容
 *   npx tsx scripts/pull.ts --apply      # 執行同步（更新 input.json 和下載圖片）
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { createRequire } from "module";
import * as fs from "fs";
import * as path from "path";

const require = createRequire(import.meta.url);

// ============================================================
// 型別定義
// ============================================================

interface InputSpecimen {
  species: string;
  country: string;
  state: string;
  city?: string;
  formation?: string;
  condition?: "excellent" | "good" | "fair" | "poor";
  completeness?: number;
  catalogNumber?: string;
  collectionDate?: string;
  bodyPart?: {
    category: string;
    specific: string;
    position?: string;
    side?: "left" | "right" | null;
  };
  measurements?: {
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
  };
  description?: {
    zh?: string;
    en?: string;
  };
  tags?: string[];
  category?: string;
}

interface InputData {
  specimens: InputSpecimen[];
}

// ============================================================
// 工具函數
// ============================================================

// 從 Firestore 路徑提取檔案名稱
function extractFileName(storagePath: string): string {
  const parts = storagePath.split("/");
  return parts[parts.length - 1] || "";
}

// 從 Firestore 資料轉換為 input.json 格式
function fossilToInputSpecimen(fossilData: any): InputSpecimen {
  const location = fossilData.specimen?.location || {};
  const bodyPart = fossilData.specimen?.bodyPart;
  const measurements = fossilData.specimen?.measurements;
  const description = fossilData.description;

  const result: InputSpecimen = {
    species: fossilData.speciesRef?.name?.scientific || "",
    country: location.country || "",
    state: location.state || "",
  };

  // 只添加有值的選填欄位
  if (location.city) result.city = location.city;
  if (location.formation) result.formation = location.formation;
  if (fossilData.specimen?.condition) result.condition = fossilData.specimen.condition;
  if (fossilData.specimen?.completeness !== undefined) result.completeness = fossilData.specimen.completeness;
  if (fossilData.specimen?.catalogNumber) result.catalogNumber = fossilData.specimen.catalogNumber;
  if (fossilData.specimen?.collectionDate) result.collectionDate = fossilData.specimen.collectionDate;
  
  if (bodyPart) {
    result.bodyPart = {
      category: bodyPart.category || "other",
      specific: bodyPart.specific || "complete",
    };
    if (bodyPart.position) result.bodyPart.position = bodyPart.position;
    if (bodyPart.side !== undefined) result.bodyPart.side = bodyPart.side;
  }
  
  if (measurements && (measurements.length || measurements.width || measurements.height || measurements.weight)) {
    result.measurements = {};
    if (measurements.length) result.measurements.length = measurements.length;
    if (measurements.width) result.measurements.width = measurements.width;
    if (measurements.height) result.measurements.height = measurements.height;
    if (measurements.weight) result.measurements.weight = measurements.weight;
  }
  
  if (description && (description.zh || description.en)) {
    result.description = {};
    if (description.zh) result.description.zh = description.zh;
    if (description.en) result.description.en = description.en;
  }
  
  if (fossilData.tags && fossilData.tags.length > 0) {
    result.tags = fossilData.tags;
  }
  
  if (fossilData.category) {
    result.category = fossilData.category;
  }

  return result;
}

// ============================================================
// 主程式
// ============================================================

async function pullFromFirebase() {
  const applyMode = process.argv.includes("--apply");

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
  const bucket = getStorage().bucket();
  const publicBaseDir = path.join(process.cwd(), "public");
  const inputPath = path.join(process.cwd(), "data", "input.json");

  console.log("📥 fossil-index pull");
  console.log(
    applyMode
      ? "🚀 模式：執行同步 (--apply)"
      : "👁️  模式：預覽（加 --apply 才會真正更新本地檔案）",
  );
  console.log("   → 以 Firebase Firestore 和 Storage 為標準，本地將完全同步");
  console.log("");

  // Phase 1：讀取 Firestore 所有標本
  console.log("☁️  Phase 1：讀取 Firestore 所有標本...");
  const snapshot = await db.collection("fossils").get();
  const fossils: any[] = [];
  snapshot.forEach((doc) => {
    fossils.push(doc.data());
  });
  console.log(`   → 找到 ${fossils.length} 筆標本\n`);

  // Phase 2：轉換為 input.json 格式
  console.log("🔄 Phase 2：轉換為 input.json 格式...");
  const inputSpecimens: InputSpecimen[] = fossils.map((fossil) =>
    fossilToInputSpecimen(fossil),
  );
  const inputData: InputData = { specimens: inputSpecimens };
  console.log(`   → 轉換完成\n`);

  // Phase 3：預覽變更
  console.log("📋 Phase 3：預覽變更...");
  let existingInputData: InputData | null = null;
  if (fs.existsSync(inputPath)) {
    existingInputData = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
    console.log(`   → 現有 input.json 有 ${existingInputData.specimens.length} 筆標本`);
  } else {
    console.log(`   → input.json 不存在，將建立新檔案`);
  }
  console.log(`   → Firebase 有 ${inputSpecimens.length} 筆標本\n`);

  // Phase 4：下載圖片
  console.log("📥 Phase 4：下載圖片...");
  let downloadSuccess = 0,
    downloadSkipped = 0,
    downloadFailed = 0;

  for (const fossil of fossils) {
    const fossilSlug = fossil.slug || fossil.id;
    const allPaths: string[] = [];
    if (fossil.thumbnail) allPaths.push(fossil.thumbnail);
    if (Array.isArray(fossil.images)) {
      for (const img of fossil.images) {
        if (img.url) allPaths.push(img.url);
      }
    }

    if (allPaths.length > 0) {
      console.log(`📦 ${fossilSlug} (${allPaths.length} 個檔案)`);
    }

    for (const storagePath of allPaths) {
      const localPath = path.join(publicBaseDir, storagePath);
      const localDir = path.dirname(localPath);

      // 確保本地資料夾存在
      if (!fs.existsSync(localDir)) {
        if (applyMode) {
          fs.mkdirSync(localDir, { recursive: true });
          console.log(`   📁 建立資料夾: ${path.relative(publicBaseDir, localDir)}`);
        } else {
          console.log(`   📁 將建立資料夾: ${path.relative(publicBaseDir, localDir)}`);
        }
      }

      // 檢查本地檔案是否已存在
      if (fs.existsSync(localPath)) {
        console.log(`   ⏭️  跳過（已存在）: ${storagePath}`);
        downloadSkipped++;
        continue;
      }

      if (applyMode) {
        try {
          const file = bucket.file(storagePath);
          const [exists] = await file.exists();

          if (!exists) {
            console.log(`   ⚠️  Storage 中不存在: ${storagePath}`);
            downloadFailed++;
            continue;
          }

          // 下載檔案
          await file.download({ destination: localPath });
          console.log(`   ✅ 下載: ${storagePath}`);
          downloadSuccess++;
        } catch (err: any) {
          console.error(`   ❌ 下載失敗: ${storagePath} - ${err.message}`);
          downloadFailed++;
        }
      } else {
        console.log(`   ⬇️  將下載: ${storagePath}`);
      }
    }
  }

  console.log("");
  console.log("─".repeat(60));
  if (applyMode) {
    console.log(
      `📊 下載完成: ${downloadSuccess} 成功  ${downloadSkipped} 跳過  ${downloadFailed} 失敗`,
    );
  } else {
    console.log(
      `📊 預覽: 將下載 ${fossils.reduce((sum, f) => {
        const paths: string[] = [];
        if (f.thumbnail) paths.push(f.thumbnail);
        if (Array.isArray(f.images)) {
          for (const img of f.images) {
            if (img.url) paths.push(img.url);
          }
        }
        return sum + paths.length;
      }, 0)} 個檔案`,
    );
  }
  console.log("─".repeat(60));

  // Phase 5：刪除本地多餘的標本和圖片（確保完全同步）
  console.log("\n🗑️  Phase 5：檢查並刪除本地多餘的標本和圖片...");
  
  // 收集 Firebase 中所有標本的圖片路徑
  const firebaseImagePaths = new Set<string>();
  const firebaseFolders = new Set<string>();
  
  for (const fossil of fossils) {
    const allPaths: string[] = [];
    if (fossil.thumbnail) allPaths.push(fossil.thumbnail);
    if (Array.isArray(fossil.images)) {
      for (const img of fossil.images) {
        if (img.url) allPaths.push(img.url);
      }
    }
    
    for (const storagePath of allPaths) {
      firebaseImagePaths.add(storagePath);
      const localPath = path.join(publicBaseDir, storagePath);
      const folderPath = path.dirname(localPath);
      const relativeFolder = path.relative(publicBaseDir, folderPath);
      firebaseFolders.add(relativeFolder);
    }
  }
  
  console.log(`   → Firebase 中有 ${firebaseImagePaths.size} 個圖片檔案`);
  console.log(`   → Firebase 中有 ${firebaseFolders.size} 個資料夾`);
  
  // 檢查本地 images/fossils 資料夾
  const fossilsDir = path.join(publicBaseDir, "images", "fossils");
  const localExtraFiles: string[] = [];
  const localExtraFolders: string[] = [];
  
  function scanLocalDirectory(dirPath: string, relativePath: string = "") {
    if (!fs.existsSync(dirPath)) return;
    
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const currentRelative = relativePath ? `${relativePath}/${entry.name}` : entry.name;
      const storagePath = `images/fossils/${currentRelative}`;
      
      if (entry.isFile()) {
        // 檢查是否是圖片檔案
        if (/\.(jpg|jpeg|png|webp)$/i.test(entry.name)) {
          if (!firebaseImagePaths.has(storagePath)) {
            localExtraFiles.push(storagePath);
          }
        }
      } else if (entry.isDirectory()) {
        // 檢查資料夾是否在 Firebase 中
        const folderRelative = `images/fossils/${currentRelative}`;
        const isInFirebase = Array.from(firebaseFolders).some(folder => {
          return folder === currentRelative || 
                 folder.startsWith(currentRelative + "/") ||
                 currentRelative.startsWith(folder + "/");
        });
        
        if (!isInFirebase) {
          localExtraFolders.push(currentRelative);
        } else {
          // 遞迴檢查子資料夾
          scanLocalDirectory(fullPath, currentRelative);
        }
      }
    }
  }
  
  if (fs.existsSync(fossilsDir)) {
    scanLocalDirectory(fossilsDir);
  }
  
  if (localExtraFiles.length > 0 || localExtraFolders.length > 0) {
    console.log(`   ⚠️  發現 ${localExtraFiles.length} 個多餘的圖片檔案`);
    console.log(`   ⚠️  發現 ${localExtraFolders.length} 個多餘的資料夾`);
    
    if (applyMode) {
      // 刪除多餘的檔案
      for (const filePath of localExtraFiles) {
        const fullPath = path.join(publicBaseDir, filePath);
        try {
          fs.unlinkSync(fullPath);
          console.log(`   ✅ 刪除檔案: ${filePath}`);
        } catch (err: any) {
          console.error(`   ❌ 刪除檔案失敗: ${filePath} - ${err.message}`);
        }
      }
      
      // 刪除多餘的資料夾（從最深層開始）
      const sortedFolders = localExtraFolders.sort((a, b) => b.split("/").length - a.split("/").length);
      for (const folderPath of sortedFolders) {
        const fullPath = path.join(fossilsDir, folderPath);
        try {
          if (fs.existsSync(fullPath)) {
            fs.rmSync(fullPath, { recursive: true, force: true });
            console.log(`   ✅ 刪除資料夾: ${folderPath}`);
          }
        } catch (err: any) {
          console.error(`   ❌ 刪除資料夾失敗: ${folderPath} - ${err.message}`);
        }
      }
      
      console.log(`   ✅ 已刪除 ${localExtraFiles.length} 個檔案和 ${localExtraFolders.length} 個資料夾`);
    } else {
      console.log("   💡 加上 --apply 參數來刪除這些多餘的檔案和資料夾");
    }
  } else {
    console.log("   ✅ 本地沒有多餘的檔案或資料夾");
  }

  // Phase 6：更新 input.json
  if (applyMode) {
    console.log("\n💾 Phase 6：更新 input.json...");
    
    // 備份現有的 input.json
    if (fs.existsSync(inputPath)) {
      const backupPath = `${inputPath}.backup.${Date.now()}`;
      fs.copyFileSync(inputPath, backupPath);
      console.log(`   💾 已備份現有 input.json 到: ${backupPath}`);
    }

    // 寫入新的 input.json
    fs.writeFileSync(
      inputPath,
      JSON.stringify(inputData, null, 2) + "\n",
      "utf-8",
    );
    console.log(`   ✅ 已更新 input.json (${inputSpecimens.length} 筆標本)`);
  } else {
    console.log("\n💡 加上 --apply 參數來執行同步");
  }

  console.log("\n✨ 完成!");
}

pullFromFirebase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ 執行失敗:", err);
    process.exit(1);
  });

