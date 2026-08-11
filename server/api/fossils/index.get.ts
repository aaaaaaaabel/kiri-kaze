import { eq, and, asc, desc, inArray } from "drizzle-orm";

/**
 * 化石列表查詢
 * Query: publicOnly（預設 true）、featuredOnly（預設 false）、
 *        sortBy（createdAt|updatedAt，預設 createdAt；scientificName 目前無實際使用，一律 fallback 為 createdAt）、
 *        sortDirection（asc|desc，預設 desc）、pageSize、lastDocId（cursor）
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const publicOnly = query.publicOnly !== "false";
  const featuredOnly = query.featuredOnly === "true";
  const sortDirection = query.sortDirection === "asc" ? "asc" : "desc";
  const sortBy = query.sortBy === "updatedAt" ? "updatedAt" : "createdAt";
  const pageSize = query.pageSize ? Number(query.pageSize) : undefined;
  const lastDocId = typeof query.lastDocId === "string" ? query.lastDocId : undefined;

  const conditions = [];
  if (publicOnly) conditions.push(eq(schema.fossils.isPublic, true));
  if (featuredOnly) conditions.push(eq(schema.fossils.featured, true));

  const orderColumn = sortBy === "updatedAt" ? schema.fossils.updatedAt : schema.fossils.createdAt;
  const orderFn = sortDirection === "asc" ? asc : desc;

  let rows = await db
    .select()
    .from(schema.fossils)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(orderFn(orderColumn));

  if (lastDocId) {
    const cursorIndex = rows.findIndex((r) => r.id === lastDocId);
    if (cursorIndex >= 0) rows = rows.slice(cursorIndex + 1);
  }
  if (pageSize && pageSize > 0) rows = rows.slice(0, pageSize);

  const speciesIds = [...new Set(rows.map((r) => r.speciesId))];
  const speciesRows = speciesIds.length
    ? await db.select().from(schema.species).where(inArray(schema.species.id, speciesIds))
    : [];
  const speciesMap = new Map(speciesRows.map((s) => [s.id, s]));

  return rows
    .map((row) => {
      const speciesRow = speciesMap.get(row.speciesId);
      return speciesRow ? toFossilDTO(row, speciesRow) : null;
    })
    .filter((fossil) => fossil !== null);
});
