/**
 * 物種資料操作 Composable
 * 資料來源：NuxtHub（Cloudflare D1）server API，取代原本的 Firestore 實作
 */

import type { ISpecies } from "~/types/fossil";
import type { ApiError } from "~/types/api";
import { apiFetch } from "~/api/client";

/**
 * 使用物種資料的 Composable
 */
export const useSpecies = () => {
  const loading = ref(false);
  const error = ref<ApiError | null>(null);
  const currentSpecies = ref<ISpecies | null>(null);

  /**
   * 根據 slug 獲取物種
   * @param slug 物種 slug
   * @returns 物種資料
   */
  const fetchSpeciesBySlug = async (slug: string): Promise<ISpecies | null> => {
    loading.value = true;
    error.value = null;
    try {
      const species = await apiFetch<ISpecies>(`/api/species/${slug}`, {}, `找不到 slug 為 ${slug} 的物種`);
      currentSpecies.value = species;
      return species;
    } catch (err) {
      error.value = err as ApiError;
      currentSpecies.value = null;
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 根據 code 獲取物種（透過標本的 shortCode 查找）
   * @param code 標本的 shortCode
   * @returns 物種資料
   */
  const fetchSpeciesByCode = async (code: string): Promise<ISpecies | null> => {
    loading.value = true;
    error.value = null;
    try {
      const species = await apiFetch<ISpecies>(`/api/species/code/${code}`, {}, `找不到 code 為 ${code} 的物種`);
      currentSpecies.value = species;
      return species;
    } catch (err) {
      error.value = err as ApiError;
      currentSpecies.value = null;
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 清除錯誤狀態
   */
  const clearError = () => {
    error.value = null;
  };

  /**
   * 重置狀態
   */
  const reset = () => {
    currentSpecies.value = null;
    error.value = null;
    loading.value = false;
  };

  return {
    // 狀態
    currentSpecies: readonly(currentSpecies),
    loading: readonly(loading),
    error: readonly(error),

    // 方法
    fetchSpeciesBySlug,
    fetchSpeciesByCode,
    clearError,
    reset,
  };
};
