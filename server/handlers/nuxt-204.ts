/** 回傳 204 給 GET /_nuxt/ 或 GET /_nuxt，避免 404 未處理 */
export default defineEventHandler((event) => {
  setResponseStatus(event, 204);
  return null;
});
