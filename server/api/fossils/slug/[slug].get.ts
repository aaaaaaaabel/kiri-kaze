import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  if (!slug) throw createError({ statusCode: 400, statusMessage: "缺少 slug" });

  const [fossil] = await db.select().from(schema.fossils).where(eq(schema.fossils.slug, slug));
  if (!fossil || !fossil.isPublic) throw createError({ statusCode: 404, statusMessage: `找不到 slug 為 ${slug} 的化石` });
  const dto = await attachSpeciesRef(fossil);
  if (!dto) throw createError({ statusCode: 404, statusMessage: `找不到 slug 為 ${slug} 的化石` });
  return dto;
});
