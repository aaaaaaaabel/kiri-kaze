import { eq } from "drizzle-orm";

/** 已發布的活動列表，依日期由早到晚排序 */
export default defineEventHandler(async () => {
  const rows = await db.select().from(schema.events).where(eq(schema.events.isPublished, true));
  return rows.sort((a, b) => a.date.localeCompare(b.date));
});
