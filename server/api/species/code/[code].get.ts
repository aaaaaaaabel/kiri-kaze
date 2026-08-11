import { eq } from "drizzle-orm";

/** 透過標本的 shortCode 反查物種 */
export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, "code");
  if (!code) throw createError({ statusCode: 400, statusMessage: "缺少 code" });

  const [fossil] = await db.select().from(schema.fossils).where(eq(schema.fossils.shortCode, code));
  if (!fossil) throw createError({ statusCode: 404, statusMessage: `找不到 code 為 ${code} 的標本` });

  const [row] = await db.select().from(schema.species).where(eq(schema.species.id, fossil.speciesId));
  if (!row) throw createError({ statusCode: 404, statusMessage: "找不到對應的物種" });
  return row;
});
