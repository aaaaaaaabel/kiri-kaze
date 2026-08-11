/**
 * 物種資料 Composable（mock 版本）
 * Firebase 連不上期間，讀取 data/mock/species.json 取代 Firestore。
 * 對外函式簽名與 useSpecies 完全一致。
 */

import type { ISpecies } from "~/types/fossil";
import rawSpecies from "~~/data/mock/species.json";

function normalizeSpecies(list: typeof rawSpecies): ISpecies[] {
  return list.map((item) => ({
    ...item,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  })) as unknown as ISpecies[];
}

const speciesStore: ISpecies[] = normalizeSpecies(rawSpecies);

/**
 * 使用物種資料的 Composable（mock 版本）
 */
export const useMockSpecies = () => {
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const currentSpecies = ref<ISpecies | null>(null);

  /** 依 slug 取得物種 */
  const fetchSpeciesBySlug = async (slug: string): Promise<ISpecies | null> => {
    const species = speciesStore.find((s) => s.slug === slug) ?? null;
    currentSpecies.value = species;
    if (!species) error.value = new Error(`找不到 slug 為 ${slug} 的物種`);
    return species;
  };

  /** 依標本 shortCode 取得該標本所屬的物種 */
  const fetchSpeciesByCode = async (code: string): Promise<ISpecies | null> => {
    const { useMockFossils } = await import("./useMockFossils");
    const { fetchFossilByCode } = useMockFossils();
    const fossil = await fetchFossilByCode(code);
    if (!fossil?.speciesRef?.slug) {
      error.value = new Error(`找不到 code 為 ${code} 的標本`);
      currentSpecies.value = null;
      return null;
    }
    return await fetchSpeciesBySlug(fossil.speciesRef.slug);
  };

  const clearError = () => {
    error.value = null;
  };

  const reset = () => {
    currentSpecies.value = null;
    error.value = null;
    loading.value = false;
  };

  return {
    currentSpecies: readonly(currentSpecies),
    loading: readonly(loading),
    error: readonly(error),
    fetchSpeciesBySlug,
    fetchSpeciesByCode,
    clearError,
    reset,
  };
};
