/**
 * 活動 Composable（mock 版本）
 * Firebase 連不上期間，讀取 data/mock/events.json 取代 Firestore；
 * 報名紀錄改用 localStorage 暫存，讓報名流程可以跑通但不需要真的後端。
 */

import type { IEvent, IBookingInput } from "~/composables/useEvents";
import rawEvents from "~~/data/mock/events.json";

const BOOKINGS_STORAGE_KEY = "mock_event_bookings";

interface IMockBooking {
  eventId: string;
  uid: string | null;
  email: string;
}

function normalizeEvents(list: typeof rawEvents): IEvent[] {
  return list.map((item) => ({
    ...item,
    createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
  })) as unknown as IEvent[];
}

const eventsStore: IEvent[] = normalizeEvents(rawEvents);

function loadBookings(): IMockBooking[] {
  if (import.meta.server || typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as IMockBooking[]) : [];
  } catch {
    return [];
  }
}

function saveBookings(bookings: IMockBooking[]) {
  if (import.meta.server || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
  } catch {
    // ignore
  }
}

/**
 * 使用活動資料的 Composable（mock 版本）
 */
export function useMockEvents() {
  /** 將圖片路徑轉成可顯示的網址（mock 資料已是本機 `/images/...` 路徑，直接回傳） */
  function toEventImageUrl(image: string | undefined): string {
    return image ?? "";
  }

  /** 取得所有已發布的活動 */
  async function fetchEvents(): Promise<IEvent[]> {
    return eventsStore.filter((e) => e.isPublished).sort((a, b) => a.date.localeCompare(b.date));
  }

  /** 依 slug 取得單筆活動 */
  async function fetchEventBySlug(slug: string): Promise<IEvent | null> {
    return eventsStore.find((e) => e.slug === slug) ?? null;
  }

  /** 檢查該使用者是否已報名此活動 */
  async function checkBookingByUser(eventId: string, uid: string): Promise<boolean> {
    return loadBookings().some((b) => b.eventId === eventId && b.uid === uid);
  }

  /** 檢查該 email 是否已報名此活動 */
  async function checkBookingExists(eventId: string, email: string): Promise<boolean> {
    const normalized = email.trim().toLowerCase();
    return loadBookings().some((b) => b.eventId === eventId && b.email === normalized);
  }

  /** 建立報名紀錄（存 localStorage，並累加該活動的 registeredCount） */
  async function createBooking(data: IBookingInput): Promise<void> {
    const bookings = loadBookings();
    bookings.push({
      eventId: data.eventId,
      uid: data.uid ?? null,
      email: data.email.trim().toLowerCase(),
    });
    saveBookings(bookings);

    const event = eventsStore.find((e) => e.id === data.eventId);
    if (event) event.registeredCount += 1;
  }

  return {
    fetchEvents,
    fetchEventBySlug,
    checkBookingByUser,
    checkBookingExists,
    createBooking,
    toEventImageUrl,
  };
}
