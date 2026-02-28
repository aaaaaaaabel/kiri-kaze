/**
 * 作品集相關型別定義
 * 用於個人作品集專案的資料結構
 */

import type { IProjectImage } from './image'
import type { Timestamp } from 'firebase/firestore'

/**
 * 專案分類型別
 */
export type ProjectCategory = 'work' | 'personal' | 'side-project'

/**
 * 技術分類型別
 */
export type TechnologyCategory = 'frontend' | 'backend' | 'database' | 'tools' | 'design' | 'other'

/**
 * 技術標籤介面
 */
export interface ITechnology {
    /** 技術名稱 (如 'Nuxt 4', 'TypeScript') */
    name: string
    /** 技術分類 */
    category: TechnologyCategory
    /** 技術圖示 URL (選填) */
    icon?: string
}

/**
 * 作品集專案主介面
 */
export interface IProject {
    /** Firebase Document ID */
    id: string

    /** URL 友善的 ID (如 'lrc-member-system') */
    slug: string

    /** 專案標題 (中文) */
    title: string

    /** 專案標題 (英文, 選填) */
    titleEn?: string

    /** 公司名稱 (選填) */
    company?: string

    /** 擔任角色 */
    role: string

    /** 專案期間 (如 '2024.01 - 2024.12') */
    period: string

    /** 專案描述 */
    description: string

    /** 技術挑戰 (選填) */
    challenges?: string

    /** 專案成果 (選填) */
    achievements?: string

    /** 技術棧 */
    technologies: ITechnology[]

    /** 縮圖 URL (用於 grid_item 模式 - 項目顯示) */
    thumbnail: string

    /** 封面圖 URL (用於 grid_image 模式 - 圖片顯示, 選填) */
    cover?: string

    /** 詳細圖片陣列 */
    images: IProjectImage[]

    /** 專案網址 (選填) */
    url?: string

    /** GitHub 儲存庫連結 (選填) */
    github?: string

    /** 專案分類 */
    category: ProjectCategory

    /** 是否在作品集首頁顯示 */
    featured: boolean

    /** 標籤 (用於搜尋和分類) */
    tags?: string[]

    /** 是否公開顯示 */
    isPublic?: boolean

    /** 建立時間 */
    createdAt: Date | string | Timestamp

    /** 更新時間 */
    updatedAt: Date | string | Timestamp
}

/**
 * 專案分類的中英文對照
 */
export const PROJECT_CATEGORY_LABELS: Record<ProjectCategory, { zh: string; en: string }> = {
    work: { zh: '公司專案', en: 'Work Project' },
    personal: { zh: '個人專案', en: 'Personal Project' },
    'side-project': { zh: '副業專案', en: 'Side Project' },
}

/**
 * 技術分類的中英文對照
 */
export const TECHNOLOGY_CATEGORY_LABELS: Record<TechnologyCategory, { zh: string; en: string }> = {
    frontend: { zh: '前端', en: 'Frontend' },
    backend: { zh: '後端', en: 'Backend' },
    database: { zh: '資料庫', en: 'Database' },
    tools: { zh: '工具', en: 'Tools' },
    design: { zh: '設計', en: 'Design' },
    other: { zh: '其他', en: 'Other' },
}

