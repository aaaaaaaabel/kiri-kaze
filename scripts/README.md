# Scripts 說明

本資料夾包含用於管理 Firebase 資料的腳本。

## 🚀 簡化工作流程（推薦）

### `sync.ts` - Git 風格同步腳本
讓本機 `input.json` 與遠端 Firestore 保持完全一致

```bash
# 預覽 diff（不執行，類似 git status）
npx tsx scripts/sync.ts

# 執行同步（真正寫入 Firestore）
npx tsx scripts/sync.ts --apply

# 執行同步 + 上傳圖片（推薦！）
npx tsx scripts/sync.ts --apply --upload

# 強制覆蓋已存在的圖片
npx tsx scripts/sync.ts --apply --upload --force
```

**功能**:
- **預覽模式**：類似 `git status`，執行前可預覽所有變更
- **Git 風格同步**：讓線上資料庫與本機端完全一致
- **批次寫入**：使用 Firestore batch write，提高效率
- **清晰的 Diff 顯示**：清楚顯示 CREATE / UPDATE / DELETE / SKIP
- **自動刪除**：刪除 Firestore 中不在 `input.json` 的標本和對應 Storage 圖片
- **自動上傳**：使用 `--upload` 可自動上傳圖片到 Storage
- **安全設計**：需要 `--apply` 才會真正寫入，避免誤操作

**input.json 格式**:
```json
{
  "specimens": [
    {
      "species": "Crotalocephalus gibba",
      "country": "Morocco",
      "state": "Alnif",
      "images": {
        "folder": "cg-002"
      }
    }
  ]
}
```

**必填欄位**:
- `species`: 學名
- `country`: 國家
- `state`: 州/省

**選填欄位**:
- `city`: 城市/地區
- `formation`: 地層名稱
- `condition`: 保存狀態（excellent | good | fair | poor）
- `completeness`: 完整度（0-100）
- `catalogNumber`: 館藏編號
- `collectionDate`: 發現日期
- `bodyPart`: 部位資訊（如果是部位化石）
  ```json
  {
    "category": "tooth",
    "specific": "molar",
    "position": "上顎左側第三顆",
    "side": "left"
  }
  ```
- `measurements`: 尺寸資訊
  ```json
  {
    "length": 15.5,  // cm
    "width": 8.2,    // cm
    "height": 3.1,   // cm
    "weight": 250    // g
  }
  ```
- `description`: 標本描述（非物種描述）
  ```json
  {
    "zh": "這是一個保存完好的標本...",
    "en": "This is a well-preserved specimen..."
  }
  ```
- `tags`: 標籤列表（字串陣列）
  ```json
  ["三葉蟲", "摩洛哥", "志留紀"]
  ```
- `category`: 分類（trilobite | ammonite | dinosaur | plant | fish | mammal | other）
- `images.folder`: 圖片資料夾名稱（放在 `public/images/input/{folder}/`，如果沒有則從 `fossils/` 資料夾讀取）
- `images.files`: 圖片檔案列表（如果沒有則自動掃描資料夾）

**資料夾結構**:
```
public/images/fossils/
├── {species-slug}/
│   ├── {location-id}/          ← 產區（例如：morocco-alnif）
│   │   ├── 001/                ← 該產區的第 1 個標本
│   │   │   ├── thumbnail.jpg
│   │   │   ├── main.jpg
│   │   │   └── detail_1.jpg
│   │   └── 002/                ← 該產區的第 2 個標本
│   └── {另一個產區}/
│       └── 001/
```

### `prepare-folders.ts`
根據 `input.json` 建立對應的圖片資料夾（使用 species-slug、產區和標本編號）

```bash
# 建立資料夾
npx tsx scripts/prepare-folders.ts

# 建立資料夾並刪除不需要的舊資料夾
npx tsx scripts/prepare-folders.ts --clean
```

**功能**:
- 根據 `input.json` 計算每個標本的資料夾路徑
- 在 `public/images/fossils/` 下建立對應的資料夾結構：`{species-slug}/{location-id}/{specimen-number}/`
- 標本編號按「物種+產區」計算，支援同物種不同產區
- 列出不需要的舊資料夾（可選刪除）

### `pull.ts` - 從 Firebase 同步到本地
以 Firebase 上的 Firestore 和 Storage 版本為主，更新本地的 `input.json` 和 `images/fossils`

