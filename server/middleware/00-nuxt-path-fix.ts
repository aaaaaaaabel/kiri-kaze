/**
 * 攔截 GET /_nuxt/ 或 GET /_nuxt（無檔名），回 204 避免 404 未處理
 * 檔名 00- 讓此 middleware 最先執行
 */
export default defineEventHandler((event) => {
  const path = (event.path || getRequestURL(event).pathname || "").replace(/\?.*$/, "");
  if (path === "/_nuxt" || path === "/_nuxt/") {
    setResponseStatus(event, 204);
    return null;
  }
});
