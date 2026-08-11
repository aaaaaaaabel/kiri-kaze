import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "缺少 id" });

  const [row] = await db.select().from(schema.projects).where(eq(schema.projects.id, id));
  if (!row || !row.isPublic) throw createError({ statusCode: 404, statusMessage: `找不到 ID 為 ${id} 的專案` });
  return row;
});
