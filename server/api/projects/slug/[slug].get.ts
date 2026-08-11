import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  if (!slug) throw createError({ statusCode: 400, statusMessage: "缺少 slug" });

  const [row] = await db.select().from(schema.projects).where(eq(schema.projects.slug, slug));
  if (!row || !row.isPublic) throw createError({ statusCode: 404, statusMessage: `找不到 slug 為 ${slug} 的專案` });
  return row;
});
