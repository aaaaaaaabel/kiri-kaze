/**
 * 化石資料操作 Composable
 * 提供化石的 CRUD 操作和資料查詢功能
 */

import type { IFossil } from "~/types/fossil";
import type { SortDirection, IPaginationOptions } from "~/types/common";
import type {
  CollectionReference,
  Query,
  DocumentSnapshot,
} from "firebase/firestore";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  where,
  increment,
} from "firebase/firestore";
import { useFirestore } from "vuefire";
import { ref, readonly } from "vue";

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
  // SSR 時 Firebase 未初始化，回傳 stub 避免 500
  if (import.meta.server) {
    const loading = ref(false);
    const error = ref<Error | null>(null);
    const fossils = ref<IFossil[]>([]);
    const currentFossil = ref<IFossil | null>(null);
    const noop = async () => [] as IFossil[];
    const noopNull = async () => null as IFossil | null;
    return {
      fossils: readonly(fossils),
      currentFossil: readonly(currentFossil),
      loading: readonly(loading),
      error: readonly(error),
      fetchFossils: noop,
      fetchFossilById: noopNull,
      fetchFossilBySlug: noopNull,
      fetchFossilByCode: noopNull,
      fetchFossilsBySpeciesSlug: noop,
      getRecommendations: noop,
      incrementViewCount: async () => {},
      createFossil: noopNull,
      updateFossil: async () => {},
      deleteFossil: async () => {},
      clearError: () => {},
      reset: () => {},
    };
  }

  const db = useFirestore();
  const fossilsCollection = collection(
    db,
    "fossils",
  ) as CollectionReference<IFossil>;

  // 狀態管理
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const fossils = ref<IFossil[]>([]);
  const currentFossil = ref<IFossil | null>(null);

  /**
   * 獲取化石列表
   * @param options 查詢選項
   * @returns 化石陣列
   */
  const fetchFossils = async (
    options: IFetchFossilsOptions = {},
  ): Promise<IFossil[]> => {
    loading.value = true;
    error.value = null;

    try {
      const {
        sortBy = "createdAt",
        sortDirection = "desc",
        pageSize, // ⚠️ 移除預設值，改為可選（undefined 表示不限制）
        publicOnly = true,
        featuredOnly = false,
      } = options;

      // 建立查詢
      let q: Query<IFossil> = query(fossilsCollection);

      // 篩選條件
      if (publicOnly) {
        q = query(q, where("isPublic", "==", true));
      }

      if (featuredOnly) {
        // 注意：檢查 Firestore 中的欄位名稱是 'featured' 還是 'isFeatured'
        q = query(q, where("featured", "==", true));
      }

      // ⚠️ 注意：如果同時使用 where 和 orderBy，需要建立 Firestore 複合索引
      // 暫時移除 orderBy，改為在客戶端排序（避免需要建立索引）
      // 如果需要排序，可以在取得資料後在客戶端進行
      // q = query(q, orderBy(sortBy, sortDirection))

      // 分頁（暫時移除，改為在客戶端處理）
      // if (pageSize) {
      //     q = query(q, limit(pageSize))
      // }

      // 如果有 lastDocId，從該文件之後開始查詢
      if (options.lastDocId) {
        const lastDocSnapshot = await getDoc(
          doc(fossilsCollection, options.lastDocId),
        );
        if (lastDocSnapshot.exists()) {
          q = query(q, startAfter(lastDocSnapshot));
        }
      }

      // 執行查詢
      const querySnapshot = await getDocs(q);
      let fetchedFossils: IFossil[] = [];

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const fossil = {
          ...data,
          id: docSnapshot.id,
        } as IFossil;

        fetchedFossils.push(fossil);
      });

      // 在客戶端排序（避免需要 Firestore 索引）
      if (sortBy === "createdAt" && sortDirection) {
        fetchedFossils = [...fetchedFossils].sort((a, b) => {
          const aTime =
            a.createdAt instanceof Date
              ? a.createdAt.getTime()
              : (a.createdAt as any)?.seconds
                ? (a.createdAt as any).seconds * 1000
                : 0;
          const bTime =
            b.createdAt instanceof Date
              ? b.createdAt.getTime()
              : (b.createdAt as any)?.seconds
                ? (b.createdAt as any).seconds * 1000
                : 0;
          return sortDirection === "desc" ? bTime - aTime : aTime - bTime;
        });
      }

      // 在客戶端分頁
      if (pageSize && pageSize > 0) {
        fetchedFossils = fetchedFossils.slice(0, pageSize);
      }

      // 調試：檢查第一筆資料的格式
      const firstFossil = fetchedFossils[0];
      if (firstFossil) {
        console.log("📦 第一筆 Firestore 資料:", {
          id: firstFossil.id,
          slug: firstFossil.slug,
          thumbnail: firstFossil.thumbnail,
          thumbnailType: typeof firstFossil.thumbnail,
          speciesName: firstFossil.speciesRef?.name?.zh,
        });
      }

      fossils.value = fetchedFossils;
      return fetchedFossils;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "獲取化石列表失敗";
      error.value = new Error(errorMessage);
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
      const docRef = doc(fossilsCollection, id);
      const docSnapshot = await getDoc(docRef);

      if (!docSnapshot.exists()) {
        error.value = new Error(`找不到 ID 為 ${id} 的化石`);
        currentFossil.value = null;
        return null;
      }

      const data = docSnapshot.data();
      const fossil: IFossil = {
        ...data,
        id: docSnapshot.id,
      } as IFossil;

      currentFossil.value = fossil;
      return fossil;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "獲取化石失敗";
      error.value = new Error(errorMessage);
      console.error("❌ fetchFossilById error:", err);
      throw error.value;
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
      // 查詢 slug 欄位
      const q = query(fossilsCollection, where("slug", "==", slug), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty || querySnapshot.docs.length === 0) {
        error.value = new Error(`找不到 slug 為 ${slug} 的化石`);
        currentFossil.value = null;
        return null;
      }

      const docSnapshot = querySnapshot.docs[0];
      if (!docSnapshot) {
        error.value = new Error(`找不到 slug 為 ${slug} 的化石`);
        currentFossil.value = null;
        return null;
      }

      const data = docSnapshot.data();
      const fossil: IFossil = {
        ...data,
        id: docSnapshot.id,
      } as IFossil;

      currentFossil.value = fossil;
      return fossil;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "獲取化石失敗";
      error.value = new Error(errorMessage);
      console.error("❌ fetchFossilBySlug error:", err);
      // 不拋出錯誤，返回 null（讓調用者處理）
      currentFossil.value = null;
      loading.value = false;
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
      // 查詢 shortCode 欄位
      const q = query(
        fossilsCollection,
        where("shortCode", "==", code),
        limit(1),
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty || querySnapshot.docs.length === 0) {
        error.value = new Error(`找不到 code 為 ${code} 的化石`);
        currentFossil.value = null;
        return null;
      }

      const docSnapshot = querySnapshot.docs[0];
      if (!docSnapshot) {
        error.value = new Error(`找不到 code 為 ${code} 的化石`);
        currentFossil.value = null;
        return null;
      }

      const data = docSnapshot.data();
      const fossil: IFossil = {
        ...data,
        id: docSnapshot.id,
      } as IFossil;

      currentFossil.value = fossil;
      return fossil;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "獲取化石失敗";
      error.value = new Error(errorMessage);
      console.error("❌ fetchFossilByCode error:", err);
      currentFossil.value = null;
      loading.value = false;
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
  const fetchFossilsBySpeciesSlug = async (
    speciesSlug: string,
  ): Promise<IFossil[]> => {
    loading.value = true;
    error.value = null;

    try {
      const q = query(
        fossilsCollection,
        where("speciesRef.slug", "==", speciesSlug),
        where("isPublic", "==", true),
      );
      const querySnapshot = await getDocs(q);
      const fetchedFossils: IFossil[] = [];

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        fetchedFossils.push({
          ...data,
          id: docSnapshot.id,
        } as IFossil);
      });

      fossils.value = fetchedFossils;
      return fetchedFossils;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "獲取標本列表失敗";
      error.value = new Error(errorMessage);
      console.error("❌ fetchFossilsBySpeciesSlug error:", err);
      return [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * 獲取推薦的相關化石
   * ⭐ 更新為新的雙層架構：推薦相同物種的其他標本
   * @param fossil 當前化石
   * @param limit 推薦數量（預設 20）
   * @returns 推薦的化石陣列
   */
  const getRecommendations = async (
    fossil: IFossil,
    limitCount: number = 20,
  ): Promise<IFossil[]> => {
    loading.value = true;
    error.value = null;

    try {
      const recommendations: IFossil[] = [];

      // ⭐ 優先推薦相同物種的其他標本
      if (fossil.speciesRef?.id) {
        const sameSpeciesQuery = query(
          fossilsCollection,
          where("isPublic", "==", true),
          where("speciesRef.id", "==", fossil.speciesRef.id),
          limit(limitCount + 1), // +1 因為會排除當前標本
        );
        const sameSpeciesSnapshot = await getDocs(sameSpeciesQuery);
        sameSpeciesSnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          // 排除當前標本本身
          if (docSnapshot.id !== fossil.id) {
            recommendations.push({
              ...data,
              id: docSnapshot.id,
            } as IFossil);
          }
        });
      }

      // ⭐ 如果數量不足，推薦相同分類的其他標本（需要查詢物種資料）
      // 注意：這需要先查詢物種資料，然後根據物種的 taxonomy 來推薦
      // 暫時只推薦相同物種的其他標本，之後可以擴展

      return recommendations.slice(0, limitCount);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "獲取推薦化石失敗";
      error.value = new Error(errorMessage);
      console.error("❌ getRecommendations error:", err);
      return [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * 增加瀏覽次數
   * @param id 化石 ID
   */
  const incrementViewCount = async (id: string): Promise<void> => {
    try {
      const docRef = doc(fossilsCollection, id);
      const docSnapshot = await getDoc(docRef);
      if (docSnapshot.exists()) {
        const currentViewCount = docSnapshot.data()?.viewCount || 0;
        await updateDoc(docRef, {
          viewCount: currentViewCount + 1,
        } as any);
      }
    } catch (err) {
      console.error("❌ incrementViewCount error:", err);
      // 不拋出錯誤，因為這不是關鍵功能
    }
  };

  /**
   * 新增化石
   * @param data 化石資料 (部分)
   * @returns 建立的化石 ID
   */
  const createFossil = async (data: Partial<IFossil>): Promise<string> => {
    loading.value = true;
    error.value = null;

    try {
      // 準備資料，加入時間戳記
      const fossilData: Partial<IFossil> = {
        ...data,
        createdAt: (data.createdAt as Timestamp | Date) || Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // 移除 id (Firebase 會自動產生)
      const { id: _, ...dataWithoutId } = fossilData;

      const docRef = await addDoc(
        fossilsCollection,
        dataWithoutId as Omit<IFossil, "id">,
      );
      return docRef.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "新增化石失敗";
      error.value = new Error(errorMessage);
      console.error("❌ createFossil error:", err);
      throw error.value;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 更新化石
   * @param id 化石 ID
   * @param data 要更新的資料 (部分)
   */
  const updateFossil = async (
    id: string,
    data: Partial<IFossil>,
  ): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      const docRef = doc(fossilsCollection, id);

      // 準備更新資料，加入更新時間
      const updateData: Partial<IFossil> = {
        ...data,
        updatedAt: Timestamp.now(),
      };

      // 移除 id (不應該更新 id)
      const { id: _, ...dataWithoutId } = updateData;

      await updateDoc(docRef, dataWithoutId as Partial<Omit<IFossil, "id">>);

      // 更新本地狀態
      if (currentFossil.value?.id === id) {
        currentFossil.value = {
          ...currentFossil.value,
          ...updateData,
        } as IFossil;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "更新化石失敗";
      error.value = new Error(errorMessage);
      console.error("❌ updateFossil error:", err);
      throw error.value;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 刪除化石
   * @param id 化石 ID
   */
  const deleteFossil = async (id: string): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      const docRef = doc(fossilsCollection, id);
      await deleteDoc(docRef);

      // 更新本地狀態
      fossils.value = fossils.value.filter((f) => f.id !== id);
      if (currentFossil.value?.id === id) {
        currentFossil.value = null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "刪除化石失敗";
      error.value = new Error(errorMessage);
      console.error("❌ deleteFossil error:", err);
      throw error.value;
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
    incrementViewCount,
    createFossil,
    updateFossil,
    deleteFossil,
    clearError,
    reset,
  };
};
