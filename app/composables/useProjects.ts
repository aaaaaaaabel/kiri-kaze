/**
 * 作品集專案操作 Composable
 * 提供作品集專案的 CRUD 操作和資料查詢功能
 * 支援 Firestore 失敗時自動使用 mock 資料作為 fallback
 */

import type { IProject, ProjectCategory } from '~/types/portfolio'
import type { SortDirection, IPaginationOptions } from '~/types/common'
import type { CollectionReference, Query } from 'firebase/firestore'
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, limit, startAfter, Timestamp, where } from 'firebase/firestore'
import { useFirestore } from 'vuefire'
import { ref, readonly } from 'vue'
import { mockProjects } from '~/data/mockProjects'

/**
 * 排序選項
 */
export type ProjectSortOption = 'createdAt' | 'updatedAt' | 'period'

/**
 * 查詢選項
 */
export interface IFetchProjectsOptions extends IPaginationOptions {
    /** 排序欄位 */
    sortBy?: ProjectSortOption
    /** 排序方向 */
    sortDirection?: SortDirection
    /** 專案分類篩選 */
    category?: ProjectCategory
    /** 是否只顯示精選的專案 */
    featuredOnly?: boolean
    /** 是否只顯示公開的專案 */
    publicOnly?: boolean
}

/**
 * 使用作品集專案資料的 Composable
 */
