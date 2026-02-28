/**
 * 使用者資料型別定義
 * 參考 LRC 的型別定義方式
 */

import type { Timestamp } from 'firebase/firestore'

/**
 * 使用者角色
 */
export type UserRole = 'user' | 'admin'

/**
 * 使用者偏好設定
 */
export interface IUserPreferences {
  /** 語言偏好 */
  language: 'zh-TW' | 'en'
  /** 主題 (選填) */
  theme?: 'light' | 'dark'
  /** 通知開關 */
  notifications?: boolean
}

/**
 * 使用者完整資料介面
 */
export interface IUser {
  /** Firebase Auth UID */
  uid: string
  /** 使用者 Email */
  email: string
  /** 顯示名稱 */
  displayName?: string
  /** 頭像 URL */
  photoURL?: string
  
  /** 收藏列表 */
  favorites: string[]
  /** 收藏總數 */
  favoriteCount: number
  
  /** 偏好設定 */
  preferences?: IUserPreferences
  
  /** 角色 */
  role?: UserRole
  /** 帳號是否啟用 */
  isActive?: boolean
  
  /** 時間戳記 */
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
  lastLoginAt?: Timestamp | Date
}

/**
 * 收藏關係介面
 */
export interface IFavorite {
  /** Firestore 自動生成的 ID */
  id: string
  /** 使用者 UID */
  userId: string
  /** 化石 ID */
  fossilId: string
  /** 收藏時間 */
  createdAt: Timestamp | Date
}

