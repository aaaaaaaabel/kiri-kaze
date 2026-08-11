/**
 * 開發用一次性 seed 端點：把 data/mock/*.json 灌進本機 D1。
 * 使用方式：npm run dev 起服務後 `curl -X POST localhost:3000/api/_dev/seed`
 * 重複呼叫會先清空對應表再重新灌入（避免 unique constraint 衝突）。
 * 正式環境（非 import.meta.dev）會回 404，見 assertDevOnly。
 */

import speciesData from "~~/data/mock/species.json";
import fossilsData from "~~/data/mock/fossils.json";
import projectsData from "~~/data/mock/projects.json";
import eventsData from "~~/data/mock/events.json";

export default defineEventHandler(async () => {
  assertDevOnly();

  await db.delete(schema.fossils);
  await db.delete(schema.species);
  await db.delete(schema.bookings);
  await db.delete(schema.events);
  await db.delete(schema.projects);

  // JSON import 裡的字串欄位（如 specimen.type、category）會被 TS 推斷成寬鬆的 string，
  // 跟 schema.ts 用 .$type<>() 標注的字面量聯合型別（SpecimenType、FossilCategory…）對不上，
  // 這裡用 unknown 中介 cast 一次，實際資料形狀由 generate-mock-data.ts 保證正確。
  await db.insert(schema.species).values(
    speciesData.map((item) => ({
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    })) as unknown as (typeof schema.species.$inferInsert)[],
  );

  await db.insert(schema.fossils).values(
    fossilsData.map((item) => ({
      id: item.id,
      slug: item.slug,
      shortCode: item.shortCode,
      speciesId: item.speciesRef.id,
      specimen: item.specimen,
      images: item.images,
      thumbnail: item.thumbnail,
      description: item.description,
      tags: item.tags,
      category: item.category,
      likeCount: item.likeCount,
      viewCount: item.viewCount,
      isPublic: item.isPublic,
      featured: item.featured,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    })) as unknown as (typeof schema.fossils.$inferInsert)[],
  );

  await db.insert(schema.projects).values(
    projectsData.map((item) => ({
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    })),
  );

  await db.insert(schema.events).values(
    eventsData.map((item) => ({
      ...item,
      createdAt: new Date(item.createdAt),
    })),
  );

  return {
    species: speciesData.length,
    fossils: fossilsData.length,
    projects: projectsData.length,
    events: eventsData.length,
  };
});
