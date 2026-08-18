/**
 * 遠端圖片服務路由：/cdn/{blob key} → NuxtHub blob 儲存（本機模擬、正式環境是 Vercel Blob）
 * blob key 跟搬遷前的本機路徑一致，例如 /cdn/images/fossils/xxx/thumbnail.jpg
 * 對應 blob.put() 時存的 key：images/fossils/xxx/thumbnail.jpg
 */
import { head } from "@vercel/blob";

export default defineEventHandler(async (event) => {
  const pathname = getRouterParam(event, "pathname");
  if (!pathname) throw createError({ statusCode: 400, statusMessage: "缺少路徑" });

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    const meta = await head(pathname, { token }).catch(() => null);
    if (!meta) throw createError({ statusCode: 404, statusMessage: "Not Found" });
    return sendRedirect(event, meta.url, 302);
  }

  return blob.serve(event, pathname);
});
