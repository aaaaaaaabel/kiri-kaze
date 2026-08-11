/**
 * 化石資料 Composable（mock 版本）
 * Firebase 連不上期間，讀取 data/mock/fossils.json 取代 Firestore。
 * 對外函式簽名與 useFossils 完全一致，未來接回正式資料源只需切換
 * runtimeConfig.public.isMockDataEnabled。
 */

import type { IFossil } from "~/types/fossil";
import type { SortDirection, IPaginationOptions } from "~/types/common";
import rawFossils from "~~/data/mock/fossils.json";

type MockFossilSortOption = "createdAt" | "updatedAt" | "scientificName";

interface IMockFetchFossilsOptions extends IPaginationOptions {
  sortBy?: MockFossilSortOption;
  sortDirection?: SortDirection;
  publicOnly?: boolean;
  featuredOnly?: boolean;
}

function normalizeFossils(list: typeof rawFossils): IFossil[] {
  return list.map((item) => ({
    ...item,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  })) as unknown as IFossil[];
}

// module-level store：模擬 Firestore collection，供 CRUD 在記憶體內操作
const fossilsStore: IFossil[] = normalizeFossils(rawFossils);

function toTime(value: IFossil["createdAt"]): number {
  return value instanceof Date ? value.getTime() : 0;
}

function sortFossils(list: IFossil[], sortBy: MockFossilSortOption, direction: SortDirection): IFossil[] {
  const sorted = [...list].sort((a, b) => {
    if (sortBy === "scientificName") {
      return a.speciesRef.name.scientific.localeCompare(b.speciesRef.name.scientific);
    }
    return toTime(a[sortBy]) - toTime(b[sortBy]);
  });
  return direction === "desc" ? sorted.reverse() : sorted;
}

/**
 * 使用化石資料的 Composable（mock 版本）
 */
export const useMockFossils = () => {
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const fossils = ref<IFossil[]>([]);
  const currentFossil = ref<IFossil | null>(null);

  /**
   * 取得化石列表（陣列 filter/sort/slice 模擬 Firestore where/orderBy/limit）
   * @param options 查詢選項
   * @returns 化石陣列
   */
  const fetchFossils = async (options: IMockFetchFossilsOptions = {}): Promise<IFossil[]> => {
    loading.value = true;
    error.value = null;
    try {
      const {
        sortBy = "createdAt",
        sortDirection = "desc",
        pageSize,
        publicOnly = true,
        featuredOnly = false,
        lastDocId,
      } = options;

      let result = fossilsStore.filter((f) => (publicOnly ? f.isPublic : true));
      if (featuredOnly) result = result.filter((f) => f.featured);
      result = sortFossils(result, sortBy, sortDirection);

      if (lastDocId) {
        const cursorIndex = result.findIndex((f) => f.id === lastDocId);
        if (cursorIndex >= 0) result = result.slice(cursorIndex + 1);
      }
      if (pageSize && pageSize > 0) result = result.slice(0, pageSize);

      fossils.value = result;
      return result;
    } finally {
      loading.value = false;
    }
  };

  /** 依 ID 取得單筆化石 */
  const fetchFossilById = async (id: string): Promise<IFossil | null> => {
    const fossil = fossilsStore.find((f) => f.id === id) ?? null;
    currentFossil.value = fossil;
    if (!fossil) error.value = new Error(`找不到 ID 為 ${id} 的化石`);
    return fossil;
  };

  /** 依 slug 取得單筆化石 */
  const fetchFossilBySlug = async (slug: string): Promise<IFossil | null> => {
    const fossil = fossilsStore.find((f) => f.slug === slug) ?? null;
    currentFossil.value = fossil;
    if (!fossil) error.value = new Error(`找不到 slug 為 ${slug} 的化石`);
    return fossil;
  };

  /** 依 shortCode 取得單筆化石 */
  const fetchFossilByCode = async (code: string): Promise<IFossil | null> => {
    const fossil = fossilsStore.find((f) => f.shortCode === code) ?? null;
    currentFossil.value = fossil;
    if (!fossil) error.value = new Error(`找不到 code 為 ${code} 的化石`);
    return fossil;
  };

  /** 依物種 slug 取得該物種所有公開標本 */
  const fetchFossilsBySpeciesSlug = async (speciesSlug: string): Promise<IFossil[]> => {
    const result = fossilsStore.filter((f) => f.speciesRef.slug === speciesSlug && f.isPublic);
    fossils.value = result;
    return result;
  };

  /** 取得推薦的相關化石（同物種的其他標本） */
  const getRecommendations = async (fossil: IFossil, limitCount = 20): Promise<IFossil[]> => {
    return fossilsStore
      .filter((f) => f.isPublic && f.speciesRef.id === fossil.speciesRef.id && f.id !== fossil.id)
      .slice(0, limitCount);
  };

  /** 增加瀏覽次數（僅記憶體內累加，不落地） */
  const incrementViewCount = async (id: string): Promise<void> => {
    const fossil = fossilsStore.find((f) => f.id === id);
    if (fossil) fossil.viewCount += 1;
  };

  /** 新增化石（僅記憶體內新增，不落地） */
  const createFossil = async (data: Partial<IFossil>): Promise<string> => {
    const id = data.id ?? data.slug ?? `mock-${fossilsStore.length + 1}`;
    const now = new Date();
    fossilsStore.push({ ...data, id, createdAt: now, updatedAt: now } as IFossil);
    return id;
  };

  /** 更新化石（僅記憶體內更新，不落地） */
  const updateFossil = async (id: string, data: Partial<IFossil>): Promise<void> => {
    const index = fossilsStore.findIndex((f) => f.id === id);
    if (index === -1) return;
    fossilsStore[index] = { ...fossilsStore[index], ...data, updatedAt: new Date() } as IFossil;
    if (currentFossil.value?.id === id) currentFossil.value = fossilsStore[index]!;
  };

  /** 刪除化石（僅記憶體內刪除，不落地） */
  const deleteFossil = async (id: string): Promise<void> => {
    const index = fossilsStore.findIndex((f) => f.id === id);
    if (index !== -1) fossilsStore.splice(index, 1);
    fossils.value = fossils.value.filter((f) => f.id !== id);
    if (currentFossil.value?.id === id) currentFossil.value = null;
  };

  const clearError = () => {
    error.value = null;
  };

  const reset = () => {
    fossils.value = [];
    currentFossil.value = null;
    error.value = null;
    loading.value = false;
  };

  return {
    fossils: readonly(fossils),
    currentFossil: readonly(currentFossil),
    loading: readonly(loading),
    error: readonly(error),
    fetchFossils,
    fetchFossilById,
    fetchFossilBySlug,
    fetchFossilByCode,
    fetchFossilsBySpeciesSlug,
    getRecommendations,
    incrementViewCount,
    createFossil,
    updateFossil,
    deleteFossil,
    clearError,
    reset,
  };
};
