# 資料庫（NuxtHub）

## 概覽

- **框架**：[NuxtHub](https://hub.nuxt.com)（`@nuxthub/core`），本機開發用 SQLite；正式環境（Vercel）用 **Turso**（一樣是 SQLite 方言，schema/程式碼完全共用）
- **ORM**：Drizzle ORM，schema 定義在 [`server/db/schema.ts`](../../server/db/schema.ts)
- **本機資料庫檔案**：`.data/db/sqlite.db`（已加進 `.gitignore`，每個開發者本機各自一份）
- **正式環境**：網站部署在 Vercel，資料庫用 Vercel Marketplace 的 Turso 整合，本機開發完全不需要 Vercel/Turso 帳號

`db` 和 `schema` 這兩個變數在所有 `server/` 底下的檔案都是自動 import 好的，不需要手動 `import`。

> 圖片不是存在這裡——圖片走的是另一個 NuxtHub 功能（blob 儲存），見 [images-and-blob.md](./images-and-blob.md)。這份文件只講文字/結構化資料的部分。

## Schema

### `species`（物種）

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `id` | text, PK | 等同 `slug` |
| `slug` | text, unique | URL 用的物種識別碼 |
| `name` | JSON | `{ zh, en, scientific }` |
| `taxonomy` | JSON | `{ kingdom, phylum, class, order, family, genus, species }` |
| `period` | JSON | `{ era, period, age }` |
| `description` | JSON | `{ zh, en? }` |
| `characteristics` / `habitat` / `distribution` / `representativeImage` | text，可為空 | |
| `specimenCount` | integer | 該物種底下標本數量 |
| `tags` | JSON array | |
| `category` | text | `trilobite` / `echinoid` / `crinoid` / `ammonite` / … |
| `createdAt` / `updatedAt` | timestamp | |

### `fossils`（標本）

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `id` | text, PK | 等同 `slug` |
| `slug` | text, unique | |
| `shortCode` | text | 11 位數短碼，見 [scripts-reference.md](./scripts-reference.md) |
| `speciesId` | text, FK → `species.id` | **真正的外鍵**，用來連回 `species` 表；API 回傳時再組出頁面需要的 `speciesRef` |
| `specimen` | JSON | `{ type, bodyPart?, completeness, condition, catalogNumber?, collectionDate?, location?, measurements? }` |
| `images` | JSON array | `{ url, width, height, type, order }[]` |
| `thumbnail` | text | |
| `description` | JSON，可為空 | `{ zh, en? }` |
| `tags` | JSON array | |
| `category` | text | |
| `likeCount` / `viewCount` | integer | |
| `isPublic` / `featured` | boolean | |
| `createdAt` / `updatedAt` | timestamp | |

### `projects`、`events`、`bookings`

欄位對照 `app/types/portfolio.ts` 的 `IProject` 和 `app/composables/useEvents.ts` 的 `IEvent`/`IBookingInput`。API 見 [api-reference.md](./api-reference.md)。

## 為什麼巢狀物件直接存 JSON，不拆欄位

`taxonomy`、`period`、`specimen`、`images`、`tags` 這些欄位如果拆成一堆子欄位（例如 `taxonomy_kingdom`、`taxonomy_phylum`……），API 層要重新組裝成前端要的巢狀物件，多一層轉換成本。目前完全沒有「針對這些欄位做 SQL 條件查詢」的需求（例如沒有「找出所有三葉蟲綱的物種」這種查詢），所以直接用 Drizzle 的 `text({ mode: "json" })` 存整個物件，讀出來就是可以直接用的 JS 物件，寫入時傳一般物件就好，不需要手動 `JSON.stringify`/`parse`。

如果之後真的需要對某個巢狀欄位做條件查詢或排序，才需要把那個欄位拆出來變成獨立 column。

## 修改 schema

1. 編輯 `server/db/schema.ts`
2. 產生 migration：
   ```bash
   npx nuxt db generate
   ```
3. 套用到本機資料庫：
   ```bash
   npx nuxt db migrate
   ```
   （`npm run dev` 啟動時也會自動套用未執行的 migration，通常不需要手動跑這一步）

## 重新灌入 mock 資料（seed）

`server/api/_dev/seed.post.ts` 會清空 `fossils`、`species`、`bookings`、`events`、`projects` 五張表，重新從 `data/mock/*.json` 灌入。這是開發用端點：handler 開頭會呼叫 `assertDevOnly()`（依 Nuxt/Nitro 的 `import.meta.dev` 判斷），**只有 `npm run dev` 時可用**；正式環境（含 production build / preview）會直接回 **404**，不會執行清空或灌入。

```bash
npm run dev
curl -X POST http://localhost:3000/api/_dev/seed
```

回傳筆數確認：

```json
{ "species": 30, "fossils": 31, "projects": 15, "events": 1 }
```

## 查看或修改資料

### 方法一：`npx nuxt db sql`（最快，適合單筆精準修正）

```bash
# 查看
npx nuxt db sql "SELECT * FROM species WHERE slug='crotalocephalus-gibba'"

# 修改一般文字欄位
npx nuxt db sql "UPDATE fossils SET \"catalogNumber\" = 'XXX' WHERE slug='xxx'"

# 修改 JSON 欄位裡的某個 key，要用 SQLite 的 json_set()
npx nuxt db sql "UPDATE species SET taxonomy = json_set(taxonomy, '\$.order', '三葉蟲目') WHERE slug='crotalocephalus-gibba'"
```

### 方法二：桌面版 SQLite 檢視工具（最直覺，不用背指令）

本機資料庫就是檔案 `.data/db/sqlite.db`。用 **[DB Browser for SQLite](https://sqlitebrowser.org)**（免費、開源、有 Mac 原生版）直接開這個檔案，介面像 Excel，點格子改資料存檔即可生效。

### 方法三：Drizzle Studio（視覺化，但尚未驗證能在本機正常連線）

專案根目錄已經放了 `drizzle-studio.config.ts`：

```bash
npx drizzle-kit studio --config=drizzle-studio.config.ts
```

會嘗試開啟 `https://local.drizzle.studio`。**注意**：這個工具在自動化測試環境下卡在讀取中沒有連上（本機 4983 port 回應 404，疑似 drizzle-kit 版本跟 hosted studio 前端不相容）。如果在你自己的瀏覽器一樣連不上，直接改用方法一或方法二，不用花時間排查。

### 大量修正時，改本機 JSON 檔案更快

化石圖鑑目前很多欄位（分類、地質年代）、作品集（公司、角色、描述）、活動資訊都還是產生腳本填入的「待補」/空白佔位文字，需要你之後大量校正。這種情況下，**改 `data/mock/*.json` 文字檔案，然後重新 POST 一次 `/api/_dev/seed` 覆蓋回資料庫**，通常比逐筆進資料庫改更快。等資料穩定進入「偶爾修正單筆」階段，再用方法一或方法二。

## 常用指令一覽

| 指令 | 用途 |
| --- | --- |
| `npx nuxt db generate` | 依 schema 變更產生新的 migration 檔 |
| `npx nuxt db migrate` | 套用尚未執行的 migration |
| `npx nuxt db sql "<SQL>"` | 執行任意 SQL |
| `npx nuxt db drop <TABLE>` | 刪除單一表 |
| `npx nuxt db drop-all` | 刪除所有表（小心使用） |

## 部署到正式環境時要做的事（本機開發不需要）

網站實際部署在 **Vercel**（不是 Cloudflare），NuxtHub 也支援這個組合，但正式環境的資料庫要換成 **Turso**（不是 D1）。Turso 底層一樣是 SQLite，跟現在的 `server/db/schema.ts`、migration 完全相容，**不需要改任何程式碼**，只有部署設定不一樣：

1. Vercel Dashboard → Storage → 安裝 **Turso** marketplace 整合，會拿到 `TURSO_DATABASE_URL`、`TURSO_AUTH_TOKEN` 兩個環境變數
2. 確認 `nuxt.config.ts` 的 `hub.db` 在有 Turso 環境變數時會切到 libsql：
   ```ts
   const hasTursoEnv = Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);

   hub: {
     db: hasTursoEnv ? { dialect: "sqlite", driver: "libsql" } : "sqlite",
   },
   ```
   本機沒有 `TURSO_*` 時仍使用 `.data/db/sqlite.db`，避免本機 build 因缺正式環境變數失敗。
3. 正式環境跑一次 migration（Vercel build 會在有 `TURSO_*` 時自動套用 migration），並決定怎麼把資料灌進去（比照本機的 seed 端點模式，或用 `hub.remote: true` 讓本機直接寫正式資料庫）

⚠️ 不要選 **Vercel Postgres**——那是真正的 Postgres，`schema.ts` 要整個改寫成 `pg-core` 語法，等於重做一次，沒有必要。

圖片（blob 儲存）部署設定見 [images-and-blob.md](./images-and-blob.md#部署到正式環境時要做的事本機開發不需要)。
