# Lacunae 技術文件

Lacunae 是一個 Nuxt 4 應用，包含化石圖鑑、作品集與活動報名功能。這份文件是維護入口，負責說明目前架構與指向更細的主題文件。

## 現況

化石圖鑑、作品集、活動與報名資料已經走 server API 與 SQLite/Turso 相容 schema。資料驅動圖片走 blob 儲存與 `/cdn/...` 路由；少量靜態視覺素材仍留在 `public/images/`。登入目前停用，收藏使用 localStorage。

## 文件目錄

| 文件 | 內容 | 什麼時候看 |
| --- | --- | --- |
| [database.md](./database.md) | 資料庫 schema、migration、seed、怎麼查看/修改資料 | 要改資料、加欄位、清庫重灌 |
| [images-and-blob.md](./images-and-blob.md) | 圖片為什麼搬進 blob 儲存、`/cdn/` 服務路由、之後後台上傳要怎麼接 | 要處理圖片相關的事、規劃後台上傳功能 |
| [api-reference.md](./api-reference.md) | `server/api/` 底下每個 REST endpoint 的參數與回傳格式 | 要串新頁面、或除錯某個 API 回傳不對 |
| [maintenance.md](./maintenance.md) | 維護狀態、從公司 Nuxt 標準模板可借用的做法、下一步整理方向 | 要判斷下一輪重構或後台開發優先順序 |
| [refactor-roadmap.md](./refactor-roadmap.md) | 分階段重構計畫、目標結構、驗收條件與 commit 策略 | 要交給 Cursor/Claude 分段重構 |
| [branding-and-fonts.md](./branding-and-fonts.md) | Lacunae 品牌字（Bodoni Moda）怎麼設定的、之後買到正版字體要怎麼換 | 要調整字標樣式，或買到 Bodoni Poster Std 授權後要接上 |
| [scripts-reference.md](./scripts-reference.md) | `scripts/`、`data/` 底下每個維護腳本的用途與指令 | 要新增化石標本、重新產生 seed 資料、更新圖片 |
| [scss-governance.md](./scss-governance.md) | SCSS 分層、token 唯一來源、`$lc-*`/`var(--lc-*)` 使用時機、legacy 相容層與後續遷移順序 | 要寫/改元件樣式、要繼續遷移舊入口的 `.vue` 檔 |
| [qa-interaction-report.md](./qa-interaction-report.md) | **臨時** QA／體感 bug 清單（Menu、scroll 等） | 修互動問題時對照；**問題修完即可刪** |

## 快速上手

```bash
npm install
npm run dev
```

打開 `http://localhost:3000`。本機開發不需要雲端帳號；資料庫使用本機 SQLite 檔案（`.data/db/sqlite.db`）。

## Lint / Typecheck

```bash
npm run lint        # nuxt prepare + ESLint + Stylelint
npm run lint:script  # 只跑 ESLint
npm run lint:style   # 只跑 Stylelint
npm run typecheck    # nuxi typecheck
```

規則設定在根目錄的 `eslint.config.mjs`、`.stylelintrc.json`。

## 專案結構重點

```text
app/
├── api/             # 前端呼叫 server API 的共用層：apiFetch + 錯誤正規化
├── composables/     # 頁面資料狀態與 UI 邏輯
├── components/      # Vue 元件
├── pages/           # 檔案路由
├── types/           # TypeScript 型別定義
└── assets/fonts/    # 品牌字體載入（見 branding-and-fonts.md）

server/
├── db/schema.ts     # 資料表定義（見 database.md）
├── db/migrations/   # 已套用的 migration SQL
├── api/             # REST API routes（見 api-reference.md）
├── routes/cdn/      # 圖片服務路由（見 images-and-blob.md）
└── utils/           # server 端共用工具（如 fossil-mapper.ts）

data/
├── input.json       # 化石標本原始輸入資料（見 scripts-reference.md）
└── mock/            # 開發 seed 來源

scripts/             # 各種資料維護腳本（見 scripts-reference.md）
```
