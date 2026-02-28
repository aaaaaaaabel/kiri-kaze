/**
 * 依 Firestore bookings 實際數量，重算並更新每個活動的 registeredCount。
 * 適用情境：在 Firestore 後台手動刪除報名後，前台人數不會自動減少，執行此腳本可同步。
 *
 * 使用方式：
 *   npx tsx scripts/sync-event-counts.ts        # 預覽會更新的數量
 *   npx tsx scripts/sync-event-counts.ts --apply  # 執行更新
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

if (getApps().length === 0) {
  try {
    const serviceAccount = require("../serviceAccountKey.json");
    initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "MODULE_NOT_FOUND") {
      console.error("❌ 找不到 serviceAccountKey.json，請確認在專案根目錄");
      process.exit(1);
    }
    throw err;
  }
}

const db = getFirestore();
const apply = process.argv.includes("--apply");

async function main() {
  const eventsSnap = await db.collection("events").get();
  const bookingsSnap = await db.collection("bookings").get();

  const countByEventId: Record<string, number> = {};
  bookingsSnap.docs.forEach((d) => {
    const eventId = d.data().eventId;
    if (eventId) countByEventId[eventId] = (countByEventId[eventId] ?? 0) + 1;
  });

  console.log("Events and registeredCount sync:\n");
  const updates: { id: string; title: string; current: number; actual: number }[] = [];

  for (const doc of eventsSnap.docs) {
    const data = doc.data();
    const current = Number(data.registeredCount) || 0;
    const actual = countByEventId[doc.id] ?? 0;
    if (current !== actual) {
      updates.push({
        id: doc.id,
        title: (data.title as string) || doc.id,
        current,
        actual,
      });
    }
  }

  if (updates.length === 0) {
    console.log("All event registeredCount values are already in sync.");
    return;
  }

  for (const u of updates) {
    console.log(`  ${u.title} (${u.id}): ${u.current} → ${u.actual}`);
  }

  if (apply) {
    console.log("\nApplying updates...");
    for (const u of updates) {
      await db.collection("events").doc(u.id).update({ registeredCount: u.actual });
      console.log(`  Updated ${u.title}`);
    }
    console.log("Done.");
  } else {
    console.log("\nRun with --apply to write changes to Firestore.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
