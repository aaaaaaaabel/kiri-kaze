import type { ApiError } from "~/types/api";

interface NitroErrorBody {
  statusCode?: number;
  statusMessage?: string;
  message?: string;
}

interface FetchErrorLike {
  statusCode?: number;
  status?: number;
  data?: NitroErrorBody;
  message?: string;
}

/**
 * 把 $fetch 丟出的錯誤統一轉成 { statusCode, message }。
 * server 端一律用 createError({ statusCode, statusMessage }) 拋錯，
 * statusMessage 會被 Nitro 放進 response body 的 data.statusMessage，優先取用。
 */
export function normalizeApiError(err: unknown, fallbackMessage = "請求失敗"): ApiError {
  const fetchError = err as FetchErrorLike;
  const statusCode = fetchError?.data?.statusCode ?? fetchError?.statusCode ?? fetchError?.status ?? 0;
  const message = fetchError?.data?.statusMessage ?? fetchError?.data?.message ?? fetchError?.message ?? fallbackMessage;

  return { statusCode, message };
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    "message" in error &&
    typeof (error as ApiError).statusCode === "number" &&
    typeof (error as ApiError).message === "string"
  );
}
