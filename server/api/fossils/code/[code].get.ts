import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, "code");
  if (!code) throw createError({ statusCode: 400, statusMessage: "缺少 code" });

  const [fossil] = await db.select().from(schema.fossils).where(eq(schema.fossils.shortCode, code));
  if (!fossil || !fossil.isPublic) throw createError({ statusCode: 404, statusMessage: `找不到 code 為 ${code} 的化石` });
  const dto = await attachSpeciesRef(fossil);
  if (!dto) throw createError({ statusCode: 404, statusMessage: `找不到 code 為 ${code} 的化石` });
  return dto;
});
