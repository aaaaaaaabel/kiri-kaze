# Firebase 更新指令

## 📋 完整工作流程

### 1. 準備圖片資料夾

```bash
# 根據 input.json 建立對應的資料夾（使用 shortCode）
npx tsx scripts/prepare-folders.ts

# 如果需要刪除不需要的舊資料夾
npx tsx scripts/prepare-folders.ts --clean
```

### 2. 放置圖片

將圖片放到對應的資料夾中：
```
public/images/fossils/{shortCode}/
  ├── thumbnail.jpg  (第一張圖，必填)
  ├── main.jpg       (第一張圖，必填)
  ├── detail_1.jpg   (選填)
  ├── detail_2.jpg   (選填)
  └── ...
```

**範例**：
- `public/images/fossils/00839325441/thumbnail.jpg`
- `public/images/fossils/00839325441/main.jpg`
- `public/images/fossils/00839325441/detail_1.jpg`

### 3. 同步資料到 Firestore

```bash
# 新增資料（跳過已存在的文件）
npx tsx scripts/sync-from-input.ts

# 更新現有資料（使用 --force）
npx tsx scripts/sync-from-input.ts --force
```

### 4. 上傳圖片到 Firebase Storage

```bash
# 使用預設 bucket
npx tsx scripts/upload-images.ts

# 指定 bucket
npx tsx scripts/upload-images.ts --bucket=fossil-index.firebasestorage.app

# 強制覆蓋已存在的圖片
npx tsx scripts/upload-images.ts --bucket=fossil-index.firebasestorage.app --force
```

---

## 🚀 快速更新流程

### 第一次上傳（新增資料）

```bash
# 1. 建立資料夾
npx tsx scripts/prepare-folders.ts

# 2. 放置圖片到對應資料夾

# 3. 同步資料到 Firestore
npx tsx scripts/sync-from-input.ts --force

# 4. 上傳圖片到 Storage
npx tsx scripts/upload-images.ts --bucket=fossil-index.firebasestorage.app --force
```

### 更新現有資料

```bash
# 1. 修改 data/input.json

# 2. 更新圖片（如果需要）

# 3. 同步更新到 Firestore
npx tsx scripts/sync-from-input.ts --force

# 4. 重新上傳圖片（如果圖片有更新）
npx tsx scripts/upload-images.ts --bucket=fossil-index.firebasestorage.app --force
```

---

## 📝 資料夾對應表

根據 `input.json` 生成的資料夾對應：

| 物種 | shortCode | 資料夾路徑 |
|------|-----------|------------|
| Crotalocephalus gibba | 00839325441 | `public/images/fossils/00839325441/` |
| Barrandeops sp. | 01158262240 | `public/images/fossils/01158262240/` |
| Hollardops mesocristata | 00490996758 | `public/images/fossils/00490996758/` |
| Drotops megalomanicus | 01508305556 | `public/images/fossils/01508305556/` |
| Harpes perradiatus | 00627610152 | `public/images/fossils/00627610152/` |
| Gerastos granulosus | 00230457003 | `public/images/fossils/00230457003/` |
| Calymene sp. | 00027806192 | `public/images/fossils/00027806192/` |
| Scyphocrinites elegans | 01117610476 | `public/images/fossils/01117610476/` |
| Asterocidaris bistriata | 01121007897 | `public/images/fossils/01121007897/` |
| Asterocidaris meandrina | 02036503767 | `public/images/fossils/02036503767/` |

---

## ⚠️ 注意事項

1. **圖片命名規則**：
   - `thumbnail.jpg` - 縮圖（必填，通常是第一張圖）
   - `main.jpg` - 主圖（必填，通常是第一張圖）
   - `detail_1.jpg`, `detail_2.jpg`, ... - 細節圖（選填，從 1 開始編號）

2. **資料夾名稱**：
   - 使用 `shortCode`（11 位數字）作為資料夾名稱
   - 不要使用舊的 slug 格式（例如：`crotalocephalus-gibba-morocco-alnif-specimen-001`）

3. **更新資料**：
   - 使用 `--force` 會更新標本的基本資訊
   - **不會覆蓋**統計資料（`likeCount`、`viewCount`）
   - **不會覆蓋**物種的詳細資訊（中文名稱、分類、地質年代等）

4. **圖片上傳**：
   - 圖片會自動從 `public/images/fossils/{shortCode}/` 讀取
   - 上傳到 Storage 的路徑：`images/fossils/{shortCode}/thumbnail.jpg`

