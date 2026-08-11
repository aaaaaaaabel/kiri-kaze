# Session Handoff（2026-08-11）

這份文件記錄目前的狀態跟還沒做完的事，是寫給「接手這個專案的下一個 Claude Code session」看的，不是給人類讀者的架構文件（架構請看 [README.md](./README.md) 的文件目錄）。做完之後這份文件可以刪掉或改寫成正式紀錄。

## 已經做完並 commit 的事

- Firebase → NuxtHub/D1 資料庫遷移（化石/物種/作品集/活動/活動報名），見 commit `5b59f3b`
- `apiFetch`/`ApiError` 統一錯誤處理層（`app/api/`），4 個資料 composable 已改用
- ESLint（`eslint.config.mjs`）+ Stylelint（`.stylelintrc.json`）導入，兩個都是零錯誤零警告，`npm run build` 通過
- Kiri Kaze → Lacunae 品牌命名收尾（`.kiri` class 改名 `.tracking`、選單文字等）
- GitHub repo、Vercel 專案都已改名成 `lacunae-studio`，本機 git remote 已同步更新
- 上面這些都在 commit `479f722`
- 刪除確認沒有呼叫者的 mock composable（`useMockFossils.ts`/`useMockSpecies.ts`/`useMockProjects.ts`/`useMockEvents.ts`），對應文件已更新——**這個刪除動作還沒 commit**

## 還沒做完，需要接手的事

### 1. 本機資料夾改名（需要在 Claude Code session 之外做）

資料夾目前還叫 `kiri-kaze`，使用者想改成 `lacunae-studio`。實測發現：**在 Claude Code session 進行中改資料夾名稱會讓 harness 的 sandbox 失去同步**（harness 會在舊路徑自動生出一個空資料夾，這個 session 之後的指令會操作在那個空殼裡）。已經把改名復原回 `kiri-kaze`，避免資料流失。

正確做法：使用者自己在 session 外執行
```bash
mv /Users/abel/project/kiri-kaze /Users/abel/project/lacunae-studio
```
然後在新路徑重新開一個 session。GitHub/Vercel remote 都已經指向 `lacunae-studio`，本機資料夾改名不會影響它們（兩者是獨立的）。

### 2. Commit 上次的自動安全掃描發現 9 個問題，還沒逐一確認

Commit `479f722` 之後跑的背景安全掃描回報 9 個問題，摘要只列出前 3 個 + 「+6 more」，完整清單沒有留存，**下一個 session 需要重新跑一次安全掃描或找到完整報告**。已經手動確認的部分：

- **`server/api/_dev/seed.post.ts` 缺身分驗證**：這是已知、文件裡記錄過的風險（見 [database.md](./database.md#重新灌入-mock-資料seed)），`_dev/*` 端點本來就設計成「本機開發用、正式環境不該對外」，不是這次遷移新增的問題，但目前**沒有任何機制阻止正式環境誤外露這個路徑**，如果部署設定沒有特別排除 `/api/_dev/*`，這是真的風險。
- **`fossils`/`projects` 單筆查詢端點的 broken-access-control**：已確認是真的問題（不是掃描誤報），**已修好，還沒 commit**。受影響的 5 個 route（`fossils/[id].get.ts`、`fossils/slug/[slug].get.ts`、`fossils/code/[code].get.ts`、`projects/[id].get.ts`、`projects/slug/[slug].get.ts`）查出資料後都補上 `if (!row || !row.isPublic) throw 404`，效果等同列表端點的 `publicOnly` 篩選。`npm run typecheck`、`npm run lint:script` 都過。
  - `species/[slug].get.ts`、`species/code/[code].get.ts` **不需要修**：確認 `server/db/schema.ts` 的 `species` 資料表根本沒有 `isPublic` 欄位（只有 `fossils`/`projects` 有），也沒有 `species/index.get.ts` 這種列表端點會做 `publicOnly` 篩選——物種本身是分類參考資料，設計上就是全部公開，「私有」的概念只存在於個別標本（fossil）跟作品集專案上。`species/code/[code].get.ts` 會先查一筆 `fossil`（不論其 `isPublic`）取得 `speciesId` 再查物種，但回傳的只有物種資料，不含該標本任何欄位，頂多洩漏「這個 shortCode 存在且對應到某物種」，跟其他端點洩漏完整私有物件內容不是同一等級的問題，這次先不動。
- 其餘 6 個問題內容未知，需要重新掃描或詢問使用者是否還留著原始報告。

### 3. 下一個大方向，使用者還沒決定要先做哪個

- 後台管理介面（需要先討論登入門檻、CRUD API、圖片上傳流程怎麼設計）
- 網域購買：`lacunaestudio.com` 還沒買，正式環境目前還是 `kiri-kaze.com`
- 繼續新增化石標本（流程已經很成熟，見 [scripts-reference.md](./scripts-reference.md)）
