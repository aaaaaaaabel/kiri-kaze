import type { ApiMethod, ApiQuery } from "~/types/api";
import { normalizeApiError } from "~/api/normalize";

interface ApiFetchOptions {
  method?: ApiMethod;
  query?: ApiQuery;
  body?: unknown;
}

// $fetch 的型別會用路徑字面量比對所有已知路由來推導回傳型別，
// 動態組出來的字串路徑會讓那個比對爆開（TS2321 Excessive stack depth）。
// 在這裡把 $fetch cast 成單純的泛型簽名，繞過那套路由型別推導。
const rawFetch = $fetch as <T>(path: string, options?: ApiFetchOptions) => Promise<T>;

/**
 * 包一層 $fetch：composable 只管組 path/query/body，
 * 錯誤一律正規化成 ApiError 再往外丟，訊息取自 server 的 statusMessage。
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
  fallbackMessage?: string,
): Promise<T> {
  try {
    return await rawFetch<T>(path, options);
  } catch (err) {
    throw normalizeApiError(err, fallbackMessage);
  }
}
