/**
 * 物種資料操作 Composable
 * 提供物種的查詢功能
 */

import type { ISpecies } from '~/types/fossil'
import type { CollectionReference } from 'firebase/firestore'
import { collection, doc, getDoc } from 'firebase/firestore'
import { useFirestore } from 'vuefire'
import { ref, readonly } from 'vue'

/**
 * 使用物種資料的 Composable
 */
export const useSpecies = () => {
    // SSR 時 Firebase 未初始化，回傳 stub 避免 500
    if (import.meta.server) {
        const loading = ref(false)
        const error = ref<Error | null>(null)
        const currentSpecies = ref<ISpecies | null>(null)
        const noopNull = async () => null as ISpecies | null
        return {
            currentSpecies: readonly(currentSpecies),
            loading: readonly(loading),
            error: readonly(error),
            fetchSpeciesBySlug: noopNull,
            fetchSpeciesByCode: noopNull,
            clearError: () => {},
            reset: () => {},
        }
    }

    const db = useFirestore()
    const speciesCollection = collection(db, 'species') as CollectionReference<ISpecies>

    // 狀態管理
    const loading = ref(false)
    const error = ref<Error | null>(null)
    const currentSpecies = ref<ISpecies | null>(null)

    /**
     * 根據 slug 獲取物種
     * @param slug 物種 slug
     * @returns 物種資料
     */
    const fetchSpeciesBySlug = async (slug: string): Promise<ISpecies | null> => {
        loading.value = true
        error.value = null

        try {
            const docRef = doc(speciesCollection, slug)
            const docSnapshot = await getDoc(docRef)

            if (!docSnapshot.exists()) {
                error.value = new Error(`找不到 slug 為 ${slug} 的物種`)
                currentSpecies.value = null
                return null
            }

            const data = docSnapshot.data()
            const species: ISpecies = {
                ...data,
                id: docSnapshot.id,
            } as ISpecies

            currentSpecies.value = species
            return species
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '獲取物種失敗'
            error.value = new Error(errorMessage)
            console.error('❌ fetchSpeciesBySlug error:', err)
            currentSpecies.value = null
            return null
        } finally {
            loading.value = false
        }
    }

    /**
     * 根據 code 獲取物種（透過標本的 shortCode 查找）
     * @param code 標本的 shortCode
     * @returns 物種資料
     */
    const fetchSpeciesByCode = async (code: string): Promise<ISpecies | null> => {
        loading.value = true
        error.value = null

        try {
            // 先從 fossils collection 查找標本
            const { useFossils } = await import('./useFossils')
            const { fetchFossilByCode } = useFossils()
            const fossil = await fetchFossilByCode(code)

            if (!fossil || !fossil.speciesRef?.slug) {
                error.value = new Error(`找不到 code 為 ${code} 的標本`)
                currentSpecies.value = null
                return null
            }

            // 使用標本的 speciesRef.slug 查找物種
            return await fetchSpeciesBySlug(fossil.speciesRef.slug)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '獲取物種失敗'
            error.value = new Error(errorMessage)
            console.error('❌ fetchSpeciesByCode error:', err)
            currentSpecies.value = null
            return null
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
        currentSpecies.value = null
        error.value = null
        loading.value = false
    }

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
    }
}

