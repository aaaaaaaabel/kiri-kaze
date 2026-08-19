# 後台規劃

這份文件專門規劃 Lacunae 的後台（editor 上傳/編輯、admin 審核）。原本這些內容是 [refactor-roadmap.md](./refactor-roadmap.md) 的 Phase 4，因為決定的東西夠多、夠獨立，拆成專門的文件方便之後持續補充，不會把主線重構路徑圖越塞越長。

在定義好 auth 契約之前，不要開始動後台 UI。等 session、角色、上傳規則都穩定之後，UI 會好做很多。

## 已確認的決定（2026-08-18）

以下不再是待決定的產品問題，之後規劃工作時直接當成固定條件：

- **登入方式**：自建帳密（email + password），不用 OAuth。`AuthModal.vue` 裡的 Google 登入 UI 維持停用狀態，不會為了後台重新啟用。
- **Session**：資料庫存 session（`sessions` 表），不是 JWT 塞進 cookie。
- **角色**：`admin`、`editor` 兩種，兩者都能登入同一個後台。`editor` 能新增/編輯內容；`admin` 是另一組更小、更嚴格的名單，不是每個能登入的人都是 admin。
- **審核／上架流程**：`editor` 送出的內容不會立刻上前台，要 `admin` 審核通過後才會出現在正式站。這個流程**只套用在 `fossils` 跟 `species`**；`projects`、`events` 目前不需要審核——一樣會有真正的 CRUD API 跟後台頁面，只是沒有審核關卡，除非之後又有新決定。

## Tasks

1. 新增 `users` 表：`id`、`email`（unique）、`passwordHash`、`role: "admin" | "editor"`、`createdAt`
2. 新增 `sessions` 表：session id（cookie 值）、`userId`、`expiresAt`。`app/stores/session.ts` 透過一個 server endpoint 讀取這個表，任何回給前端的回應都不能帶 `passwordHash`
3. 新增 `app/middleware/auth.ts`（任何已登入使用者都能過）跟 `app/middleware/admin.ts`（角色必須是 `admin`）
4. 新增 `app/layouts/admin.vue`
5. 定義路由 meta 欄位：標題、auth、後台選單是否顯示、返回路徑
6. 幫 `fossils`、`species` 加上審核流程用的 `status` 欄位（值的定義見下方待決問題），再加 `submittedBy`／`reviewedBy`／`reviewedAt`（視情況外鍵指到 `users.id`）
7. 面向公眾的 `fossils`／`species` GET endpoint 要過濾成只回傳已上架的狀態——動手寫這個過濾條件之前，先決定它跟 `fossils` 現有的 `isPublic` 布林欄位要怎麼並存（見下方待決問題）
8. 圖片上傳 API 要先定義好，才能動手做上傳 UI

## 待決問題：status 欄位怎麼設計

動手寫 `fossils`/`species` 的 migration 之前要先決定這個。

「editor 改了一筆已經上架的資料，admin 還沒審過」這個情境，有兩種建模方式：

- **A. 上架中的那筆資料本身只有一個 status 欄位。** 編輯已上架的資料會立刻把它打回 `pending_review`、從公開頁面下架，直到 admin 重新審核通過。Schema 最簡單、不用多一張表，但代價是連改一個錯字，這筆資料在審完之前都會直接消失在前台。
- **B. Draft／live 分開存**（用一張 `fossil_drafts` 的影子表，或是一個存待審內容的 `draftData` JSON 欄位）。公開頁面在審核期間繼續顯示最後一次審核通過的版本，draft 放旁邊等審；admin 核准後才把 draft 內容覆蓋進 live。Schema 跟 API 工作量都比較大，但 editor 修小錯字不會把已上架的內容拉下前台。

動手寫 `fossils`/`species` 的 migration 之前要先選一個——這會影響 migration 本身的形狀，不只是 API 層的事。同時也要決定 `fossils` 現有的 `isPublic` 布林欄位是被新的 `status` 欄位取代，還是繼續當成獨立的「就算審核通過也可以手動隱藏」開關保留下來。

## Acceptance checks

- 密碼雜湊要用真正的 KDF（例如 `bcrypt`/`argon2`），不能是明碼，也不能用一般用途的快速雜湊函式
- 後台路由要同時有 server 端和 client 端的守衛；只有 `editor` 角色的使用者就算直接呼叫 API，也進不去 `admin` 限定的路由或端點
- Session 狀態在 SSR 和 client 端換頁時都要正常運作
- `editor` 新增或編輯的 `fossils`／`species` 資料，在 `admin` 審核通過之前不會出現在正式站
- 上傳 API 要在同一個流程裡同時寫入 blob 物件跟資料庫路徑欄位
- 後台的導覽跟權限，唯一的依據是 route meta

## 跟現有系統的關係

- 後台上線後，`scripts/seed-production-data.ts` 跟 `data/mock/*.json` 這一整套「改 JSON → 重新 seed」流程會被後台 CRUD 取代掉，不用再花力氣把它做成完善的工具。
- 現有的 `useAuth.ts`／`stores/auth.ts` 是給前台使用者（收藏、報名）用的 stub，跟這裡的後台 `admin`/`editor` 帳號系統是兩件事，不要混在一起改。
- 這份規劃只涵蓋後台基礎建設本身；實際的後台頁面（列表、表單、圖片上傳 UI）等基礎建設完成後，照 [refactor-roadmap.md](./refactor-roadmap.md) Phase 5 的「後台共用元件候選」原則來做，不要一開始就過度抽象化。
