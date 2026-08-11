import { eq, and, ne } from "drizzle-orm";

/**
 * 依物種 slug 取得所有公開標本
 * Query: excludeId（排除某一筆，供「推薦相關標本」使用）、limit（上限筆數）
 */
export default defineEventHandler(async (event) => {
  const speciesSlug = getRouterParam(event, "speciesSlug");
  if (!speciesSlug) throw createError({ statusCode: 400, statusMessage: "缺少 speciesSlug" });

  const query = getQuery(event);
  const excludeId = typeof query.excludeId === "string" ? query.excludeId : undefined;
  const limit = query.limit ? Number(query.limit) : undefined;

  const [speciesRow] = await db.select().from(schema.species).where(eq(schema.species.slug, speciesSlug));
  if (!speciesRow) return [];

  const conditions = [eq(schema.fossils.speciesId, speciesRow.id), eq(schema.fossils.isPublic, true)];
  if (excludeId) conditions.push(ne(schema.fossils.id, excludeId));

  let rows = await db.select().from(schema.fossils).where(and(...conditions));
  if (limit && limit > 0) rows = rows.slice(0, limit);

  return rows.map((row) => toFossilDTO(row, speciesRow));
});
