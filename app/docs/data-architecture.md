# 理解資料架構：D1、localStorage、Firebase 三條路

## 為什麼會有三種資料來源

Firebase（Firestore + Storage + Auth）在 2026 年因為政策改變整個連不上，圖片跟文字資料一度全部失聯。當時先用本機 `data/mock/*.json` 頂著讓網站能動，後來決定接上自己能掌控的資料庫（NuxtHub / D1）。內容資料（物種、標本、作品集、活動、活動報名）已經全部遷移到 D1；登入跟收藏這兩個功能因為現有的 localStorage 方案已經夠用，暫時沒有遷移的急迫性。原本寫好的 Firebase 串接程式碼沒有被刪除，只是不再被呼叫——保留是為了未來萬一需要參考舊邏輯，或哪天想接回真正的 Firestore。

## 心智模型：一個 composable，資料來源可能不一樣

`app/composables/` 底下每個資料 composable 對外的函式簽名永遠不變，頁面/元件呼叫方式也永遠不變。差別在 composable 內部去哪裡拿資料：

```text
useFossils() / useSpecies() / useProjects() / useEvents()
  → 一律呼叫 server/api/ 底下的 REST API
  → API 查 D1（本機開發時是 .data/db/sqlite.db）

useAuth() / useFavorites()
  → 判斷 runtimeConfig.public.isMockDataEnabled
    → true：登入功能停用（顯示錯誤訊息）、收藏一律走 localStorage
    → false：走下面沒被刪除、但目前打不通的 Firebase Auth / Firestore 實作
```

**所有內容類 composable 都已經沒有 mock 分支**——`useFossils`/`useSpecies`/`useProjects`/`useEvents` 現在都直接打 D1。原本的 `useMockFossils`/`useMockSpecies`/`useMockProjects`/`useMockEvents` 四個檔案已確認沒有任何呼叫者並刪除（見下方「可以刪除的東西」）。

## `isMockDataEnabled` 開關在哪裡

`nuxt.config.ts` 的 `runtimeConfig.public.isMockDataEnabled`，可以用環境變數 `NUXT_PUBLIC_IS_MOCK_DATA_ENABLED` 覆蓋（設定在 `.env`，目前是 `true`）。這個開關現在只影響 `useAuth`/`useFavorites` 兩個 composable。

```ts
// nuxt.config.ts
runtimeConfig: {
  public: {
    isMockDataEnabled: true, // Firebase 恢復後設為 false 即可切回正式資料源
  },
},
```

## 資料來源分工表

| 內容 | Composable | 資料來源 | 狀態 |
| --- | --- | --- | --- |
| 物種（species） | `useSpecies` | D1（`server/api/species/*`） | ✅ 已遷移 |
| 標本（fossils） | `useFossils` | D1（`server/api/fossils/*`） | ✅ 已遷移 |
| 作品集（projects） | `useProjects` | D1（`server/api/projects/*`） | ✅ 已遷移 |
| 活動（events） | `useEvents` | D1（`server/api/events/*`） | ✅ 已遷移 |
| 活動報名（bookings） | `useEvents` 內的 `createBooking`/`checkBookingByUser`/`checkBookingExists` | D1（`server/api/bookings/*`） | ✅ 已遷移 |
| 登入 | `useAuth` | mock 模式下停用 | 不急著遷移 |
| 收藏 | `useFavorites` | `localStorage` | 目前這樣就夠用，不急著遷移 |

## 圖片放在哪裡

化石圖鑑跟作品集的圖片已經搬進 **NuxtHub blob 儲存**（R2），路徑是 `/cdn/...` 開頭；首頁背景輪播、about 頁面的圖還是 `public/images/` 底下的靜態檔案，`/images/...` 開頭。不管是哪一種，資料庫欄位存的都只是路徑字串，composable/元件不需要知道背後差異，直接 `<img :src>` 就能用。詳細見 [images-and-blob.md](./images-and-blob.md)。

歷史脈絡：`app/utils/storage.ts` 的 `getStorageUrl()` 原本是把相對路徑轉成 Firebase Storage 網址用的，現在因為圖片路徑都已經是 `/cdn/...` 或 `/images/...` 開頭，會直接命中它「已經是本機/自架路徑，原樣回傳」的分支，所以完全不需要改這個檔案。

## 什麼時候該碰 Firebase 那些程式碼

理論上不需要。除非你決定要真的接回 Firebase（例如新資料庫計畫作廢），否則 `useAuth.ts`/`useFavorites.ts` 裡 `if (isMockDataEnabled)` 判斷之後的程式碼可以當作「看不到」——它們不會被執行，也不會影響你現在的開發。

## 可以刪除的東西

- ~~`app/composables/useMockFossils.ts`、`useMockSpecies.ts`、`useMockProjects.ts`、`useMockEvents.ts`~~ **已刪除（2026-08-11）**
- `data/mock/species.json`、`fossils.json`、`projects.json`、`events.json`（改成只留在 D1 裡，不再需要 JSON 副本）——**但如果你還在依賴「改 JSON 檔案 + 重新 seed」這個大量修正資料的工作流程（見 [database.md](./database.md)），先不要刪**，這幾個檔案同時也是 seed 端點的資料來源

## 之後要遷移登入/收藏時，該怎麼做

登入跟收藏不像內容資料那麼直接——它們牽涉「使用者身分」這個額外概念，D1 已經有 `bookings` 表存 `uid`，但目前沒有真正的 `users` 表。如果之後要做，大方向會是：

1. 加一個 `users` 表（`uid`、`email`、`favorites` 或獨立的 `favorites` 表）
2. 決定登入機制——`better-auth` 是常見選擇，能直接跟你自己的 D1 綁在一起，不寄生在任何一家的 Auth 服務上
3. `useAuth.ts`/`useFavorites.ts` 的 `if (isMockDataEnabled)` 分支比照 `useFossils`/`useProjects` 的模式替換掉

目前沒有急迫性，`localStorage` 收藏 + 停用登入對這個規模的網站已經夠用。
