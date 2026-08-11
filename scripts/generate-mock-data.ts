/**
 * 產生本機 mock 資料（species / fossils / projects / events）
 * 用途：用本機 public/images 底下已存在的圖片 + data/input.json 現有欄位，
 * 組出可以直接餵給 seed 流程的 JSON。
 *
 * 使用方式：
 *   npx tsx scripts/generate-mock-data.ts
 *
 * 輸出：data/mock/species.json、data/mock/fossils.json、
 *       data/mock/projects.json、data/mock/events.json
 *
 * 新增標本時可以安全重跑：物種（species）如果 slug 已經存在於現有的
 * data/mock/species.json，會保留原本手動校正過的 name/taxonomy/period/description，
 * 只重算 specimenCount；只有全新物種才會產生「待補」佔位內容。
 * 但 fossils/projects/events 三份**每次重跑都會整份重新產生**（標本欄位以
 * data/input.json 為準，作品集/活動目前還沒有對應的「輸入來源」檔案，
 * 手動改過 data/mock/projects.json、events.json 後不要重跑這個腳本，
 * 直接編輯那兩份 JSON 就好）。
 */

import * as fs from "fs";
import * as path from "path";
import { computeFossilNaming } from "./lib/fossil-naming";
import type {
  BodyPartCategory,
  FossilCategory,
  SpecimenCondition,
} from "../app/types/fossil";

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, "public");
const FOSSILS_IMAGE_DIR = path.join(PUBLIC_DIR, "images", "fossils");
const CASE_IMAGE_DIR = path.join(PUBLIC_DIR, "images", "case");
const MOCK_DIR = path.join(ROOT, "data", "mock");

let sizeOf: (buffer: Buffer) => { width?: number; height?: number };

// ============================================================
// input.json 型別
// ============================================================

interface IInputSpecimen {
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
  measurements?: { length?: number; width?: number; height?: number; weight?: number };
  description?: { zh?: string; en?: string };
  tags?: string[];
  category?: FossilCategory;
}

interface IInputData {
  specimens: IInputSpecimen[];
}

