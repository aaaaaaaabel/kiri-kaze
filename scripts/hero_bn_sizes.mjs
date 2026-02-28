/**
 * 掃描 public/images/hero_bn 內圖片，輸出每張的檔名與尺寸到 data/hero_bn.json
 * 使用方式：在 fossil-Index 目錄下執行 node scripts/hero_bn_sizes.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const imageDir = path.join(root, "public", "images", "hero_bn");
const outPath = path.join(root, "data", "hero_bn.json");

let sizeOf;
try {
  const mod = await import("image-size");
  sizeOf = mod.default;
} catch {
  console.warn("請先安裝 image-size: npm i -D image-size");
  process.exit(1);
}

if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
  console.log("已建立 public/images/hero_bn，請放入 20 張圖片後再執行此腳本。");
  fs.writeFileSync(outPath, "[]\n", "utf8");
  console.log("已寫入 data/hero_bn.json 為空陣列。");
  process.exit(0);
}

const exts = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const files = fs.readdirSync(imageDir)
  .filter((f) => exts.some((e) => f.toLowerCase().endsWith(e)))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

if (files.length === 0) {
  console.log("public/images/hero_bn 內尚無圖片，已寫入空陣列。");
  fs.writeFileSync(outPath, "[]\n", "utf8");
  process.exit(0);
}

const result = [];
for (const file of files) {
  const full = path.join(imageDir, file);
  try {
    const buffer = fs.readFileSync(full);
    const dim = sizeOf(buffer);
    result.push({
      file,
      width: dim.width ?? 0,
      height: dim.height ?? 0,
    });
  } catch (err) {
    // 檔名若含尺寸如 1280x854，可嘗試解析
    const match = file.match(/-(\d+)x(\d+)\.(jpg|jpeg|png|webp|gif)$/i);
    if (match) {
      result.push({
        file,
        width: parseInt(match[1], 10),
        height: parseInt(match[2], 10),
      });
    } else {
      console.warn(`跳過 ${file}:`, err.message);
    }
  }
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(result, null, 2), "utf8");
console.log(`已寫入 data/hero_bn.json，共 ${result.length} 張圖片。`);
