import { eq, and, asc, desc } from "drizzle-orm";

/**
 * 作品集專案列表
 * Query: publicOnly（預設 true）、featuredOnly（預設 false）、category、
 *        sortBy（createdAt|updatedAt|period，預設 createdAt）、sortDirection（預設 desc）、
 *        pageSize（預設 20）、lastDocId（cursor）
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const publicOnly = query.publicOnly !== "false";
  const featuredOnly = query.featuredOnly === "true";
  const category = typeof query.category === "string" ? query.category : undefined;
  const sortDirection = query.sortDirection === "asc" ? "asc" : "desc";
  const sortBy = query.sortBy === "updatedAt" ? "updatedAt" : query.sortBy === "period" ? "period" : "createdAt";
  const pageSize = query.pageSize ? Number(query.pageSize) : 20;
  const lastDocId = typeof query.lastDocId === "string" ? query.lastDocId : undefined;

  const conditions = [];
  if (publicOnly) conditions.push(eq(schema.projects.isPublic, true));
  if (featuredOnly) conditions.push(eq(schema.projects.featured, true));
  if (category) conditions.push(eq(schema.projects.category, category));

  const orderColumn =
    sortBy === "updatedAt"
      ? schema.projects.updatedAt
      : sortBy === "period"
        ? schema.projects.period
        : schema.projects.createdAt;
  const orderFn = sortDirection === "asc" ? asc : desc;

  let rows = await db
    .select()
    .from(schema.projects)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(orderFn(orderColumn));

  if (lastDocId) {
    const cursorIndex = rows.findIndex((r) => r.id === lastDocId);
    if (cursorIndex >= 0) rows = rows.slice(cursorIndex + 1);
  }
  if (pageSize) rows = rows.slice(0, pageSize);

  return rows;
});