export const useProjects = () => {
    const db = useFirestore()
    let projectsCollection: CollectionReference<IProject> | null = null

    // 嘗試初始化 collection
    try {
        if (db) {
            projectsCollection = collection(db, 'projects') as CollectionReference<IProject>
        }
    } catch (err) {
        console.warn('⚠️ 無法初始化 Firestore collection:', err)
    }

    // 狀態管理
    const loading = ref(false)
    const error = ref<Error | null>(null)
    const projects = ref<IProject[]>([])
    const currentProject = ref<IProject | null>(null)

    /**
     * 對 mock 資料套用篩選條件
     */
    function applyMockFallback(options: IFetchProjectsOptions = {}): IProject[] {
        console.log('[useProjects] applyMockFallback called with options:', options)
        const {
            category,
            featuredOnly = false,
            publicOnly = true,
        } = options

        let filtered = [...mockProjects]
        console.log('[useProjects] mockProjects length:', mockProjects.length)

        // 篩選公開專案
        if (publicOnly) {
            filtered = filtered.filter((project) => project.isPublic !== false)
        }

        // 篩選精選專案
        if (featuredOnly) {
            filtered = filtered.filter((project) => project.featured === true)
        }

        // 篩選分類
        if (category) {
            filtered = filtered.filter((project) => project.category === category)
        }

        // 排序
        const { sortBy = 'createdAt', sortDirection = 'desc' } = options
        filtered.sort((a, b) => {
            let aValue: any
            let bValue: any

            if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
                aValue = a[sortBy] instanceof Date ? a[sortBy].getTime() : new Date(a[sortBy] as string).getTime()
                bValue = b[sortBy] instanceof Date ? b[sortBy].getTime() : new Date(b[sortBy] as string).getTime()
            } else if (sortBy === 'period') {
                aValue = a.period
                bValue = b.period
            } else {
                return 0
            }

            if (sortDirection === 'asc') {
                return aValue > bValue ? 1 : -1
            } else {
                return aValue < bValue ? 1 : -1
            }
        })

        // 分頁
        const { pageSize = 20, lastDocId } = options
        if (lastDocId) {
            const lastIndex = filtered.findIndex((p) => p.id === lastDocId)
            if (lastIndex >= 0) {
                filtered = filtered.slice(lastIndex + 1)
            }
        }
        if (pageSize) {
            filtered = filtered.slice(0, pageSize)
        }

        console.log('[useProjects] applyMockFallback result length:', filtered.length)
        return filtered
    }

    /**
     * 獲取專案列表
     * @param options 查詢選項
     * @returns 專案陣列
     */
    const fetchProjects = async (options: IFetchProjectsOptions = {}): Promise<IProject[]> => {
        loading.value = true
        error.value = null

        // 1️⃣ 防呆：檢查 Firestore 是否可用 - 更嚴格的檢查
        if (!db || !projectsCollection) {
            console.warn('⚠️ Firestore 未初始化，直接使用 mock 資料 fallback')
            const fallbackResult = applyMockFallback(options)
            projects.value = fallbackResult
            loading.value = false
            console.log('[useProjects] final projects:', projects.value.length)
            return fallbackResult
        }

        // 嘗試執行 Firestore 查詢，任何錯誤都 fallback
        try {
            const {
                sortBy = 'createdAt',
                sortDirection = 'desc',
                pageSize = 20,
                category,
                featuredOnly = false,
                publicOnly = true,
            } = options

            // 建立查詢
            let q: Query<IProject> = query(projectsCollection)

            // 篩選條件
            if (publicOnly) {
                q = query(q, where('isPublic', '==', true))
            }

            if (featuredOnly) {
                q = query(q, where('featured', '==', true))
            }

            if (category) {
                q = query(q, where('category', '==', category))
            }

            // 排序 (必須在 where 之後)
            q = query(q, orderBy(sortBy, sortDirection))

            // 分頁
            if (pageSize) {
                q = query(q, limit(pageSize))
            }

            // 如果有 lastDocId，從該文件之後開始查詢
            if (options.lastDocId) {
                const lastDocSnapshot = await getDoc(doc(projectsCollection, options.lastDocId))
                if (lastDocSnapshot.exists()) {
                    q = query(q, startAfter(lastDocSnapshot))
                }
            }

            // 執行查詢
            const querySnapshot = await getDocs(q)

            // 3️⃣ 檢查 querySnapshot.empty
            if (querySnapshot.empty) {
                console.warn('⚠️ Firestore 查詢結果為空，使用 mock 資料 fallback')
                const fallbackResult = applyMockFallback(options)
                projects.value = fallbackResult
                loading.value = false
                console.log('[useProjects] final projects:', projects.value.length)
                return fallbackResult
            }

            const fetchedProjects: IProject[] = []

            querySnapshot.forEach((docSnapshot) => {
                const data = docSnapshot.data()
                fetchedProjects.push({
                    ...data,
                    id: docSnapshot.id,
                } as IProject)
            })

            // 如果 Firestore 回傳空陣列，使用 mock 資料
            if (fetchedProjects.length === 0) {
                console.warn('⚠️ Firestore 回傳空陣列，使用 mock 資料 fallback')
                const fallbackResult = applyMockFallback(options)
                projects.value = fallbackResult
                loading.value = false
                console.log('[useProjects] final projects:', projects.value.length)
                return fallbackResult
            }

            projects.value = fetchedProjects
            loading.value = false
            console.log('[useProjects] final projects:', projects.value.length)
            return fetchedProjects
        } catch (err) {
            // 2️⃣ catch 區塊：不要 throw，使用 mock 資料作為 fallback
            console.warn('⚠️ Firestore 查詢失敗，使用 mock 資料 fallback:', err)
            const fallbackResult = applyMockFallback(options)
            projects.value = fallbackResult
            error.value = null
            loading.value = false
            console.log('[useProjects] final projects:', projects.value.length)
            return fallbackResult
        }
    }

    /**
     * 根據 slug 獲取單筆專案
     * @param slug 專案 slug
     * @returns 專案資料
     */
    const fetchProjectBySlug = async (slug: string): Promise<IProject | null> => {
        loading.value = true
        error.value = null

        // 檢查 Firestore 是否可用
        if (!db || !projectsCollection) {
            const mockProject = mockProjects.find((p) => p.slug === slug)
            if (mockProject) {
                currentProject.value = mockProject
                loading.value = false
                return mockProject
            }
            error.value = new Error(`找不到 slug 為 ${slug} 的專案`)
            currentProject.value = null
            loading.value = false
            return null
        }

        try {
            const q = query(projectsCollection, where('slug', '==', slug), limit(1))
            const querySnapshot = await getDocs(q)

            if (querySnapshot.empty) {
                // Firestore 找不到，從 mock 資料中尋找
                const mockProject = mockProjects.find((p) => p.slug === slug)
                if (mockProject) {
                    currentProject.value = mockProject
                    loading.value = false
                    return mockProject
                }
                error.value = new Error(`找不到 slug 為 ${slug} 的專案`)
                currentProject.value = null
                loading.value = false
                return null
            }

            const docSnapshot = querySnapshot.docs[0]

            // 檢查 docSnapshot 是否存在
            if (!docSnapshot) {
                // Firestore 找不到，從 mock 資料中尋找
                const mockProject = mockProjects.find((p) => p.slug === slug)
                if (mockProject) {
                    currentProject.value = mockProject
                    loading.value = false
                    return mockProject
                }
                error.value = new Error(`找不到 slug 為 ${slug} 的專案`)
                currentProject.value = null
                loading.value = false
                return null
            }

            const data = docSnapshot.data()
            const project: IProject = {
                ...data,
                id: docSnapshot.id,
            } as IProject

            currentProject.value = project
            loading.value = false
            return project
        } catch (err) {
            // Firestore 失敗時，從 mock 資料中尋找
            console.warn('⚠️ Firestore 查詢失敗，從 mock 資料中尋找:', err)
            const mockProject = mockProjects.find((p) => p.slug === slug)
            if (mockProject) {
                currentProject.value = mockProject
                error.value = null
                loading.value = false
                return mockProject
            }
            const errorMessage = err instanceof Error ? err.message : '獲取專案失敗'
            error.value = new Error(errorMessage)
            currentProject.value = null
            loading.value = false
            return null
        }
    }

    /**
     * 根據 ID 獲取單筆專案
     * @param id 專案 ID
     * @returns 專案資料
     */
    const fetchProjectById = async (id: string): Promise<IProject | null> => {
        loading.value = true
        error.value = null

        // 檢查 Firestore 是否可用
        if (!db || !projectsCollection) {
            const mockProject = mockProjects.find((p) => p.id === id)
            if (mockProject) {
                currentProject.value = mockProject
                loading.value = false
                return mockProject
            }
            error.value = new Error(`找不到 ID 為 ${id} 的專案`)
            currentProject.value = null
            loading.value = false
            return null
        }

        try {
            const docRef = doc(projectsCollection, id)
            const docSnapshot = await getDoc(docRef)

            if (!docSnapshot.exists()) {
                // Firestore 找不到，從 mock 資料中尋找
                const mockProject = mockProjects.find((p) => p.id === id)
                if (mockProject) {
                    currentProject.value = mockProject
                    loading.value = false
                    return mockProject
                }
                error.value = new Error(`找不到 ID 為 ${id} 的專案`)
                currentProject.value = null
                loading.value = false
                return null
            }

            const data = docSnapshot.data()
            const project: IProject = {
                ...data,
                id: docSnapshot.id,
            } as IProject

            currentProject.value = project
            loading.value = false
            return project
        } catch (err) {
            // Firestore 失敗時，從 mock 資料中尋找
            console.warn('⚠️ Firestore 查詢失敗，從 mock 資料中尋找:', err)
            const mockProject = mockProjects.find((p) => p.id === id)
            if (mockProject) {
                currentProject.value = mockProject
                error.value = null
                loading.value = false
                return mockProject
            }
            const errorMessage = err instanceof Error ? err.message : '獲取專案失敗'
            error.value = new Error(errorMessage)
            currentProject.value = null
            loading.value = false
            return null
        }
    }

    /**
     * 新增專案
     * @param data 專案資料 (部分)
     * @returns 建立的專案 ID
     */
    const createProject = async (data: Partial<IProject>): Promise<string> => {
        loading.value = true
        error.value = null

        if (!db || !projectsCollection) {
            const errorMessage = 'Firestore 未初始化，無法新增專案'
            error.value = new Error(errorMessage)
            loading.value = false
            throw error.value
        }

        try {
            // 準備資料，加入時間戳記
            const projectData: Partial<IProject> = {
                ...data,
                createdAt: (data.createdAt as Date | string | Timestamp) || Timestamp.now(),
                updatedAt: Timestamp.now() as Date | string | Timestamp,
            }

            // 移除 id (Firebase 會自動產生)
            const { id: _, ...dataWithoutId } = projectData

            const docRef = await addDoc(projectsCollection, dataWithoutId as Omit<IProject, 'id'>)
            loading.value = false
            return docRef.id
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '新增專案失敗'
            error.value = new Error(errorMessage)
            console.error('❌ createProject error:', err)
            loading.value = false
            throw error.value
        }
    }

    /**
     * 更新專案
     * @param id 專案 ID
     * @param data 要更新的資料 (部分)
     */
    const updateProject = async (id: string, data: Partial<IProject>): Promise<void> => {
        loading.value = true
        error.value = null

        if (!db || !projectsCollection) {
            const errorMessage = 'Firestore 未初始化，無法更新專案'
            error.value = new Error(errorMessage)
            loading.value = false
            throw error.value
        }

        try {
            const docRef = doc(projectsCollection, id)

            // 準備更新資料，加入更新時間
            const updateData: Partial<IProject> = {
                ...data,
                updatedAt: Timestamp.now() as Date | string | Timestamp,
            }

            // 移除 id (不應該更新 id)
            const { id: _, ...dataWithoutId } = updateData

            await updateDoc(docRef, dataWithoutId as Partial<Omit<IProject, 'id'>>)

            // 更新本地狀態
            if (currentProject.value?.id === id) {
                currentProject.value = {
                    ...currentProject.value,
                    ...updateData,
                } as IProject
            }
            loading.value = false
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '更新專案失敗'
            error.value = new Error(errorMessage)
            console.error('❌ updateProject error:', err)
            loading.value = false
            throw error.value
        }
    }

    /**
     * 刪除專案
     * @param id 專案 ID
     */
    const deleteProject = async (id: string): Promise<void> => {
        loading.value = true
        error.value = null

        if (!db || !projectsCollection) {
            const errorMessage = 'Firestore 未初始化，無法刪除專案'
            error.value = new Error(errorMessage)
            loading.value = false
            throw error.value
        }

        try {
            const docRef = doc(projectsCollection, id)
            await deleteDoc(docRef)

            // 更新本地狀態
            projects.value = projects.value.filter((p) => p.id !== id)
            if (currentProject.value?.id === id) {
                currentProject.value = null
            }
            loading.value = false
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '刪除專案失敗'
            error.value = new Error(errorMessage)
            console.error('❌ deleteProject error:', err)
            loading.value = false
            throw error.value
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
        projects.value = []
        currentProject.value = null
        error.value = null
        loading.value = false
    }

    return {
        // 狀態
        projects: readonly(projects),
        currentProject: readonly(currentProject),
        loading: readonly(loading),
        error: readonly(error),

        // 方法
        fetchProjects,
        fetchProjectBySlug,
        fetchProjectById,
        createProject,
        updateProject,
        deleteProject,
        clearError,
        reset,
    }
}
