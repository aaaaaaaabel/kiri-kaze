/**
 * 作品集專案操作 Composable
 * 提供作品集專案的 CRUD 操作和資料查詢功能
 */

import type { IProject, ProjectCategory } from '~/types/portfolio'
import type { SortDirection, IPaginationOptions } from '~/types/common'
import type { CollectionReference, Query } from 'firebase/firestore'
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, limit, startAfter, Timestamp, where } from 'firebase/firestore'
import { useFirestore } from 'vuefire'
import { ref, readonly } from 'vue'
import { getStorageUrl } from '~/utils/storage'

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
    // SSR 時 Firebase 未初始化，回傳 stub 避免 500
    if (import.meta.server) {
        const loading = ref(false)
        const error = ref<Error | null>(null)
        const projects = ref<IProject[]>([])
        const currentProject = ref<IProject | null>(null)
        const noop = async () => [] as IProject[]
        const noopNull = async () => null as IProject | null
        return {
            projects: readonly(projects),
            currentProject: readonly(currentProject),
            loading: readonly(loading),
            error: readonly(error),
            fetchProjects: noop,
            fetchProjectBySlug: noopNull,
            fetchProjectById: noopNull,
            createProject: noopNull,
            updateProject: async () => {},
            deleteProject: async () => {},
            clearError: () => {},
            reset: () => {},
            waitForFirestore: () => Promise.resolve(),
        }
    }

    const config = useFirebaseConfig();
    const firebaseConfigIncomplete =
        !config.apiKey ||
        !config.authDomain ||
        !config.projectId

    let db = useFirestore()
    let projectsCollection: CollectionReference<IProject> | null = null

    const ensureFirestore = (): CollectionReference<IProject> | null => {
        if (projectsCollection) return projectsCollection
        const cfg = useFirebaseConfig()
        const nextDb = useFirestore()
        if (nextDb && cfg.apiKey && cfg.authDomain && cfg.projectId) {
            db = nextDb
            projectsCollection = collection(db, 'projects') as CollectionReference<IProject>
            return projectsCollection
        }
        return null
    }

    /** Client 專用：輪詢直到 Firestore 就緒或逾時（用於重整後第一次 fetch 前） */
    const waitForFirestore = (maxMs = 4000): Promise<void> => {
        return new Promise((resolve) => {
            const start = Date.now()
            const check = () => {
                if (ensureFirestore()) return resolve()
                if (Date.now() - start >= maxMs) return resolve()
                setTimeout(check, 80)
            }
            check()
        })
    }

    // 初始化 collection（VueFire 可能尚未就緒，fetchProjects 內會再試一次）
    try {
        if (db && !firebaseConfigIncomplete) {
            projectsCollection = collection(db, 'projects') as CollectionReference<IProject>
        }
    } catch (err) {
        // 初始化失敗時 projectsCollection 保持為 null
    }

    // 狀態管理
    const loading = ref(false)
    const error = ref<Error | null>(null)
    const projects = ref<IProject[]>([])
    const currentProject = ref<IProject | null>(null)

    // 取得 bucket（每次讀取以支援 VueFire 晚就緒）
    const getBucket = (): string | undefined => {
        return useFirebaseConfig().storageBucket
    }


    /**
     * 獲取專案列表
     * @param options 查詢選項
     * @returns 專案陣列
     */
    const fetchProjects = async (options: IFetchProjectsOptions = {}): Promise<IProject[]> => {
        loading.value = true
        error.value = null

        const col = ensureFirestore()
        if (!col) {
            projects.value = []
            loading.value = false
            return []
        }

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
            let q: Query<IProject> = query(col)

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
                const lastDocSnapshot = await getDoc(doc(col, options.lastDocId))
                if (lastDocSnapshot.exists()) {
                    q = query(q, startAfter(lastDocSnapshot))
                }
            }

            const bucket = getBucket()

            // 執行查詢
            const querySnapshot = await getDocs(q)

            if (querySnapshot.empty) {
                projects.value = []
                loading.value = false
                return []
            }

            const fetchedProjects: IProject[] = []
            const convertUrl = (url: string) => bucket ? getStorageUrl(url, bucket) : url

            querySnapshot.forEach((docSnapshot) => {
                const data = docSnapshot.data()
                const project: IProject = {
                    ...data,
                    id: docSnapshot.id,
                    slug: (data as any)?.slug || docSnapshot.id,
                    thumbnail: data.thumbnail ? convertUrl(data.thumbnail) : '',
                    cover: data.cover ? convertUrl(data.cover) : undefined,
                    technologies: Array.isArray(data.technologies) ? data.technologies : [],
                    images: Array.isArray(data.images) 
                        ? data.images.map((img: any) => ({
                            ...img,
                            url: img.url ? convertUrl(img.url) : '',
                        }))
                        : [],
                } as IProject
                fetchedProjects.push(project)
            })

            projects.value = fetchedProjects
            loading.value = false
            return fetchedProjects
        } catch (err) {
            projects.value = []
            error.value = err instanceof Error ? err : new Error('Firestore 查詢失敗')
            loading.value = false
            return []
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

        const col = ensureFirestore()
        if (!col) {
            if (import.meta.server) {
                currentProject.value = null
                loading.value = false
                return null
            }
            error.value = new Error('Firestore 未初始化')
            currentProject.value = null
            loading.value = false
            return null
        }

        try {
            const q = query(col, where('slug', '==', slug), limit(1))
            const querySnapshot = await getDocs(q)

            if (querySnapshot.empty || !querySnapshot.docs[0]) {
                error.value = new Error(`找不到 slug 為 ${slug} 的專案`)
                currentProject.value = null
                loading.value = false
                return null
            }

            const docSnapshot = querySnapshot.docs[0]
            const data = docSnapshot.data()
            const bucket = getBucket()
            const convertUrl = (url: string) => bucket ? getStorageUrl(url, bucket) : url
            
            const project: IProject = {
                ...data,
                id: docSnapshot.id,
                slug: (data as any)?.slug || docSnapshot.id,
                thumbnail: data.thumbnail ? convertUrl(data.thumbnail) : '',
                cover: data.cover ? convertUrl(data.cover) : undefined,
                technologies: Array.isArray(data.technologies) ? data.technologies : [],
                images: Array.isArray(data.images) 
                    ? data.images.map((img: any) => ({
                        ...img,
                        url: img.url ? convertUrl(img.url) : '',
                    }))
                    : [],
            } as IProject

            currentProject.value = project
            loading.value = false
            return project
        } catch (err) {
            error.value = err instanceof Error ? err : new Error('獲取專案失敗')
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

        const col = ensureFirestore()
        if (!col) {
            error.value = new Error('Firestore 未初始化')
            currentProject.value = null
            loading.value = false
            return null
        }

        try {
            const bucket = getBucket()
            const convertUrl = (url: string) => bucket ? getStorageUrl(url, bucket) : url
            
            const docRef = doc(col, id)
            const docSnapshot = await getDoc(docRef)

            if (!docSnapshot.exists()) {
                error.value = new Error(`找不到 ID 為 ${id} 的專案`)
                currentProject.value = null
                loading.value = false
                return null
            }

            const data = docSnapshot.data()
            const project: IProject = {
                ...data,
                id: docSnapshot.id,
                thumbnail: data.thumbnail ? convertUrl(data.thumbnail) : '',
                cover: data.cover ? convertUrl(data.cover) : undefined,
                technologies: Array.isArray(data.technologies) ? data.technologies : [],
                images: Array.isArray(data.images) 
                    ? data.images.map((img: any) => ({
                        ...img,
                        url: img.url ? convertUrl(img.url) : '',
                    }))
                    : [],
            } as IProject

            currentProject.value = project
            loading.value = false
            return project
        } catch (err) {
            error.value = err instanceof Error ? err : new Error('獲取專案失敗')
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

        const col = ensureFirestore()
        if (!col) {
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

            const docRef = await addDoc(col, dataWithoutId as Omit<IProject, 'id'>)
            loading.value = false
            return docRef.id
        } catch (err) {
            error.value = err instanceof Error ? err : new Error('新增專案失敗')
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

        const col = ensureFirestore()
        if (!col) {
            const errorMessage = 'Firestore 未初始化，無法更新專案'
            error.value = new Error(errorMessage)
            loading.value = false
            throw error.value
        }

        try {
            const docRef = doc(col, id)

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
            error.value = err instanceof Error ? err : new Error('更新專案失敗')
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

        const col = ensureFirestore()
        if (!col) {
            const errorMessage = 'Firestore 未初始化，無法刪除專案'
            error.value = new Error(errorMessage)
            loading.value = false
            throw error.value
        }

        try {
            const docRef = doc(col, id)
            await deleteDoc(docRef)

            // 更新本地狀態
            projects.value = projects.value.filter((p) => p.id !== id)
            if (currentProject.value?.id === id) {
                currentProject.value = null
            }
            loading.value = false
        } catch (err) {
            error.value = err instanceof Error ? err : new Error('刪除專案失敗')
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
        waitForFirestore,
    }
}
