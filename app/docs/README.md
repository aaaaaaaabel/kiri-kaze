# Lacunae 專案技術文件

這份文件說明 Lacunae（原 Kiri Kaze）網站目前的資料架構、API、composables、品牌字體設定，以及維護時常用的腳本。專案本身是 Nuxt 4 應用，內容涵蓋一個化石圖鑑（species/fossils）和一個作品集（portfolio），外加活動報名（events）功能。

## 現況一句話說明

化石圖鑑（物種＋標本）、作品集、活動報名都已經接上你自己的資料庫（NuxtHub / D1），圖片也已經搬進 NuxtHub blob 儲存（R2）。登入（Auth）跟收藏還在用 localStorage / 停用狀態頂著——這兩個目前這樣就夠用，不急著遷移。原本的 Firebase 串接程式碼還留在 repo 裡但目前完全沒被呼叫（Firebase 專案已經連不上）。之後會做後台管理介面（同一個專案，不另外開），屆時新增物種/作品集、上傳圖片都會透過後台直接寫進資料庫/blob。

## 文件目錄

| 文件 | 內容 | 什麼時候看 |
| --- | --- | --- |
| [data-architecture.md](./data-architecture.md) | 資料來源（D1／localStorage／Firebase）怎麼分工、`isMockDataEnabled` 開關邏輯 | 想搞懂「這個頁面的資料到底從哪來」 |
| [database.md](./database.md) | D1 資料庫的 schema、migration、seed、怎麼查看/修改資料 | 要改資料、加欄位、清庫重灌 |
| [images-and-blob.md](./images-and-blob.md) | 圖片為什麼搬進 blob 儲存、`/cdn/` 服務路由、之後後台上傳要怎麼接 | 要處理圖片相關的事、規劃後台上傳功能 |
| [api-reference.md](./api-reference.md) | `server/api/` 底下每個 REST endpoint 的參數與回傳格式 | 要串新頁面、或除錯某個 API 回傳不對 |
| [composables-reference.md](./composables-reference.md) | `app/composables/` 底下每個 composable 的用途、資料來源、對外方法 | 要在頁面/元件裡呼叫資料，不確定該用哪個 composable |
| [branding-and-fonts.md](./branding-and-fonts.md) | Lacunae 品牌字（Bodoni Moda）怎麼設定的、之後買到正版字體要怎麼換 | 要調整字標樣式，或買到 Bodoni Poster Std 授權後要接上 |
| [scripts-reference.md](./scripts-reference.md) | `scripts/`、`data/` 底下每個維護腳本的用途與指令 | 要新增化石標本、重新產生 mock 資料、同步舊版 Firebase 工具 |

## 快速上手

```bash
npm install
npm run dev
```

打開 `http://localhost:3000`。本機開發不需要任何雲端帳號——資料庫是本機模擬的 SQLite 檔案（`.data/db/sqlite.db`），Firebase 也已經停用（見 [data-architecture.md](./data-architecture.md)）。

## Lint / Typecheck

```bash
npm run lint        # nuxt prepare + ESLint + Stylelint
npm run lint:script  # 只跑 ESLint
npm run lint:style   # 只跑 Stylelint
npm run typecheck    # nuxi typecheck
```

規則設定在根目錄的 `eslint.config.mjs`、`.stylelintrc.json`。`scripts/pull.ts`、`scripts/sync.ts`（已停用的 Firebase 同步工具）整份排除在 ESLint 之外，理由寫在 `eslint.config.mjs` 最後一段 `ignores` 的註解裡。

## 專案結構重點

```text
app/
├── api/             # 前端呼叫 server API 的共用層：apiFetch + 錯誤正規化（見 composables-reference.md「API 呼叫層」）
├── composables/     # 資料存取邏輯（見 composables-reference.md）
├── components/      # Vue 元件
├── pages/           # 檔案路由
├── types/           # TypeScript 型別定義
└── assets/fonts/    # 品牌字體載入（見 branding-and-fonts.md）

server/
├── db/schema.ts     # D1 資料表定義（見 database.md）
├── db/migrations/   # 已套用的 migration SQL
├── api/             # REST API routes（見 api-reference.md）
├── routes/cdn/      # 圖片服務路由（見 images-and-blob.md）
└── utils/           # server 端共用工具（如 fossil-mapper.ts）

data/
├── input.json       # 化石標本原始輸入資料（見 scripts-reference.md）
└── mock/            # 目前作品集/活動還在用的 mock JSON

scripts/             # 各種資料維護腳本（見 scripts-reference.md）
```

## 相關但沒有寫進這份文件的東西

- `data/README.md`、`data/STRUCTURE.md`：舊版「用 `input.json` 同步到 Firebase」流程的完整說明，命名規則（slug/shortCode 產生方式）仍然準確，只是「同步到 Firebase」這件事目前用不到。
- `scripts/README.md`：`sync.ts`/`prepare-folders.ts`/`pull.ts` 這些 Firebase 專用腳本的詳細用法，目前仍保留但不會被日常流程呼叫。
