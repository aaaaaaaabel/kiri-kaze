/**
 * 開發用一次性搬遷端點：把 public/images/fossils、public/images/case 底下的圖片
 * 上傳進 NuxtHub blob 儲存（本機模擬、正式環境是 Cloudflare R2），
 * 並把資料庫裡對應的圖片路徑欄位（thumbnail/cover/images[]/representativeImage/image）
 * 從 /images/... 改成 /cdn/images/...。
 *
 * 使用方式：npm run dev 起服務後 `curl -X POST localhost:3000/api/_dev/migrate-images`
 * 可重複執行（blob key 固定、資料庫路徑已經是新的就不會再變），適合分批補跑。
 * 正式環境（非 import.meta.dev）會回 404，見 assertDevOnly。
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { eq } from "drizzle-orm";

function listImageFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listImageFiles(fullPath));
    } else if (/\.(jpg|jpeg|png|webp|svg)$/i.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

function contentTypeFor(file: string): string {
  if (/\.svg$/i.test(file)) return "image/svg+xml";
  if (/\.png$/i.test(file)) return "image/png";
  if (/\.webp$/i.test(file)) return "image/webp";
  return "image/jpeg";
}

export default defineEventHandler(async () => {
  assertDevOnly();

  const publicDir = path.join(process.cwd(), "public");
  const targetDirs = [path.join(publicDir, "images", "fossils"), path.join(publicDir, "images", "case")];
  const files = targetDirs.flatMap((dir) => listImageFiles(dir));

  // 舊路徑（/images/...） → 新路徑（/cdn/images/...）的對照表
  const pathMap = new Map<string, string>();

  for (const filePath of files) {
    const relative = path.relative(publicDir, filePath).split(path.sep).join("/");
    const buffer = fs.readFileSync(filePath);
    await blob.put(relative, buffer, {
      contentType: contentTypeFor(filePath),
      access: "public",
      addRandomSuffix: false,
    });
    pathMap.set(`/${relative}`, `/cdn/${relative}`);
  }

  function remap(value: string | null | undefined): string | null | undefined {
    if (!value) return value;
    return pathMap.get(value) ?? value;
  }

  let updatedFossils = 0;
  const fossilRows = await db.select().from(schema.fossils);
  for (const row of fossilRows) {
    const newThumbnail = remap(row.thumbnail) as string;
    const newImages = row.images.map((img) => ({ ...img, url: remap(img.url) ?? img.url }));
    if (newThumbnail === row.thumbnail && JSON.stringify(newImages) === JSON.stringify(row.images)) continue;
    await db
      .update(schema.fossils)
      .set({ thumbnail: newThumbnail, images: newImages })
      .where(eq(schema.fossils.id, row.id));
    updatedFossils++;
  }

  let updatedSpecies = 0;
  const speciesRows = await db.select().from(schema.species);
  for (const row of speciesRows) {
    const newRepresentative = remap(row.representativeImage);
    if (newRepresentative === row.representativeImage) continue;
    await db.update(schema.species).set({ representativeImage: newRepresentative }).where(eq(schema.species.id, row.id));
    updatedSpecies++;
  }

  let updatedProjects = 0;
  const projectRows = await db.select().from(schema.projects);
  for (const row of projectRows) {
    const newThumbnail = remap(row.thumbnail) as string;
    const newCover = remap(row.cover);
    const images = row.images as { url: string; [key: string]: unknown }[];
    const newImages = images.map((img) => ({ ...img, url: remap(img.url) ?? img.url }));
    if (
      newThumbnail === row.thumbnail &&
      newCover === row.cover &&
      JSON.stringify(newImages) === JSON.stringify(row.images)
    )
      continue;
    await db
      .update(schema.projects)
      .set({ thumbnail: newThumbnail, cover: newCover, images: newImages })
      .where(eq(schema.projects.id, row.id));
    updatedProjects++;
  }

  let updatedEvents = 0;
  const eventRows = await db.select().from(schema.events);
  for (const row of eventRows) {
    const newImage = remap(row.image) as string;
    if (newImage === row.image) continue;
    await db.update(schema.events).set({ image: newImage }).where(eq(schema.events.id, row.id));
    updatedEvents++;
  }

  return {
    filesUploaded: files.length,
    updatedFossils,
    updatedSpecies,
    updatedProjects,
    updatedEvents,
  };
});
