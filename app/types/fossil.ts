/**
 * 化石相關型別定義
 * 核心資料結構，組合分類學、地質年代、圖片等型別
 */

import type { ITaxonomy } from './taxonomy'
import type { IGeologicalAge } from './geology'
import type { IFossilImage } from './image'
import type { Timestamp } from 'firebase/firestore'

/**
 * 化石分類型別
 * 用於快速分類和篩選
 */
export type FossilCategory =
    | 'trilobite' // 三葉蟲
    | 'ammonite' // 菊石
    | 'dinosaur' // 恐龍
    | 'brachiopod' // 腕足動物
    | 'coral' // 珊瑚
    | 'fish' // 魚類
    | 'plant' // 植物
    | 'mammal' // 哺乳動物
    | 'reptile' // 爬行動物
    | 'mollusk' // 軟體動物
    | 'echinoderm' // 棘皮動物
    | 'other' // 其他

/**
 * 地理位置座標
 */
export interface ICoordinates {
    /** 緯度 */
    latitude: number
    /** 經度 */
    longitude: number
}

/**
 * 地理位置資訊
 */
export interface ILocation {
    /** 國家 */
    country?: string
    /** 地區/省份 */
    region?: string
    /** 具體地點/產地 */
    site?: string
    /** 地理座標 */
    coordinates?: ICoordinates
    /** 地質構造 */
    formation?: string
}

/**
 * 化石主介面
 * 包含完整的化石資訊
 */
export interface IFossil {
    /** Firebase Document ID */
    id: string

    /** 分類學資訊 */
    taxonomy: ITaxonomy

    /** 地質年代資訊 */
    geologicalAge: IGeologicalAge

    /** 圖片陣列 */
    images: IFossilImage[]

    /** 學名 (拉丁文) */
    scientificName: string

    /** 中文名稱 */
    chineseName: string

    /** 俗名/別名 (多個) */
    commonNames?: string[]

    /** 化石分類 */
    category?: FossilCategory

    /** 地理位置資訊 */
    location?: ILocation

    /** 簡短描述 */
    description?: string

    /** 詳細描述 */
    detailedDescription?: string

    /** 尺寸資訊 (cm) */
    size?: {
        length?: number
        width?: number
        height?: number
        unit?: 'cm' | 'mm' | 'm'
    }

    /** 保存狀態 */
    preservation?: 'excellent' | 'good' | 'fair' | 'poor'

    /** 收藏資訊 */
    collection?: {
        collector?: string
        collectionDate?: string
        collectionNumber?: string
    }

    /** 參考資料 */
    references?: string[]

    /** 標籤 (用於搜尋和分類) */
    tags?: string[]

    /** 是否公開顯示 */
    isPublic?: boolean

    /** 是否精選 */
    isFeatured?: boolean

    /** 建立時間 */
    createdAt: Date | string | Timestamp

    /** 更新時間 */
    updatedAt: Date | string | Timestamp
}

/**
 * 化石分類的中英文對照
 */
export const FOSSIL_CATEGORY_LABELS: Record<FossilCategory, { zh: string; en: string }> = {
    trilobite: { zh: '三葉蟲', en: 'Trilobite' },
    ammonite: { zh: '菊石', en: 'Ammonite' },
    dinosaur: { zh: '恐龍', en: 'Dinosaur' },
    brachiopod: { zh: '腕足動物', en: 'Brachiopod' },
    coral: { zh: '珊瑚', en: 'Coral' },
    fish: { zh: '魚類', en: 'Fish' },
    plant: { zh: '植物', en: 'Plant' },
    mammal: { zh: '哺乳動物', en: 'Mammal' },
    reptile: { zh: '爬行動物', en: 'Reptile' },
    mollusk: { zh: '軟體動物', en: 'Mollusk' },
    echinoderm: { zh: '棘皮動物', en: 'Echinoderm' },
    other: { zh: '其他', en: 'Other' },
}

