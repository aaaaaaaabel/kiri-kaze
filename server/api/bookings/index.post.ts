import { eq, sql } from "drizzle-orm";

/** 建立活動報名紀錄，並將該活動的 registeredCount 原子性 +1 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { eventId, eventTitle, uid, name, email, phone, notes } = body ?? {};

  if (!eventId || !eventTitle || !name || !email || !phone) {
    throw createError({ statusCode: 400, statusMessage: "缺少必填欄位" });
  }

  await db.insert(schema.bookings).values({
    eventId,
    eventTitle,
    uid: uid ?? null,
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    phone: String(phone).trim(),
    notes: notes ? String(notes).trim() : null,
    createdAt: new Date(),
  });

  await db
    .update(schema.events)
    .set({ registeredCount: sql`${schema.events.registeredCount} + 1` })
    .where(eq(schema.events.id, eventId));

  return { success: true };
});
