/**
 * 處理錯誤請求 GET /_nuxt/（無檔名），避免 404 未處理錯誤
 * 正常資源為 /_nuxt/xxx.js，僅根路徑時回 204
 */
export default defineEventHandler((event) => {
  setResponseStatus(event, 204);
  return null;
});
