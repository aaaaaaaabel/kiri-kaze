/**
 * 收藏化石 Composable（singleton）
 * - 全站共用同一份 favorites 狀態，collection 與 FossilCard 同步
 * - 目前一律存在 localStorage（key: fossil_favorites）
 * - mergeFavorites() 保留空實作，等第一方登入 session 接上後再接雲端合併
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

  if (!initialized) {
    initialized = true;
    favorites.value = loadFromLocalStorage();
  }

  function isFavorited(fossilId: string): boolean {
    return favorites.value.includes(fossilId);
  }

  /**
   * 切換收藏狀態，寫入 localStorage。
   * 回傳 false（登入未就緒時可讓父層開登入 modal；目前登入停用，行為維持相容）。
   */
  async function toggleFavorite(fossilId: string): Promise<boolean> {
    if (!fossilId?.trim()) return false;

    const current = loadFromLocalStorage();
    const set = new Set(current);
    if (set.has(fossilId)) set.delete(fossilId);
    else set.add(fossilId);
    const next = Array.from(set);
    saveToLocalStorage(next);
    favorites.value = next;
    return false;
  }

  /** Placeholder until first-party auth can sync favorites to the server. */
  async function mergeFavorites(): Promise<void> {}

  return {
    favorites: readonly(favorites),
    isFavorited,
    toggleFavorite,
    mergeFavorites,
  };
}
