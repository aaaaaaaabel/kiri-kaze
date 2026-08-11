/**
 * API 請求／錯誤共用型別
 */

export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiQueryValue = string | number | boolean | null | undefined;

export type ApiQuery = Record<string, ApiQueryValue>;

/**
 * 正規化後的 API 錯誤：statusCode／message 一律從 Nitro createError 的回傳內容解出，
 * 由 server 端 statusMessage 提供實際文字，composable 不需再各自手刻 fallback 訊息。
 */
export interface ApiError {
  statusCode: number;
  message: string;
}
