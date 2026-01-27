/**
 * 圖片相關型別定義
 * 用於化石和作品集的圖片資料結構
 */

/**
 * 基礎圖片介面 - 共用屬性
 */
export interface IBaseImage {
    /** 圖片 URL */
    url: string
    /** 圖片說明/標題 */
    caption?: string
    /** 圖片替代文字 (用於無障礙) */
    alt?: string
    /** 圖片寬度 (px) */
    width?: number
    /** 圖片高度 (px) */
    height?: number
    /** 縮圖 URL (用於預覽) */
    thumbnail?: string
}

/**
 * 化石圖片介面
 */
export interface IFossilImage extends IBaseImage {
    /** 圖片類型 */
    type: 'main' | 'detail' | 'comparison' | 'location'
    /** 拍攝角度 */
    angle?: 'top' | 'side' | 'bottom' | 'front' | 'back'
    /** 是否為主要展示圖片 */
    isPrimary?: boolean
    /** 圖片順序 */
    order?: number
}

/**
 * 作品集圖片介面
 */
export interface IProjectImage extends IBaseImage {
    /** 圖片類型 */
    type: 'desktop' | 'mobile' | 'detail' | 'thumbnail'
    /** 圖片順序 */
    order?: number
}

/**
 * 圖片上傳資訊
 */
export interface IImageUpload {
    /** 檔案名稱 */
    filename: string
    /** 檔案大小 (bytes) */
    size: number
    /** MIME 類型 */
    mimeType: string
    /** 上傳進度 (0-100) */
    progress?: number
    /** 上傳狀態 */
    status?: 'pending' | 'uploading' | 'success' | 'error'
    /** 錯誤訊息 */
    error?: string
}

