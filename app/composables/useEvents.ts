/**
 * Events Composable
 * Fetch published events from Firestore, single event by slug.
 * Image paths are converted with useStorage().toStorageUrl().
 */

import type { Timestamp } from "firebase/firestore";
import {
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  where,
  limit,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { useFirestore } from "vuefire";

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
  createdAt?: Timestamp | Date;
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
  if (import.meta.server) {
    return {
      fetchEvents: async (): Promise<IEvent[]> => [],
      fetchEventBySlug: async (_slug: string): Promise<IEvent | null> => null,
      checkBookingByUser: async (_eventId: string, _uid: string): Promise<boolean> => false,
      checkBookingExists: async (_eventId: string, _email: string): Promise<boolean> => false,
      createBooking: async (_data: IBookingInput): Promise<void> => {},
    };
  }

  const db = useFirestore();
  const { toStorageUrl } = useStorage();

  function toEventImageUrl(image: string | undefined): string {
    if (!image) return "";
    if (image.startsWith("http://") || image.startsWith("https://") || image.startsWith("/"))
      return image;
    return toStorageUrl(image);
  }

  async function fetchEvents(): Promise<IEvent[]> {
    if (!db) return [];
    const eventsRef = collection(db, "events");
    const q = query(eventsRef, where("isPublished", "==", true));
    const snapshot = await getDocs(q);
    const list: IEvent[] = [];
    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      const image = d.image as string | undefined;
      list.push({
        id: docSnap.id,
        slug: d.slug ?? "",
        title: d.title ?? "",
        description: d.description ?? "",
        date: d.date ?? "",
        time: d.time ?? "",
        location: d.location ?? "",
        image: toEventImageUrl(image),
        capacity: Number(d.capacity) || 0,
        registeredCount: Number(d.registeredCount) || 0,
        isPublished: !!d.isPublished,
        createdAt: d.createdAt,
      } as IEvent);
    });
    list.sort((a, b) => a.date.localeCompare(b.date));
    return list;
  }

  async function fetchEventBySlug(slug: string): Promise<IEvent | null> {
    if (!db || !slug) return null;
    const eventsRef = collection(db, "events");
    const q = query(eventsRef, where("slug", "==", slug), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    if (!docSnap) return null;
    const d = docSnap.data();
    const image = d.image as string | undefined;
    return {
      id: docSnap.id,
      slug: d.slug ?? "",
      title: d.title ?? "",
      description: d.description ?? "",
      date: d.date ?? "",
      time: d.time ?? "",
      location: d.location ?? "",
      image: toEventImageUrl(image),
      capacity: Number(d.capacity) || 0,
      registeredCount: Number(d.registeredCount) || 0,
      isPublished: !!d.isPublished,
      createdAt: d.createdAt,
    } as IEvent;
  }

  /** If Firestore throws an index error, create a composite index on collection "bookings" for fields eventId (Ascending) and uid (Ascending). */
  async function checkBookingByUser(eventId: string, uid: string): Promise<boolean> {
    if (!db) return false;
    const bookingsRef = collection(db, "bookings");
    const q = query(
      bookingsRef,
      where("eventId", "==", eventId),
      where("uid", "==", uid),
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }

  /** If Firestore throws an index error, create a composite index on collection "bookings" for fields eventId (Ascending) and email (Ascending). */
  async function checkBookingExists(eventId: string, email: string): Promise<boolean> {
    if (!db) return false;
    const bookingsRef = collection(db, "bookings");
    const q = query(
      bookingsRef,
      where("eventId", "==", eventId),
      where("email", "==", email.trim().toLowerCase()),
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }

  async function createBooking(data: IBookingInput): Promise<void> {
    if (!db) throw new Error("Firestore not available");
    const bookingsRef = collection(db, "bookings");
    const eventRef = doc(db, "events", data.eventId);
    await addDoc(bookingsRef, {
      eventId: data.eventId,
      eventTitle: data.eventTitle,
      uid: data.uid ?? null,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      notes: (data.notes || "").trim(),
      createdAt: serverTimestamp(),
    });
    await updateDoc(eventRef, { registeredCount: increment(1) });
  }

  /**
   * 若在 Firestore 後台手動刪除報名（bookings）時，需同步將該活動的 registeredCount -1，
   * 否則前台人數會不正確。可執行 scripts/sync-event-counts.ts 依實際 bookings 數量重算並更新。
   */

  return {
    fetchEvents,
    fetchEventBySlug,
    checkBookingByUser,
    checkBookingExists,
    createBooking,
    toEventImageUrl,
  };
}
