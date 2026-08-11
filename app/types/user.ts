/**
 * 使用者資料型別定義
 */

/**
 * 使用者角色
 */
export type UserRole = "user" | "admin";

/**
 * 使用者偏好設定
 */
export interface IUserPreferences {
  /** 語言偏好 */
  language: "zh-TW" | "en";
  /** 主題 (選填) */
  theme?: "light" | "dark";
  /** 通知開關 */
  notifications?: boolean;
}

/**
 * 使用者完整資料介面
 */
export interface IUser {
  /** Auth UID */
  uid: string;
  /** 使用者 Email */
  email: string;
  /** 顯示名稱 */
  displayName?: string;
  /** 頭像 URL */
  photoURL?: string;

  /** 收藏列表 */
  favorites: string[];
  /** 收藏總數 */
  favoriteCount: number;

  /** 偏好設定 */
  preferences?: IUserPreferences;

  /** 角色 */
  role?: UserRole;
  /** 帳號是否啟用 */
  isActive?: boolean;

  /** 時間戳記 */
  createdAt: Date | string;
  updatedAt: Date | string;
  lastLoginAt?: Date | string;
}

/**
 * 收藏關係介面
 */
export interface IFavorite {
  /** Document ID */
  id: string;
  /** 使用者 UID */
  userId: string;
  /** 化石 ID */
  fossilId: string;
  /** 收藏時間 */
  createdAt: Date | string;
}
