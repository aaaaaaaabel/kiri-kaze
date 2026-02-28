/**
 * 化石資料型別定義
 * 參考 LRC 的型別定義方式
 */

import type { Timestamp } from 'firebase/firestore'

/**
 * 化石分類
 */
export type FossilCategory = 'trilobite' | 'ammonite' | 'dinosaur' | 'plant' | 'fish' | 'mammal' | 'other'

/**
 * 地質年代 - 代
 */
export type GeologicalEra = 'paleozoic' | 'mesozoic' | 'cenozoic' | 'precambrian'

/**
 * 圖片類型
 */
export type FossilImageType = 'main' | 'detail' | 'fossil' | 'reconstruction' | 'microscope' | 'diagram'

/**
 * 標本類型
 */
export type SpecimenType = 'complete-skeleton' | 'partial-skeleton' | 'isolated-element' | 'trace'

/**
 * 標本部位類別
 */
export type BodyPartCategory = 'skull' | 'limb' | 'vertebra' | 'rib' | 'tail' | 'tooth' | 'claw' | 'other'

/**
 * 保存狀態
 */
export type SpecimenCondition = 'excellent' | 'good' | 'fair' | 'poor'

/**
 * 化石圖片介面
 */
export interface IFossilImage {
  /** Firebase Storage 相對路徑 */
  url: string
  /** 圖片寬度 (px) - 瀑布流佈局需要 */
  width: number
  /** 圖片高度 (px) - 瀑布流佈局需要 */
  height: number
  /** 圖片類型 */
  type: FossilImageType
  /** 圖片說明 */
  caption?: string
  /** 替代文字 */
  alt?: string
  /** 排序順序 */
  order?: number
}

/**
 * 分類資訊（界門綱目科屬種）
 */
export interface IFossilTaxonomy {
  /** 界 */
  kingdom: string
  /** 門 */
  phylum: string
  /** 綱 */
  class: string
  /** 目 */
  order: string
  /** 科 */
  family: string
  /** 屬 */
  genus: string
  /** 種 */
  species: string
}

/**
 * 地質年代資訊
 */
export interface IFossilPeriod {
  /** 代 */
  era: string
  /** 紀 */
  period: string
  /** 世 (選填) */
  epoch?: string
  /** 年代範圍 (例如: '5.4-4.9億年前') */
  age: string
  /** 開始年代 (百萬年前) - 用於排序 */
  startMya?: number
  /** 結束年代 (百萬年前) */
  endMya?: number
}

/**
 * 名稱資訊
 */
export interface IFossilName {
  /** 中文名稱 */
  zh: string
  /** 英文名稱 */
  en: string
  /** 學名 */
  scientific: string
}

/**
 * 物種資訊 (用於 /species collection)
 * 代表一個生物物種，包含多個標本
 */
export interface ISpecies {
  /** Firestore 自動生成的 ID */
    id: string
  /** URL 友善的唯一識別碼 */
  slug: string
  
  /** 名稱資訊 */
  name: IFossilName

  /** 分類資訊 */
  taxonomy: IFossilTaxonomy

    /** 地質年代資訊 */
  period: IFossilPeriod
  
  /** 內容資訊 */
  description: {
    /** 中文描述 */
    zh: string
    /** 英文描述 (選填) */
    en?: string
  }
  
  /** 特徵描述 */
  characteristics?: string
  /** 棲息地 */
  habitat?: string
  /** 分布地區 */
  distribution?: string

  /** 代表圖 (復原圖/骨架圖) */
  representativeImage?: string
  /** 標本數量 (快取) */
  specimenCount: number

  /** 標籤與分類 */
  tags: string[]
  category: FossilCategory

  /** 時間戳記 */
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

/**
 * 標本資訊 (用於 /fossils collection)
 * 代表一個具體的化石標本，屬於某個物種
 */
export interface IFossil {
  /** Firestore 自動生成的 ID */
  id: string
  /** URL 友善的唯一識別碼 */
  slug: string
  /** 短碼（用於簡化 URL 和圖片路徑） */
  shortCode?: string

  /** 物種參照 (精簡版,避免重複太多資料) */
  speciesRef: {
    id: string
    slug: string
    name: {
      zh: string
      scientific: string
    }
  }
  
  /** 標本特定資訊 */
  specimen: {
    type: SpecimenType
    
    /** 部位資訊 (如果是部位化石) */
    bodyPart?: {
      category: BodyPartCategory
      specific: string  // tooth | claw | femur | tibia | skull-fragment 等
      position?: string // 更詳細的位置描述,例如: "上顎左側第三顆"
      side?: 'left' | 'right' | null
    }
    
    /** 完整度百分比 (0-100) */
    completeness: number
    /** 保存狀態 */
    condition: SpecimenCondition
    
    /** 館藏資訊 */
    catalogNumber?: string      // 館藏編號
    collectionDate?: string     // 發現日期
    
    /** 產地資訊（增強版） */
    location?: {
      /** 產區唯一識別碼（用於分組和切換） */
      locationId?: string  // 例如: "morocco-ouarzazate" 或 "china-liaoning"
      
      /** 國家 */
      country?: string
      /** 州/省 */
      state?: string
      /** 城市/地區 */
      city?: string
      /** 地層名稱 */
      formation?: string
      /** 地層年代（選填） */
      formationAge?: string
      
      /** 產區顯示名稱（組合後的完整名稱） */
      displayName?: string  // 例如: "摩洛哥, Ouarzazate, Fezouata Formation"
    }
    
    /** 尺寸 */
    measurements?: {
      length?: number   // cm
      width?: number    // cm
      height?: number   // cm
      weight?: number   // g
    }
    }

  /** 圖片 (該標本的多角度照片!) */
  images: Array<{
    url: string
    type: 'main' | 'detail' | 'microscope' | 'diagram'
    caption?: string  // 圖片說明,例如: "側面觀", "鋸齒特寫"
    order: number
  }>

  /** 主圖 (用於首頁瀑布流) */
  thumbnail: string
  
  /** 標本描述 (非物種描述) */
  description?: {
    zh: string
    en?: string
  }

  /** 標籤與分類 */
  tags: string[]
  category: FossilCategory

  /** 收藏與狀態 */
  likeCount: number
  viewCount: number
  isPublic: boolean
  featured: boolean

  /** 時間戳記 */
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

/**
 * 查詢選項
 */
export interface IFetchFossilsOptions {
  /** 分類篩選 */
  category?: FossilCategory
  /** 地質年代篩選 */
  era?: GeologicalEra
  /** 標籤篩選 */
  tags?: string[]
  /** 是否只顯示精選 */
  featuredOnly?: boolean
  /** 每頁數量 */
  limit?: number
  /** 最後一個文件的 ID (分頁用) */
  lastDocId?: string
  /** 排序欄位 */
  sortBy?: 'createdAt' | 'likeCount' | 'viewCount'
  /** 排序方向 */
  sortDirection?: 'asc' | 'desc'
}