/** data/mock/fossils.json 單筆記錄的形狀（對齊 buildFossilsAndSpecies 實際 push 的欄位） */
interface IMockFossilRecord {
  id: string;
  slug: string;
  shortCode: string;
  speciesRef: { id: string; slug: string; name: { zh: string; scientific: string } };
  specimen: Record<string, unknown>;
  images: Array<{ url: string; width: number; height: number; type: string; order: number }>;
  thumbnail: string;
  description?: { zh: string; en?: string };
  tags: string[];
  category: string;
  likeCount: number;
  viewCount: number;
  isPublic: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

/** data/mock/species.json 單筆記錄的形狀：欄位由手動校正內容決定，這裡只依賴 slug */
interface IMockSpeciesRecord {
  slug: string;
  [key: string]: unknown;
}

// ============================================================
// 分類 → 教科書等級的門/綱（僅到門綱層級，不編造更細節的分類）
// ============================================================

const CATEGORY_TAXONOMY: Record<string, { phylum: string; classLabel: string }> = {
  trilobite: { phylum: "節肢動物門", classLabel: "三葉蟲綱" },
  echinoid: { phylum: "棘皮動物門", classLabel: "海膽綱" },
  crinoid: { phylum: "棘皮動物門", classLabel: "海百合綱" },
  ammonite: { phylum: "軟體動物門", classLabel: "頭足綱" },
};

function getImageFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /\.(jpg|jpeg|png|webp|svg)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function getImageDimensions(filePath: string): { width: number; height: number } {
  if (/\.svg$/i.test(filePath)) return { width: 0, height: 0 };
  try {
    const buffer = fs.readFileSync(filePath);
    const dim = sizeOf(buffer);
    return { width: dim.width ?? 0, height: dim.height ?? 0 };
  } catch {
    return { width: 0, height: 0 };
  }
}

// ============================================================
// Species / Fossils
// ============================================================

function loadExistingSpecies(): Map<string, IMockSpeciesRecord> {
  const outPath = path.join(MOCK_DIR, "species.json");
  if (!fs.existsSync(outPath)) return new Map();
  try {
    const existing = JSON.parse(fs.readFileSync(outPath, "utf-8")) as IMockSpeciesRecord[];
    return new Map(existing.map((s) => [s.slug, s]));
  } catch {
    return new Map();
  }
}

function buildFossilsAndSpecies(inputData: IInputData) {
  const naming = computeFossilNaming(inputData.specimens);
  const fossils: IMockFossilRecord[] = [];
  const speciesBySlug = new Map<string, { scientific: string; category: string }>();
  const existingSpecies = loadExistingSpecies();

  inputData.specimens.forEach((input, index) => {
    const { speciesSlug, locationId, numStr, fossilSlug, shortCode } = naming[index]!;

    if (!speciesBySlug.has(speciesSlug)) {
      speciesBySlug.set(speciesSlug, {
        scientific: input.species,
        category: input.category ?? "other",
      });
    }

    const bodyPartFolder =
      input.bodyPart && input.bodyPart.category !== "other" ? input.bodyPart.category : null;
    const folder = bodyPartFolder
      ? path.join(FOSSILS_IMAGE_DIR, speciesSlug, locationId, numStr, bodyPartFolder)
      : path.join(FOSSILS_IMAGE_DIR, speciesSlug, locationId, numStr);
    const urlBase = bodyPartFolder
      ? `/images/fossils/${speciesSlug}/${locationId}/${numStr}/${bodyPartFolder}`
      : `/images/fossils/${speciesSlug}/${locationId}/${numStr}`;

    const files = getImageFiles(folder);
    const thumbnailFile = files.find((f) => f.toLowerCase() === "thumbnail.jpg");
    if (!thumbnailFile) {
      console.warn(`⚠️  跳過 ${fossilSlug}：找不到 thumbnail.jpg（${folder}）`);
      return;
    }

    const images = files
      .filter((f) => f.toLowerCase() !== "thumbnail.jpg")
      .map((file, i) => {
        const { width, height } = getImageDimensions(path.join(folder, file));
        return {
          url: `${urlBase}/${file}`,
          width,
          height,
          type: file.toLowerCase().includes("main") ? "main" : "detail",
          order: i + 1,
        };
      });

    fossils.push({
      id: fossilSlug,
      slug: fossilSlug,
      shortCode,
      speciesRef: {
        id: speciesSlug,
        slug: speciesSlug,
        name: { zh: input.species, scientific: input.species },
      },
      specimen: {
        type: input.bodyPart && input.bodyPart.specific !== "complete"
          ? "isolated-element"
          : "complete-skeleton",
        bodyPart: input.bodyPart,
        completeness: input.completeness ?? 100,
        condition: input.condition ?? "good",
        catalogNumber: input.catalogNumber,
        collectionDate: input.collectionDate,
        location: {
          locationId,
          country: input.country,
          state: input.state,
          city: input.city,
          formation: input.formation,
          displayName: [input.country, input.state, input.city].filter(Boolean).join(", "),
        },
        measurements: input.measurements,
      },
      images,
      thumbnail: `${urlBase}/thumbnail.jpg`,
      description: input.description
        ? { zh: input.description.zh ?? "", en: input.description.en }
        : undefined,
      tags: input.tags ?? [],
      category: input.category ?? "other",
      likeCount: 0,
      viewCount: 0,
      isPublic: true,
      featured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  const species = Array.from(speciesBySlug.entries()).map(([slug, info]) => {
    const specimenCount = fossils.filter((f) => f.speciesRef.slug === slug).length;

    // 物種已經存在（可能已經手動校正過 name/taxonomy/period/description）→ 保留原內容，只重算 specimenCount
    const existing = existingSpecies.get(slug);
    if (existing) {
      return { ...existing, specimenCount, updatedAt: new Date().toISOString() };
    }

    const parts = info.scientific.split(" ");
    const genus = parts[0] ?? info.scientific;
    const speciesEpithet = parts[1] ?? "sp.";
    const taxonomy = CATEGORY_TAXONOMY[info.category] ?? { phylum: "待補", classLabel: "待補" };

    return {
      id: slug,
      slug,
      name: { zh: info.scientific, en: info.scientific, scientific: info.scientific },
      taxonomy: {
        kingdom: "動物界",
        phylum: taxonomy.phylum,
        class: taxonomy.classLabel,
        order: "待補",
        family: "待補",
        genus,
        species: speciesEpithet,
      },
      period: { era: "待補", period: "待補", age: "待補" },
      description: {
        zh: `${info.scientific}，目前資料仍在整理中，正式的中文名稱、分類與地質年代待補充。`,
      },
      specimenCount,
      tags: [],
      category: info.category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  return { fossils, species };
}

// ============================================================
// Projects（作品集）
// ============================================================

function humanizeFolderName(folder: string): string {
  if (folder === folder.toUpperCase()) return folder; // VI、G 等縮寫保留原樣
  return folder.charAt(0).toUpperCase() + folder.slice(1);
}

// cover/ 資料夾內沒有遵循 "{slug}_cover.jpg" 命名的專案，個別對應到它們的封面檔
const COVER_OVERRIDES: Record<string, string> = {
  branding: "cc40fe120734321.60b79557520e1.jpg",
  mc: "ffd47c118891187.609268a535f84.png",
};

function buildProjects() {
  if (!fs.existsSync(CASE_IMAGE_DIR)) return [];
  const folders = fs
    .readdirSync(CASE_IMAGE_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "cover")
    .map((d) => d.name)
    .sort();

  return folders.map((folder) => {
    const slug = folder.toLowerCase();
    const detailFiles = getImageFiles(path.join(CASE_IMAGE_DIR, folder));
    const images = detailFiles.map((file, i) => ({
      url: `/images/case/${folder}/${file}`,
      type: "detail",
      order: i + 1,
    }));

    // cover/ 檔名跟著資料夾原始大小寫命名（例如 G_cover.jpg、VI_cover.jpg），不是 slug 的小寫
    const coverOverride = COVER_OVERRIDES[folder];
    const thumbnail = coverOverride
      ? `/images/case/cover/${coverOverride}`
      : fs.existsSync(path.join(CASE_IMAGE_DIR, "cover", `${folder}_cover.jpg`))
        ? `/images/case/cover/${folder}_cover.jpg`
        : images[0]?.url ?? "";

    return {
      id: slug,
      slug,
      title: humanizeFolderName(folder),
      company: "",
      role: "",
      period: "",
      description: "",
      technologies: [],
      thumbnail,
      images,
      category: "work",
      featured: false,
      tags: [],
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
}

// ============================================================
// Events（活動，先建 1 筆佔位）
// ============================================================

function buildEvents() {
  return [
    {
      id: "placeholder-event",
      slug: "placeholder-event",
      title: "",
      description: "",
      date: "",
      time: "",
      location: "",
      image: "/images/events/workshop_bn.jpg",
      capacity: 20,
      registeredCount: 0,
      isPublished: true,
      createdAt: new Date().toISOString(),
    },
  ];
}

// ============================================================
// 主程式
// ============================================================

async function main() {
  const mod = await import("image-size");
  sizeOf = mod.default;

  const inputPath = path.join(ROOT, "data", "input.json");
  const inputData: IInputData = JSON.parse(fs.readFileSync(inputPath, "utf-8"));

  const { fossils, species } = buildFossilsAndSpecies(inputData);
  const projects = buildProjects();
  const events = buildEvents();

  fs.mkdirSync(MOCK_DIR, { recursive: true });
  fs.writeFileSync(path.join(MOCK_DIR, "species.json"), JSON.stringify(species, null, 2) + "\n");
  fs.writeFileSync(path.join(MOCK_DIR, "fossils.json"), JSON.stringify(fossils, null, 2) + "\n");
  fs.writeFileSync(path.join(MOCK_DIR, "projects.json"), JSON.stringify(projects, null, 2) + "\n");
  fs.writeFileSync(path.join(MOCK_DIR, "events.json"), JSON.stringify(events, null, 2) + "\n");

  console.log(`✅ species.json：${species.length} 筆`);
  console.log(`✅ fossils.json：${fossils.length} 筆`);
  console.log(`✅ projects.json：${projects.length} 筆`);
  console.log(`✅ events.json：${events.length} 筆`);
}

main().catch((err) => {
  console.error("❌ 執行失敗:", err);
  process.exit(1);
});
