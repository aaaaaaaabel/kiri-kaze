# 維護基線與後續整理方向

Lacunae 目前已經進入可維護狀態。內容資料、圖片、API 錯誤處理、lint/typecheck 都有清楚路徑；剩下的問題主要是歷史遷移痕跡與團隊化約定還沒有完全收斂。完整分階段計畫見 [refactor-roadmap.md](./refactor-roadmap.md)。

## 目前維護狀態

| 面向 | 狀態 | 說明 |
| --- | --- | --- |
| 內容資料 | 可維護 | `species`、`fossils`、`projects`、`events`、`bookings` 已走 server API 與 SQLite/Turso 相容 schema。 |
| 圖片 | 可維護 | 資料驅動圖片走 `/cdn/...` 與 blob 儲存；少量靜態視覺素材保留在 `public/images/`。 |
| API | 可維護但可再標準化 | `app/api/client.ts` 統一 `$fetch` 錯誤格式；目前仍是簡單 Promise API，不是 `nuxt-standard` 的 `useFetch` module pattern。 |
| Auth / Favorites | 暫停登入 | 登入停用（`useAuth` stub）；收藏走 localStorage。Firebase runtime 已移除；之後用第一方 session（Phase 4）。 |
| 文件 | 已收斂 | 正式文件保留架構、資料、API、圖片、腳本與品牌字體；一次性交接紀錄已移除。 |

## 從 `nuxt-standard` 可借用的做法

`/Users/abel/nuxt-standard` 是公司模板，不能直接套到 Lacunae，但有幾個值得採用的方向。

### API modules

`nuxt-standard` 把 API 拆成 `app/api/client.ts`、`app/api/modules/*` 與 `app/composables/useApi.ts` 聚合入口。Lacunae 現在的 `apiFetch()` 已經解決錯誤正規化問題，下一步可以把 `useFossils()`、`useProjects()` 內的 endpoint 呼叫拆到 `app/api/modules/`，讓 composable 專注於狀態與頁面工作流。

建議順序：

1. 建立 `app/api/modules/fossils.ts`、`species.ts`、`projects.ts`、`events.ts`。
2. 保留現有 `useFossils()` 等 composable 的對外方法名稱，避免一次改動頁面。
3. 讓 composable 呼叫 API module，而不是直接組 URL。

### Session store

`nuxt-standard` 使用 `useCookie()` 保存 session token，比 localStorage 更適合 SSR 與登入狀態同步。Lacunae 之後要恢復登入時，應優先設計自己的 `users` / `favorites` 資料表與 session store，不建議再接回 Firebase Auth 作為長期方案。

### Route and middleware conventions

`nuxt-standard` 用 middleware 與 route constants 管理登入頁、訪客頁與錯誤頁。Lacunae 目前頁面數量少，還不需要完整 route constants，但後台管理介面開始後，應加入：

- `app/middleware/auth.ts`
- `app/layouts/admin.vue`
- 管理後台專用 route naming 或 constants

### Documentation shape

`nuxt-standard` 的文件分工清楚：README 負責導覽，主題文件只回答單一問題。Lacunae 應維持這個方向，不再把一次性 session 記錄、過時掃描摘要或個人操作紀錄放進 `app/docs/`。

## 建議優先處理

1. **補強 booking server validation。** `POST /api/bookings` 應在 server 端檢查重複報名、活動是否發布、容量是否已滿。
2. **把 API 呼叫拆成 modules。** 先保留現有 composable 介面，降低改動風險。
3. **建立後台前先定義 auth contract。** 先決定 session、users 表、roles、圖片上傳流程，再做 UI。

## 文件維護規則

- README 只做入口導覽，不放歷史交接細節。
- 架構決策放在 `maintenance.md`、`refactor-roadmap.md`、`database.md`、`images-and-blob.md`。
- 操作流程放在 `scripts-reference.md`。
- API contract 放在 `api-reference.md`。
- 短期待辦放 issue、PR 描述或 commit message，不放長期 docs。
