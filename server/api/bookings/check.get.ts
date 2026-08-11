import { and, eq } from "drizzle-orm";

/**
 * 檢查是否已報名過某活動
 * Query: eventId（必填）+ uid 或 email（至少一個）
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const eventId = typeof query.eventId === "string" ? query.eventId : undefined;
  const uid = typeof query.uid === "string" ? query.uid : undefined;
  const email = typeof query.email === "string" ? query.email.trim().toLowerCase() : undefined;

  if (!eventId || (!uid && !email)) {
    throw createError({ statusCode: 400, statusMessage: "需要 eventId 加上 uid 或 email" });
  }

  const conditions = [eq(schema.bookings.eventId, eventId)];
  conditions.push(uid ? eq(schema.bookings.uid, uid) : eq(schema.bookings.email, email as string));

  const rows = await db.select().from(schema.bookings).where(and(...conditions));
  return { exists: rows.length > 0 };
});
