/**
 * 化石資料操作 Composable
 * 提供化石的 CRUD 操作和資料查詢功能
 */

import type { IFossil } from '~/types/fossil'
import type { SortDirection, IPaginationOptions } from '~/types/common'
import type { CollectionReference, Query, DocumentSnapshot } from 'firebase/firestore'
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, limit, startAfter, Timestamp, where } from 'firebase/firestore'
import { useFirestore } from 'vuefire'
import { ref, readonly } from 'vue'

/**
 * 排序選項
 */
export type FossilSortOption = 'createdAt' | 'updatedAt' | 'scientificName'

/**
 * 查詢選項
 */
export interface IFetchFossilsOptions extends IPaginationOptions {
    /** 排序欄位 */
    sortBy?: FossilSortOption
    /** 排序方向 */
    sortDirection?: SortDirection
    /** 是否只顯示公開的化石 */
    publicOnly?: boolean
    /** 是否只顯示精選的化石 */
    featuredOnly?: boolean
}

/**
 * 使用化石資料的 Composable
 */
export const useFossils = () => {
    const db = useFirestore()
    const fossilsCollection = collection(db, 'fossils') as CollectionReference<IFossil>

    // 狀態管理
    const loading = ref(false)
    const error = ref<Error | null>(null)
    const fossils = ref<IFossil[]>([])
    const currentFossil = ref<IFossil | null>(null)

    /**
     * 獲取化石列表
     * @param options 查詢選項
     * @returns 化石陣列
     */
    const fetchFossils = async (options: IFetchFossilsOptions = {}): Promise<IFossil[]> => {
        loading.value = true
        error.value = null

        try {
            const {
                sortBy = 'createdAt',
                sortDirection = 'desc',
                pageSize = 20,
                publicOnly = true,
                featuredOnly = false,
            } = options

            // 建立查詢
            let q: Query<IFossil> = query(fossilsCollection)

            // 篩選條件
            if (publicOnly) {
                q = query(q, where('isPublic', '==', true))
            }

            if (featuredOnly) {
                q = query(q, where('isFeatured', '==', true))
            }

            // 排序 (必須在 where 之後)
            q = query(q, orderBy(sortBy, sortDirection))

            // 分頁
            if (pageSize) {
                q = query(q, limit(pageSize))
            }

            // 如果有 lastDocId，從該文件之後開始查詢
            if (options.lastDocId) {
                const lastDocSnapshot = await getDoc(doc(fossilsCollection, options.lastDocId))
                if (lastDocSnapshot.exists()) {
                    q = query(q, startAfter(lastDocSnapshot))
                }
            }

            // 執行查詢
            const querySnapshot = await getDocs(q)
            const fetchedFossils: IFossil[] = []

            querySnapshot.forEach((docSnapshot) => {
                const data = docSnapshot.data()
                fetchedFossils.push({
                    ...data,
                    id: docSnapshot.id,
                } as IFossil)
            })

            fossils.value = fetchedFossils
            return fetchedFossils
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '獲取化石列表失敗'
            error.value = new Error(errorMessage)
            console.error('❌ fetchFossils error:', err)
            throw error.value
        } finally {
            loading.value = false
        }
    }

    /**
     * 根據 ID 獲取單筆化石
     * @param id 化石 ID
     * @returns 化石資料
     */
    const fetchFossilById = async (id: string): Promise<IFossil | null> => {
        loading.value = true
        error.value = null

        try {
            const docRef = doc(fossilsCollection, id)
            const docSnapshot = await getDoc(docRef)

            if (!docSnapshot.exists()) {
                error.value = new Error(`找不到 ID 為 ${id} 的化石`)
                currentFossil.value = null
                return null
            }

            const data = docSnapshot.data()
            const fossil: IFossil = {
                ...data,
                id: docSnapshot.id,
            } as IFossil

            currentFossil.value = fossil
            return fossil
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '獲取化石失敗'
            error.value = new Error(errorMessage)
            console.error('❌ fetchFossilById error:', err)
            throw error.value
        } finally {
            loading.value = false
        }
    }

    /**
     * 新增化石
     * @param data 化石資料 (部分)
     * @returns 建立的化石 ID
     */
    const createFossil = async (data: Partial<IFossil>): Promise<string> => {
        loading.value = true
        error.value = null

        try {
            // 準備資料，加入時間戳記
            const fossilData: Partial<IFossil> = {
                ...data,
                createdAt: (data.createdAt as Date | string | Timestamp) || Timestamp.now(),
                updatedAt: Timestamp.now() as Date | string | Timestamp,
            }

            // 移除 id (Firebase 會自動產生)
            const { id: _, ...dataWithoutId } = fossilData

            const docRef = await addDoc(fossilsCollection, dataWithoutId as Omit<IFossil, 'id'>)
            return docRef.id
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '新增化石失敗'
            error.value = new Error(errorMessage)
            console.error('❌ createFossil error:', err)
            throw error.value
        } finally {
            loading.value = false
        }
    }

    /**
     * 更新化石
     * @param id 化石 ID
     * @param data 要更新的資料 (部分)
     */
    const updateFossil = async (id: string, data: Partial<IFossil>): Promise<void> => {
        loading.value = true
        error.value = null

        try {
            const docRef = doc(fossilsCollection, id)

            // 準備更新資料，加入更新時間
            const updateData: Partial<IFossil> = {
                ...data,
                updatedAt: Timestamp.now() as Date | string | Timestamp,
            }

            // 移除 id (不應該更新 id)
            const { id: _, ...dataWithoutId } = updateData

            await updateDoc(docRef, dataWithoutId as Partial<Omit<IFossil, 'id'>>)

            // 更新本地狀態
            if (currentFossil.value?.id === id) {
                currentFossil.value = {
                    ...currentFossil.value,
                    ...updateData,
                } as IFossil
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '更新化石失敗'
            error.value = new Error(errorMessage)
            console.error('❌ updateFossil error:', err)
            throw error.value
        } finally {
            loading.value = false
        }
    }

    /**
     * 刪除化石
     * @param id 化石 ID
     */
    const deleteFossil = async (id: string): Promise<void> => {
        loading.value = true
        error.value = null

        try {
            const docRef = doc(fossilsCollection, id)
            await deleteDoc(docRef)

            // 更新本地狀態
            fossils.value = fossils.value.filter((f) => f.id !== id)
            if (currentFossil.value?.id === id) {
                currentFossil.value = null
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '刪除化石失敗'
            error.value = new Error(errorMessage)
            console.error('❌ deleteFossil error:', err)
            throw error.value
        } finally {
            loading.value = false
        }
    }

    /**
     * 清除錯誤狀態
     */
    const clearError = () => {
        error.value = null
    }

    /**
     * 重置狀態
     */
    const reset = () => {
        fossils.value = []
        currentFossil.value = null
        error.value = null
        loading.value = false
    }

    return {
        // 狀態
        fossils: readonly(fossils),
        currentFossil: readonly(currentFossil),
        loading: readonly(loading),
        error: readonly(error),

        // 方法
        fetchFossils,
        fetchFossilById,
        createFossil,
        updateFossil,
        deleteFossil,
        clearError,
        reset,
    }
}

