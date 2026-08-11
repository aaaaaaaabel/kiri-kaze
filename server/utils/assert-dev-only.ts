/**
 * 擋下正式環境對開發用 API（如 /api/_dev/*）的呼叫。
 * 使用 Nuxt/Nitro 的 import.meta.dev（僅 nuxt dev 為 true），不依賴 client runtimeConfig。
 */
export function assertDevOnly(): void {
  if (!import.meta.dev) {
    throw createError({ statusCode: 404, statusMessage: "Not Found" });
  }
}