```bash
# 預覽會同步的內容
npx tsx scripts/pull.ts

# 執行同步（更新 input.json 和下載圖片）
npx tsx scripts/pull.ts --apply
```

**功能**:
- **從 Firestore 讀取**：讀取所有標本資料
- **生成 input.json**：將 Firestore 資料轉換為 `input.json` 格式
- **下載圖片**：從 Firebase Storage 下載所有圖片到本地資料夾
- **自動備份**：更新 `input.json` 前會自動備份現有檔案
- **安全設計**：需要 `--apply` 才會真正更新本地檔案
- **用途**：恢復誤刪的資料、以 Firebase 版本為主同步本地

## 完整工作流程

### 🚀 簡化工作流程（推薦）

```bash
# 1. 編輯 data/input.json（新增、修改、刪除標本）

# 2. 建立對應的圖片資料夾
npx tsx scripts/prepare-folders.ts

# 3. 放置圖片到對應資料夾
# public/images/fossils/{species-slug}/{location-id}/{specimen-number}/
#   ├── thumbnail.jpg  ← 必須存在（用戶手動選擇）
#   ├── IMG_002.jpg
#   └── IMG_003.jpg

# 4. 預覽 diff（推薦！先看看會做什麼）
npx tsx scripts/sync.ts

# 5. 執行同步 + 上傳圖片
npx tsx scripts/sync.ts --apply --upload
```

### 工作流程說明

#### 步驟 1：編輯 `input.json`
```json
{
  "specimens": [
    {
      "species": "新物種學名",
      "country": "Morocco",
      "state": "Alnif",
      "bodyPart": {
        "category": "tooth",
        "specific": "molar"
      }
    }
  ]
}
```

#### 步驟 2：生成資料夾
```bash
npx tsx scripts/prepare-folders.ts
```
會自動建立：`public/images/fossils/{species-slug}/morocco-alnif/001/tooth/`

#### 步驟 3：放圖片
將圖片放到生成的資料夾，確保有 `thumbnail.jpg`

#### 步驟 4：預覽（推薦）
```bash
npx tsx scripts/sync.ts
```
會顯示類似 `git status` 的預覽：
```
✅ 新增 (2 筆)
   + trilobita-newensis-morocco-alnif-001
   + trilobita-newensis-russia-moscow-001

🔄 更新 (1 筆)
   ~ existing-specimen-slug  [specimen, images]

🗑️  刪除 (1 筆)
   - old-specimen-slug
```

#### 步驟 5：執行同步
```bash
# 只同步資料
npx tsx scripts/sync.ts --apply

# 同步 + 上傳圖片（推薦！）
npx tsx scripts/sync.ts --apply --upload
```

### Git 風格同步

`sync.ts` 讓線上資料庫與本機端 `input.json` 完全一致：

- ✅ **新增**：`input.json` 中有但 Firestore 中沒有的標本
- 🔄 **更新**：`input.json` 中已存在但資料有變更的標本
- 🗑️ **刪除**：Firestore 中有但 `input.json` 中沒有的標本（會自動刪除 Storage 圖片）
- ⏭️ **無變化**：資料完全一致的標本

## 注意事項

- 所有腳本都需要 `serviceAccountKey.json` 檔案位於專案根目錄
- **預覽模式**：預設只會預覽 diff，不會真正寫入，需要加上 `--apply` 才會執行
- **刪除操作**：`--apply` 會**永久刪除** Firestore 中不在 `input.json` 的標本和對應的 Firebase Storage 圖片，請謹慎使用
- **標本編號規則**：按「物種+產區」計算，同物種不同產區的標本編號會分開計算
- **資料夾結構**：`{species-slug}/{location-id}/{specimen-number}/`，產區放在資料夾結構中，方便撈取和製作 tabs
- **thumbnail.jpg**：必須存在，用戶需要手動選擇並命名（不會自動命名）
- **批次寫入**：使用 Firestore batch write，最多 400 筆一批，提高效率
- **恢復誤刪**：如果誤刪了本地圖片資料夾或 `input.json`，可以使用 `pull.ts` 從 Firebase 恢復
- 建議先執行預覽模式（不加 `--apply`）確認無誤後再執行同步

