/**
 * 收藏化石 Composable（singleton）
 * - 全站共用同一份 favorites 狀態，collection 與 FossilCard 同步
 * - 未登入：收藏存在 localStorage (key: fossil_favorites)
 * - 登入後：收藏存在 Firestore users/{uid}/favorites
 * - 登入瞬間：mergeFavorites() 合併 localStorage → Firestore，去重後清空 localStorage
 */

const STORAGE_KEY = "fossil_favorites";

// 模組層級（singleton），全站共用
const favorites = ref<string[]>([]);
let initialized = false;

function loadFromLocalStorage(): string[] {
  if (import.meta.server || typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function saveToLocalStorage(ids: string[]) {
  if (import.meta.server || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch (e) {
    if (import.meta.dev) console.warn("[useFavorites] localStorage setItem failed", e);
  }
}

export function useFavorites() {
  // SSR 時回傳 stub
  if (import.meta.server) {
    return {
      favorites: readonly(ref<string[]>([])),
      isFavorited: () => false,
      toggleFavorite: async () => false,
      mergeFavorites: async () => {},
    };
  }

  const user = useCurrentUser();
  const db = useFirestore();

  // 只初始化一次：watch user.uid，登入/登出時切換資料來源
  if (!initialized) {
    initialized = true;
    async function fetchFirestoreFavorites(): Promise<string[]> {
      const uid = user.value?.uid;
      if (!uid || !db) return [];
      const { doc, getDoc } = await import("firebase/firestore");
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);
      const data = snap.data();
      const list = data?.favorites;
      return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : [];
    }
    watch(
      () => user.value?.uid,
      async (uid) => {
        if (uid) {
          favorites.value = await fetchFirestoreFavorites();
        } else {
          favorites.value = loadFromLocalStorage();
        }
      },
      { immediate: true },
    );
  }

  function isFavorited(fossilId: string): boolean {
    return favorites.value.includes(fossilId);
  }

  /**
   * 切換收藏狀態。
   * 未登入：寫入 localStorage 並更新 favorites，回傳 false（可讓父層開登入 modal）。
   * 登入：寫入 Firestore，回傳 true。
   */
  async function toggleFavorite(fossilId: string): Promise<boolean> {
    const uid = user.value?.uid;
    if (!fossilId?.trim()) return !!uid;

    if (!uid) {
      const current = loadFromLocalStorage();
      const set = new Set(current);
      if (set.has(fossilId)) set.delete(fossilId);
      else set.add(fossilId);
      const next = Array.from(set);
      saveToLocalStorage(next);
      favorites.value = next;
      return false;
    }

    if (!db) return true;
    const { doc, updateDoc, arrayUnion, arrayRemove } = await import("firebase/firestore");
    const userRef = doc(db, "users", uid);
    const isCurrently = favorites.value.includes(fossilId);
    try {
      if (isCurrently) {
        await updateDoc(userRef, { favorites: arrayRemove(fossilId) });
        favorites.value = favorites.value.filter((id) => id !== fossilId);
      } else {
        await updateDoc(userRef, { favorites: arrayUnion(fossilId) });
        favorites.value = [...favorites.value, fossilId];
      }
      return true;
    } catch (e) {
      if (import.meta.dev) console.error("[useFavorites] toggleFavorite Firestore error", e);
      return true;
    }
  }

  /**
   * 登入後呼叫：把 localStorage 的收藏合併進 Firestore，去重後清空 localStorage。
   */
  async function mergeFavorites(): Promise<void> {
    const uid = user.value?.uid;
    if (!uid || !db) return;

    const localIds = loadFromLocalStorage();
    const { doc, getDoc, updateDoc } = await import("firebase/firestore");
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    const existing: string[] = Array.isArray(snap.data()?.favorites)
      ? snap.data()!.favorites.filter((x: unknown): x is string => typeof x === "string")
      : [];

    const merged = Array.from(new Set<string>([...existing, ...localIds]));
    await updateDoc(userRef, { favorites: merged });
    favorites.value = merged;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  return {
    favorites: readonly(favorites),
    isFavorited,
    toggleFavorite,
    mergeFavorites,
  };
}
