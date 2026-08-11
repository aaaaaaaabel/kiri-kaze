/**
 * 化石資料操作 Composable
 * 資料來源：NuxtHub server API
 */

import type { IFossil } from "~/types/fossil";
import type { SortDirection, IPaginationOptions } from "~/types/common";
import type { ApiError } from "~/types/api";
import { apiFetch } from "~/api/client";

/**
 * 排序選項
 */
export type FossilSortOption = "createdAt" | "updatedAt" | "scientificName";

/**
 * 查詢選項
 */
export interface IFetchFossilsOptions extends IPaginationOptions {
  /** 排序欄位 */
  sortBy?: FossilSortOption;
  /** 排序方向 */
  sortDirection?: SortDirection;
  /** 是否只顯示公開的化石 */
  publicOnly?: boolean;
  /** 是否只顯示精選的化石 */
  featuredOnly?: boolean;
}

/**
 * 使用化石資料的 Composable
 */
export const useFossils = () => {
  const loading = ref(false);
  const error = ref<ApiError | null>(null);
  const fossils = ref<IFossil[]>([]);
  const currentFossil = ref<IFossil | null>(null);

  /**
   * 取得化石列表
   * @param options 查詢選項
   * @returns 化石陣列
   */
  const fetchFossils = async (options: IFetchFossilsOptions = {}): Promise<IFossil[]> => {
    loading.value = true;
    error.value = null;
    try {
      const result = await apiFetch<IFossil[]>(
        "/api/fossils",
        {
          query: {
            publicOnly: options.publicOnly ?? true,
            featuredOnly: options.featuredOnly ?? false,
            sortBy: options.sortBy,
            sortDirection: options.sortDirection,
            pageSize: options.pageSize,
            lastDocId: options.lastDocId,
          },
        },
        "獲取化石列表失敗",
      );
      fossils.value = result;
      return result;
    } catch (err) {
      error.value = err as ApiError;
      console.error("❌ fetchFossils error:", err);
      throw error.value;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 根據 ID 獲取單筆化石
   * @param id 化石 ID
   * @returns 化石資料
   */
  const fetchFossilById = async (id: string): Promise<IFossil | null> => {
    loading.value = true;
    error.value = null;
    try {
      const fossil = await apiFetch<IFossil>(`/api/fossils/${id}`, {}, `找不到 ID 為 ${id} 的化石`);
      currentFossil.value = fossil;
      return fossil;
    } catch (err) {
      error.value = err as ApiError;
      currentFossil.value = null;
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 根據 slug 獲取單筆化石
   * @param slug 化石 slug
   * @returns 化石資料
   */
  const fetchFossilBySlug = async (slug: string): Promise<IFossil | null> => {
    loading.value = true;
    error.value = null;
    try {
      const fossil = await apiFetch<IFossil>(`/api/fossils/slug/${slug}`, {}, `找不到 slug 為 ${slug} 的化石`);
      currentFossil.value = fossil;
      return fossil;
    } catch (err) {
      error.value = err as ApiError;
      currentFossil.value = null;
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 根據 shortCode 獲取單筆化石
   * @param code 標本的 shortCode
   * @returns 化石資料
   */
  const fetchFossilByCode = async (code: string): Promise<IFossil | null> => {
    loading.value = true;
    error.value = null;
    try {
      const fossil = await apiFetch<IFossil>(`/api/fossils/code/${code}`, {}, `找不到 code 為 ${code} 的化石`);
      currentFossil.value = fossil;
      return fossil;
    } catch (err) {
      error.value = err as ApiError;
      currentFossil.value = null;
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 根據物種 slug 獲取該物種的所有標本
   * @param speciesSlug 物種 slug
   * @returns 標本陣列
   */
  const fetchFossilsBySpeciesSlug = async (speciesSlug: string): Promise<IFossil[]> => {
    loading.value = true;
    error.value = null;
    try {
      const result = await apiFetch<IFossil[]>(`/api/fossils/by-species/${speciesSlug}`, {}, "獲取標本列表失敗");
      fossils.value = result;
      return result;
    } catch (err) {
      error.value = err as ApiError;
      console.error("❌ fetchFossilsBySpeciesSlug error:", err);
      return [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * 獲取推薦的相關化石（同物種的其他標本）
   * @param fossil 當前化石
   * @param limitCount 推薦數量（預設 20）
   * @returns 推薦的化石陣列
   */
  const getRecommendations = async (fossil: IFossil, limitCount = 20): Promise<IFossil[]> => {
    if (!fossil.speciesRef?.slug) return [];
    try {
      return await apiFetch<IFossil[]>(`/api/fossils/by-species/${fossil.speciesRef.slug}`, {
        query: { excludeId: fossil.id, limit: limitCount },
      });
    } catch (err) {
      console.error("❌ getRecommendations error:", err);
      return [];
    }
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
    // 狀態
    fossils: readonly(fossils),
    currentFossil: readonly(currentFossil),
    loading: readonly(loading),
    error: readonly(error),

    // 方法
    fetchFossils,
    fetchFossilById,
    fetchFossilBySlug,
    fetchFossilByCode,
    fetchFossilsBySpeciesSlug,
    getRecommendations,
    clearError,
    reset,
  };
};
