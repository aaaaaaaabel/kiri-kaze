# 腳本參考

`scripts/` 底下分兩類：**目前實際會用到的**（產生 D1/mock 資料、建立圖片資料夾）跟**Firebase 時代留下、目前打不通但保留的**。`data/` 底下也有對應的說明檔案，這裡整合成一份索引。

## 新增/更新標本的完整流程

這是你之後持續新增標本時要走的完整步驟（取代舊版「改 `input.json` 跑 `sync.ts`」的 Firebase 流程）：

```bash
# 1. 編輯 data/input.json，加入新標本資料（學名、產地、狀態、量測等）

# 2. 建立對應的圖片資料夾
npx tsx scripts/prepare-folders.ts

# 3. 把照片放進生成的資料夾，一定要有 thumbnail.jpg

# 4. 重新產生 mock JSON（已存在物種的手動校正內容會保留，見下方說明）
npx tsx scripts/generate-mock-data.ts

# 5. 把最新資料灌進 D1（本機 dev server 要是開著的）
curl -X POST http://localhost:3000/api/_dev/seed

# 6. 把新照片上傳進 blob 儲存、更新資料庫的圖片路徑欄位
curl -X POST http://localhost:3000/api/_dev/migrate-images
```

⚠️ **順序很重要，第 5 步一定要在第 6 步之前**：`seed` 會把 `fossils`/`species` 表清空重灌，圖片欄位會變回 `generate-mock-data.ts` 產生的本機路徑（`/images/...`）；`migrate-images` 才會把這些路徑轉成 blob 的 `/cdn/...`。如果順序顛倒，圖片不會真的壞掉（本機檔案還在），但會變成從本機路徑而不是 blob 提供，等於白跑一次 migrate-images。

物種的中文名稱、分類、地質年代這些**不是**從 `input.json` 來的（`input.json` 沒有這些欄位），是 `generate-mock-data.ts` 產生的「待補」佔位文字，要校正的話**直接改 `data/mock/species.json`**，改完照樣可以安全重跑 `generate-mock-data.ts`（見下方說明），不會被洗掉。

## 目前實際會用到的

### `scripts/generate-mock-data.ts`

讀 `data/input.json`（化石標本原始輸入資料）+ `public/images/fossils/`、`public/images/case/` 底下實際存在的圖檔，產生四份 JSON：

```bash
npx tsx scripts/generate-mock-data.ts
```

輸出：`data/mock/species.json`、`fossils.json`、`projects.json`、`events.json` ——四份都會被 `server/api/_dev/seed.post.ts` 用到（灌進 D1 的 `species`/`fossils`/`projects`/`events` 表）。

**新增標本時可以安全重跑**：物種（species）如果 `slug` 已經存在於現有的 `data/mock/species.json`，會保留原本手動校正過的 `name`/`taxonomy`/`period`/`description` 等欄位，只重算 `specimenCount`；只有全新物種才會產生新的「待補」佔位內容。

**但 `fossils`/`projects`/`events` 三份每次重跑都會整份重新產生**：`fossils` 的欄位以 `data/input.json` 為準（這是設計上的預期行為——標本層級的事實資料就是該從 `input.json` 改，不是直接改 `data/mock/fossils.json`）；`projects`/`events` 目前沒有對應的「輸入來源」檔案，如果你已經手動編輯過 `data/mock/projects.json`/`events.json`（補公司/角色/描述、活動資訊），**不要重跑這個腳本**，否則這些手動內容會被覆蓋成空白佔位。

依賴 `scripts/lib/fossil-naming.ts`（slug/shortCode 產生邏輯，跟 `scripts/sync.ts` 的演算法一致，獨立出來避免動到舊的 Firebase 同步腳本）。

### `scripts/prepare-folders.ts`

依 `data/input.json` 建立對應的圖片資料夾結構（`public/images/fossils/{species-slug}/{location-id}/{number}/`）。純檔案系統操作，**不需要 Firebase**，跟 Firebase 是否連得上無關。

```bash
npx tsx scripts/prepare-folders.ts

# 順便清掉 input.json 裡已經沒有的舊資料夾
npx tsx scripts/prepare-folders.ts --clean
```

### `data/input.json`

化石標本的人工輸入來源，欄位說明見 `data/README.md`、`data/STRUCTURE.md`（slug/shortCode 命名規則、圖片路徑規則目前仍然準確）。改這個檔案後要重跑 `generate-mock-data.ts` 才會反映到 `data/mock/fossils.json`。

### `server/api/_dev/seed.post.ts`

見 [database.md](./database.md#重新灌入-mock-資料seed)。把 `data/mock/*.json` 灌進 D1。

### `server/api/_dev/migrate-images.post.ts`

見 [images-and-blob.md](./images-and-blob.md)。把 `public/images/fossils/`、`public/images/case/` 底下的圖片上傳進 blob 儲存，更新資料庫路徑欄位。

## Firebase 時代留下的腳本（目前不會被日常流程呼叫）

這些腳本都需要專案根目錄有 `serviceAccountKey.json`（Firebase 服務帳號金鑰），而 Firebase 目前連不上，執行會失敗。保留是因為命名規則（slug/shortCode 演算法）的邏輯仍然是正確的參考。

| 腳本 | 原本用途 |
| --- | --- |
| `scripts/sync.ts` | Git 風格同步：把 `data/input.json` 同步到 Firestore + 上傳圖片到 Storage |
| `scripts/pull.ts` | 反向同步：從 Firestore + Storage 拉回本機 `input.json` 跟圖片 |
| `scripts/sync-event-counts.ts` | 依 Firestore `bookings` 實際數量重算活動的 `registeredCount` |

詳細用法見 `scripts/README.md`（原始文件，命令列參數說明仍然準確）。

### `scripts/hero_bn_sizes.mjs`

跟 Firebase 無關，純本機工具：掃描 `public/images/hero_bn/`，用 `image-size` 套件算出每張圖的寬高，寫入 `data/hero_bn.json`（首頁背景輪播用）。

```bash
npm run hero-bn-sizes
```

新增/更換首頁背景圖後要重跑這個腳本。`scripts/generate-mock-data.ts` 產生化石圖片的寬高時，用的是同一種「讀 buffer → `image-size`」手法。

## 目前還需要人工補上的內容

作品集的公司/角色/描述、活動的完整資訊還是產生腳本填入的空白佔位文字。這些欄位已經在 D1 裡了（`projects`/`events` 表），直接改 `data/mock/projects.json`/`events.json`，重新 POST `/api/_dev/seed` 覆蓋回資料庫（見 [database.md](./database.md#大量修正時改本機-json-檔案更快)）——**改完這兩份檔案後不要再跑 `generate-mock-data.ts`**，理由同上。
