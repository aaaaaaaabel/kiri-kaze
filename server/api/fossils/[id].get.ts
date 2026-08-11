import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "缺少 id" });

  const [fossil] = await db.select().from(schema.fossils).where(eq(schema.fossils.id, id));
  if (!fossil || !fossil.isPublic) throw createError({ statusCode: 404, statusMessage: `找不到 ID 為 ${id} 的化石` });
  const dto = await attachSpeciesRef(fossil);
  if (!dto) throw createError({ statusCode: 404, statusMessage: `找不到 ID 為 ${id} 的化石` });
  return dto;
});
