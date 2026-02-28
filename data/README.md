# 資料管理說明

本資料夾用於管理化石圖鑑的資料檔案。

## 📁 檔案說明

- **`input.json`**: **唯一的資料來源**，簡化的標本輸入格式

## 🎯 工作流程：本機作為唯一資料庫版本

**重要概念**：`input.json` 是本機的唯一資料來源，Firebase 是遠端資料庫。

### 工作流程

```
編輯 input.json → 同步到 Firebase → Firebase 更新
     ↑                                              ↓
     └────────── 發現錯誤，修改 input.json ──────────┘
```

### CRUD 操作

#### ✅ Create（新增）
```json
// 在 input.json 中新增標本
{
  "specimens": [
    {
      "species": "Crotalocephalus gibba",
      "country": "Morocco",
      "state": "Alnif",
      "images": { "folder": "cg-002" }
    }
  ]
}
```
```bash
npx tsx scripts/sync-from-input.ts
```

#### 📖 Read（讀取）
- Firebase 是前端顯示的資料來源
- 如果需要查看完整資料，可以在 Firebase 控制台查看

#### ✏️ Update（更新）
```json
// 在 input.json 中修改現有標本
{
  "specimens": [
    {
      "species": "Crotalocephalus gibba",
      "country": "Morocco",
      "state": "Alnif",
      "city": "Anti-Atlas",  // 新增或修改欄位
      "condition": "excellent",  // 修改狀態
      "images": { "folder": "cg-002" }
    }
  ]
}
```
```bash
npx tsx scripts/sync-from-input.ts --force
```

#### 🗑️ Delete（刪除）
```json
// 從 input.json 中移除標本
{
  "specimens": [
    // 移除不需要的標本
  ]
}
```
```bash
# 注意：目前腳本不會自動刪除 Firebase 中的資料
# 需要手動在 Firebase 控制台刪除，或使用其他腳本
```

### 優勢

1. **版本控制**：`input.json` 可以用 Git 管理，追蹤所有變更
2. **錯誤修正**：發現錯誤時，直接修改 `input.json`，然後推送更新
3. **不需要手動編輯 Firebase**：所有資料修改都在本機完成
4. **備份簡單**：只需要備份 `input.json` 和圖片資料夾

### 注意事項

- **統計資料保留**：使用 `--force` 更新時，會保留 Firebase 中的 `likeCount`、`viewCount`、`tags` 等統計資料
- **物種詳細資訊保留**：更新時會保留物種的中文名稱、分類、地質年代等詳細資訊
- **圖片上傳**：修改圖片後，需要重新執行 `upload-images.ts`

## 使用方式

### 🚀 簡化工作流程（推薦）

#### 1. 編輯 `input.json`

只需要填寫基本資訊：

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
- `images.folder`: 圖片資料夾名稱

**選填欄位**:
- `city`: 城市/地區
- `formation`: 地層名稱
- `condition`: 保存狀態（excellent | good | fair | poor）
- `completeness`: 完整度（0-100）
- `catalogNumber`: 館藏編號
- `collectionDate`: 發現日期
- `images.files`: 圖片檔案列表（如果沒有則自動掃描資料夾）

#### 2. 同步到 Firestore

```bash
# 同步資料（跳過已存在的文件）
npx tsx scripts/sync-from-input.ts

# 強制更新所有資料
npx tsx scripts/sync-from-input.ts --force
```

這會自動：
- 生成 `slug`、`shortCode`、圖片路徑等
- 處理物種（如果不存在就建立，存在就保留現有資料）
- 直接同步到 Firestore
- 自動更新物種的 `specimenCount`

### 更新現有資料

如果發現 Firebase 上的資料有錯誤：

1. **修改 `input.json`**（修正錯誤的欄位）
2. **執行同步**（使用 `--force` 更新）
   ```bash
   npx tsx scripts/sync-from-input.ts --force
   ```

**重要**：
- 使用 `--force` 會更新標本的基本資訊（位置、狀態、圖片等）
- **不會覆蓋**統計資料（`likeCount`、`viewCount`）
- **不會覆蓋**物種的詳細資訊（中文名稱、分類、地質年代等）

### 3. 上傳圖片到 Storage

```bash
npx tsx scripts/upload-images.ts --bucket=fossil-index.firebasestorage.app --force
```

## 資料格式

### input.json 範例（推薦）

```json
{
  "specimens": [
    {
      "species": "Crotalocephalus gibba",
      "country": "Morocco",
      "state": "Alnif",
      "city": "Anti-Atlas",
      "formation": "Anti-Atlas (Alnif area)",
      "condition": "excellent",
      "completeness": 88,
      "catalogNumber": "MOR-ALNIF-CROGIB-001",
      "collectionDate": "2026-01-01",
      "images": {
        "folder": "cg-002"
      }
    }
  ]
}
```


## 注意事項

1. **日期格式**: 使用 ISO 8601 格式（`YYYY-MM-DD`），例如：`2026-01-01`
2. **圖片路徑**: 自動生成，格式為 `images/fossils/{shortCode}/filename.jpg`
3. **slug**: 自動生成，格式為 `{species-slug}-{country}-{state}-{number}`
4. **強制更新**: 使用 `--force` 參數會更新標本的基本資訊，但保留統計資料和物種詳細資訊
5. **版本控制**: 建議將 `input.json` 加入 Git，方便追蹤變更和協作

