# 圖片儲存與 `/cdn/` 路由

## 為什麼要從 `public/images/` 搬走

化石標本圖片之後會持續新增到上百個物種的規模，作品集也會透過後台上傳新圖。放在 `public/images/`（git 版本控制的靜態檔案）在這個規模下有兩個問題：

1. Repo 會塞滿大量二進位圖檔，clone/部署變慢
2. 後台不可能叫操作的人去下終端機指令、git commit——上傳圖片必須是「打 API、直接進儲存空間」的流程

所以把資料驅動圖片搬進 blob 儲存。本機開發時由 NuxtHub 以檔案系統模擬，正式環境使用 Vercel Blob。資料庫只存一個路徑字串，跟資料庫遷移的思路一致。

## 心智模型：路徑字串怎麼寫，圖就從哪裡來

`species`/`fossils`/`projects`/`events` 這幾張表的圖片欄位（`thumbnail`、`cover`、`images[].url`、`representativeImage`、`image`）存的都是**路徑字串**，前端拿到什麼就 `<img :src>` 什麼，不管背後是本機靜態檔案還是遠端 blob。這代表**遷移是逐筆漸進式的，不需要任何全站開關**——同一張資料表裡，有些欄位可能還是 `/images/...`（本機靜態），有些已經是 `/cdn/...`（blob 儲存），完全不衝突。

目前化石圖鑑跟作品集的圖片已經整批搬完，全部走 `/cdn/...`。首頁背景輪播（`public/images/hero_bn/`）、about 頁面的圖（`public/images/about/`）**沒有搬**——這些是寫死在 `.vue` 元件裡的靜態資源，不是資料庫欄位，跟這次遷移的「資料驅動圖片」是不同的東西，數量少、不常變動，留在本機更單純。

## 路徑對照

| 舊路徑（本機靜態） | 新路徑（blob） |
| --- | --- |
| `/images/fossils/{species-slug}/{location-id}/{number}/thumbnail.jpg` | `/cdn/images/fossils/{species-slug}/{location-id}/{number}/thumbnail.jpg` |
| `/images/case/{project}/{file}.jpg` | `/cdn/images/case/{project}/{file}.jpg` |

blob 儲存時用的 key 就是拿掉開頭 `/` 的舊路徑（例如 `images/fossils/.../thumbnail.jpg`），所以新舊路徑只差一個 `/cdn` 前綴，方便對照除錯。

## 怎麼運作的

### 設定

```ts
// nuxt.config.ts
hub: {
  db: "sqlite",
  blob: true,
},
```

### 服務圖片：`server/routes/cdn/[...pathname].get.ts`

```ts
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
```

任何打到 `/cdn/{key}` 的請求都會去 blob 儲存找對應 key。本機沒有 `BLOB_READ_WRITE_TOKEN` 時走 NuxtHub `blob.serve()`；Vercel 正式環境有 token 時，用 `@vercel/blob` 查到公開 URL 後回 302，交給 Vercel Blob 自己處理 `Content-Type` 與快取標頭。

### 搬遷歷史資料：`POST /api/_dev/migrate-images`

見 [api-reference.md](./api-reference.md#dev-migrate-images)。這是一次性工具，掃描 `public/images/fossils/`、`public/images/case/`，把檔案上傳進 blob，同步更新資料庫裡對應的路徑欄位。可以重複執行（已經是新路徑的欄位不會重複處理）。

## 之後後台上傳圖片，會怎麼接

後台的上傳功能**不會**再經過「本機資料夾 + 搬遷腳本」這個流程，而是直接：

1. 上傳的檔案直接 `blob.put(key, buffer, { access: "public" })` 存進 blob
2. 同一次請求裡，把回傳的 key 組成 `/cdn/{key}` 寫進對應的資料庫欄位

`server/api/_dev/migrate-images.post.ts` 到時候就功成身退，變成跟 `generate-mock-data.ts` 一樣的歷史工具，留著但不會再被日常流程呼叫。NuxtHub 也提供現成的 `blob.handleUpload()` 表單上傳處理器和 `useUpload()` Vue composable，後台頁面可以直接用，不用自己刻上傳邏輯。

## 部署到正式環境時要做的事（本機開發不需要）

網站部署在 **Vercel** 時，正式環境的 blob 儲存使用 **Vercel Blob**。設定方式：

1. Vercel Dashboard → Storage → 建立 **Blob** store，會拿到 `BLOB_READ_WRITE_TOKEN` 環境變數
2. `nuxt.config.ts` 的 `hub.blob` **完全不用改**——`blob: true` 這行本來就是通用寫法，NuxtHub 會自動偵測到 `BLOB_READ_WRITE_TOKEN` 存在就切換成 Vercel Blob。`/cdn/` route 在 Vercel 上會 redirect 到 Blob 公開 URL，本機則維持 NuxtHub 檔案系統模擬。

跟 [database.md](./database.md#部署到正式環境時要做的事本機開發不需要) 的 Turso 設定一樣，底層供應商透過環境變數切換，程式碼不用動。
