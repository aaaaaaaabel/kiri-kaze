/**
 * Events Composable
 * 資料來源：NuxtHub server API
 */

import { apiFetch } from "~/api/client";

export interface IEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  image: string;
  capacity: number;
  registeredCount: number;
  isPublished: boolean;
  createdAt?: Date;
}

export interface IBookingInput {
  eventId: string;
  eventTitle: string;
  uid: string | null;
  name: string;
  email: string;
  phone: string;
  notes: string;
}

export function useEvents() {
  /** 圖片路徑已經是本機 `/images/...` 路徑，直接回傳 */
  function toEventImageUrl(image: string | undefined): string {
    return image ?? "";
  }

  async function fetchEvents(): Promise<IEvent[]> {
    try {
      return await apiFetch<IEvent[]>("/api/events", {}, "獲取活動列表失敗");
    } catch (err) {
      console.error("❌ fetchEvents error:", err);
      return [];
    }
  }

  async function fetchEventBySlug(slug: string): Promise<IEvent | null> {
    try {
      return await apiFetch<IEvent>(`/api/events/slug/${slug}`, {}, `找不到 slug 為 ${slug} 的活動`);
    } catch (_err) {
      return null;
    }
  }

  async function checkBookingByUser(eventId: string, uid: string): Promise<boolean> {
    try {
      const { exists } = await apiFetch<{ exists: boolean }>("/api/bookings/check", {
        query: { eventId, uid },
      });
      return exists;
    } catch (_err) {
      return false;
    }
  }

  async function checkBookingExists(eventId: string, email: string): Promise<boolean> {
    try {
      const { exists } = await apiFetch<{ exists: boolean }>("/api/bookings/check", {
        query: { eventId, email: email.trim().toLowerCase() },
      });
      return exists;
    } catch (_err) {
      return false;
    }
  }

  async function createBooking(data: IBookingInput): Promise<void> {
    await apiFetch("/api/bookings", {
      method: "POST",
      body: {
        eventId: data.eventId,
        eventTitle: data.eventTitle,
        uid: data.uid ?? null,
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        notes: (data.notes || "").trim(),
      },
    }, "建立報名失敗");
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
