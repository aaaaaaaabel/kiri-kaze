# 資料結構與運作方式說明

## 📋 資料關係圖

```
Species (物種) - Firestore collection: "species"
  └── 一個物種可以有多個標本
      └── Fossil 1 (標本 1) - Firestore collection: "fossils"
      └── Fossil 2 (標本 2)
      └── Fossil 3 (標本 3)
```

---

## 🚀 目前的工作流程（推薦）

### Git 風格同步流程：使用 `input.json`

**只需要編輯一個簡化的 JSON 檔案，然後執行一個命令即可！**

#### 1. 編輯 `data/input.json`

```json
{
  "specimens": [
    {
      "species": "Crotalocephalus gibba",
      "country": "Morocco",
      "state": "Alnif",
      "city": "Anti-Atlas",
      "formation": "Anti-Atlas Formation",
      "condition": "excellent",
      "completeness": 88,
      "catalogNumber": "MOR-ALNIF-CROGIB-001",
      "collectionDate": "2026-01-01",
      "bodyPart": {
        "category": "other",
        "specific": "complete"
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

#### 2. 建立圖片資料夾

```bash
npx tsx scripts/prepare-folders.ts
```

**這個腳本會自動**:
- ✅ 根據 `input.json` 計算每個標本的資料夾路徑
- ✅ 建立資料夾結構：`public/images/fossils/{species-slug}/{location-id}/{specimen-number}/`
- ✅ 支援 bodyPart 子資料夾（例如：`001/tooth/`）

#### 3. 放置圖片

將圖片放到生成的資料夾，**必須包含 `thumbnail.jpg`**（用戶手動選擇並命名）

#### 4. 預覽 Diff（推薦）

```bash
npx tsx scripts/sync.ts
```

**會顯示類似 `git status` 的預覽**:
```
✅ 新增 (2 筆)
   + trilobita-newensis-morocco-alnif-001
   + trilobita-newensis-russia-moscow-001

🔄 更新 (1 筆)
   ~ existing-specimen-slug  [specimen, images]

🗑️  刪除 (1 筆)
   - old-specimen-slug
```

#### 5. 執行同步 + 上傳圖片

```bash
# 執行同步（真正寫入 Firestore）
npx tsx scripts/sync.ts --apply

# 執行同步 + 上傳圖片（推薦！）
npx tsx scripts/sync.ts --apply --upload

# 強制覆蓋已存在的圖片
npx tsx scripts/sync.ts --apply --upload --force
```

**這個腳本會自動**:
- ✅ 生成 `slug`（物種和標本）
- ✅ 生成 `shortCode`（基於 slug hash，固定不變）
- ✅ 生成圖片路徑（格式：`images/fossils/{species-slug}/{location-id}/{specimen-number}/thumbnail.jpg`）
- ✅ 處理物種（如果不存在就建立，存在就保留現有詳細資料）
- ✅ 建立或更新標本
- ✅ 自動更新物種的 `specimenCount`
- ✅ 自動刪除 Firestore 中不在 `input.json` 的標本和對應 Storage 圖片
- ✅ 上傳圖片到 Firebase Storage

---

## 📁 檔案說明

### `input.json`（推薦使用）

**用途**: 簡化的輸入格式，只需要填寫基本資訊

**位置**: `data/input.json`

**是否必要**: ✅ **是**（如果使用簡化流程）

**工作流程**: `input.json` → `sync.ts` → Firestore

---

## 🎯 本機作為唯一資料庫版本

**重要概念**：`input.json` 是本機的唯一資料來源，Firebase 是遠端資料庫。

### 工作流程

```
編輯 input.json → 同步到 Firebase → Firebase 更新
     ↑                                              ↓
     └────────── 發現錯誤，修改 input.json ──────────┘
```

### CRUD 操作

- **Create（新增）**: 在 `input.json` 中新增標本，執行 `sync.ts --apply`
- **Read（讀取）**: Firebase 是前端顯示的資料來源
- **Update（更新）**: 修改 `input.json`，執行 `sync.ts --apply`
- **Delete（刪除）**: 從 `input.json` 移除標本，執行 `sync.ts --apply`（會自動刪除 Firestore 和 Storage 中的資料）

### 優勢

1. **版本控制**：`input.json` 可以用 Git 管理，追蹤所有變更
2. **錯誤修正**：發現錯誤時，直接修改 `input.json`，然後推送更新
3. **不需要手動編輯 Firebase**：所有資料修改都在本機完成
4. **備份簡單**：只需要備份 `input.json` 和圖片資料夾

---

## 📊 資料結構

### 1. Species (物種) - Firestore: `species` collection

#### Slug 命名規則
```
{學名-slug}
```

**範例**:
- `tyrannosaurus-rex` - 暴龍
- `trilobita` - 三葉蟲
- `elrathia-kingii` - 埃氏正三葉蟲
- `crotalocephalus-gibba` - Crotalocephalus gibba

#### 資料結構
```json
{
  "id": "tyrannosaurus-rex",
  "slug": "tyrannosaurus-rex",
  "name": {
    "zh": "暴龍",
    "en": "Tyrannosaurus Rex",
    "scientific": "Tyrannosaurus rex"
  },
  "taxonomy": {
    "kingdom": "動物界",
    "phylum": "脊索動物門",
    "class": "爬蟲綱",
    "order": "蜥臀目",
    "family": "暴龍科",
    "genus": "Tyrannosaurus",
    "species": "rex"
  },
  "period": {
    "era": "中生代",
    "period": "白堊紀",
    "age": "晚白堊世"
  },
  "description": {
    "zh": "..."
  },
  "specimenCount": 15,  // 自動計算
  "tags": ["白堊紀", "肉食恐龍"],
  "category": "dinosaur",
  "references": [  // 文獻資料（選填）
    {
      "title": "Tyrannosaurus rex: A Complete Skeleton",
      "authors": ["Smith, J.", "Doe, A."],
      "journal": "Journal of Paleontology",
      "year": 2020,
      "volume": "45",
      "pages": "123-145",
      "doi": "10.1234/jp.2020.001",
      "url": "https://example.com/paper"
    }
  ],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

### 2. Fossils (標本) - Firestore: `fossils` collection

#### Slug 命名規則（自動生成）

**單一產區物種**:
```
{species-slug}-{number}
```

**多產區物種**:
```
{species-slug}-{location-id}-{number}
```

**組成部分**:
1. `{species-slug}` - 物種的 slug
2. `{location-id}` - 產區識別碼（格式：`{country-code}-{state-code}`，例如：`morocco-alnif`）
3. `{number}` - 標本編號（三位數，例如：`001`, `002`, `003`）

**範例**:
- `crotalocephalus-gibba-001` - Crotalocephalus gibba，單一產區，標本 001
- `harpes-perradiatus-morocco-alnif-001` - Harpes perradiatus，摩洛哥 Alnif，標本 001（多產區）
- `harpes-perradiatus-russia-alnif-001` - Harpes perradiatus，俄羅斯 Alnif，標本 001（多產區）

**標本編號規則**:
- 按「物種+產區」分組計算
- 同物種不同產區的標本編號會分開計算
- 例如：`harpes-perradiatus` 在摩洛哥有 001、002，在俄羅斯也有 001、002

#### ShortCode（自動生成）

**格式**: 11 位數字（基於 slug hash，固定不變）

**用途**: 
- URL query parameter: `/species/crotalocephalus-gibba?code=08724390937`
- 簡化 URL 和圖片路徑（目前圖片路徑使用 species-slug 結構）

**生成方式**: 基於標本的 `slug` 進行 hash，確保相同 slug 總是生成相同的 shortCode

#### 資料結構
```json
{
  "id": "crotalocephalus-gibba-morocco-alnif-001",
  "slug": "crotalocephalus-gibba-morocco-alnif-001",
  "shortCode": "08724390937",
  "speciesRef": {
    "id": "crotalocephalus-gibba",
    "slug": "crotalocephalus-gibba",
    "name": {
      "zh": "",
      "scientific": "Crotalocephalus gibba"
    }
  },
  "specimen": {
    "type": "complete-skeleton",
    "completeness": 88,
    "condition": "excellent",
    "catalogNumber": "MOR-ALNIF-CROGIB-001",
    "collectionDate": "2026-01-01",
    "location": {
      "locationId": "morocco-alnif",
      "country": "Morocco",
      "state": "Alnif",
      "city": "Anti-Atlas",
      "formation": "Anti-Atlas (Alnif area)",
      "displayName": "Morocco, Alnif, Anti-Atlas"
    }
  },
  "images": [
    {
      "url": "images/fossils/crotalocephalus-gibba/morocco-alnif/001/main.jpg",
      "type": "main",
      "order": 1
    },
    {
      "url": "images/fossils/crotalocephalus-gibba/morocco-alnif/001/detail_1.jpg",
      "type": "detail",
      "order": 2
    }
  ],
  "thumbnail": "images/fossils/crotalocephalus-gibba/morocco-alnif/001/thumbnail.jpg",
  "tags": [],
  "category": "other",
  "likeCount": 0,
  "viewCount": 0,
  "isPublic": true,
  "featured": false,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

## 🖼️ 圖片路徑規則

### 本地資料夾結構

**正式資料夾**（推薦使用）:
```
public/images/fossils/
  └── {species-slug}/
      └── {location-id}/          # 例如：morocco-alnif
          └── {specimen-number}/   # 例如：001
              ├── thumbnail.jpg   # 必須存在（用戶手動選擇）
              ├── IMG_002.jpg
              ├── IMG_003.jpg
              └── ...
```

**支援 bodyPart 子資料夾**:
```
public/images/fossils/
  └── {species-slug}/
      └── {location-id}/
          └── {specimen-number}/
              └── {bodyPart}/     # 例如：tooth
                  ├── thumbnail.jpg
                  ├── IMG_002.jpg
                  └── ...
```

**輸入資料夾**（可選，舊方式）:
```
public/images/input/
  └── {folder}/          # 例如：cg-002
      ├── IMG_5678.jpg
      ├── IMG_5679.jpg
      └── IMG_5680.jpg
```

### Storage 路徑（Firebase Storage）

```
images/fossils/{species-slug}/{location-id}/{specimen-number}/thumbnail.jpg
images/fossils/{species-slug}/{location-id}/{specimen-number}/IMG_002.jpg
```

**支援 bodyPart**:
```
images/fossils/{species-slug}/{location-id}/{specimen-number}/{bodyPart}/thumbnail.jpg
```

### JSON 中的路徑格式

在 Firestore 中，圖片路徑使用**相對路徑**（不含開頭的 `/`）：

```json
{
  "slug": "crotalocephalus-gibba-morocco-alnif-001",
  "shortCode": "08724390937",
  "thumbnail": "images/fossils/crotalocephalus-gibba/morocco-alnif/001/thumbnail.jpg",
  "images": [
    {
      "url": "images/fossils/crotalocephalus-gibba/morocco-alnif/001/IMG_002.jpg",
      "type": "main",
      "order": 1
    }
  ]
}
```

**規則**:
- 路徑格式：`images/fossils/{species-slug}/{location-id}/{specimen-number}/{filename}.jpg`
- 支援 bodyPart：`images/fossils/{species-slug}/{location-id}/{specimen-number}/{bodyPart}/{filename}.jpg`
- 不使用絕對路徑（`/images/...`）或完整 URL（`https://...`）
- 圖片檔案命名：
  - `thumbnail.jpg` - 縮圖（**必填**，用戶手動選擇並命名）
  - 其他圖片可保持原始檔名（例如：`IMG_002.jpg`）或自訂名稱

---

## 🔄 完整工作流程

### 新增標本（推薦流程）

#### 1. 編輯 `data/input.json`
```json
{
  "specimens": [
    {
      "species": "Crotalocephalus gibba",
      "country": "Morocco",
      "state": "Alnif",
      "city": "Anti-Atlas",
      "formation": "Anti-Atlas Formation",
      "condition": "excellent",
      "completeness": 88
    }
  ]
}
```

#### 2. 建立圖片資料夾
```bash
npx tsx scripts/prepare-folders.ts
```

**腳本會自動**:
- 根據 `input.json` 計算每個標本的資料夾路徑
- 建立資料夾結構：`public/images/fossils/{species-slug}/{location-id}/{specimen-number}/`
- 支援 bodyPart 子資料夾

#### 3. 放置圖片
將圖片放到生成的資料夾，**必須包含 `thumbnail.jpg`**（用戶手動選擇並命名）

#### 4. 預覽 Diff（推薦）
```bash
npx tsx scripts/sync.ts
```

#### 5. 執行同步 + 上傳圖片
```bash
npx tsx scripts/sync.ts --apply --upload
```

**腳本會自動**:
- 生成物種（如果不存在）
- 生成標本 slug: `crotalocephalus-gibba-morocco-alnif-001`
- 生成 shortCode: `08724390937`（基於 slug hash）
- 掃描圖片資料夾
- 生成圖片路徑: `images/fossils/crotalocephalus-gibba/morocco-alnif/001/thumbnail.jpg`
- 同步到 Firestore
- 上傳圖片到 Storage

---

### 添加文獻資料

文獻資料需要手動添加到 Firestore：

#### 1. 使用 ChatGPT 查詢文獻

向 ChatGPT 詢問物種的相關文獻，例如：
```
請幫我找 Crotalocephalus gibba 這個三葉蟲物種的相關學術文獻，
包括論文標題、作者、期刊、發表年份、DOI 等資訊。
```

#### 2. 整理文獻資料

將 ChatGPT 提供的文獻資料整理成 JSON 格式：
```json
{
  "references": [
    {
      "title": "New trilobite species from Morocco",
      "authors": ["Smith, J.", "Doe, A."],
      "journal": "Journal of Paleontology",
      "year": 2020,
      "volume": "45",
      "pages": "123-145",
      "doi": "10.1234/jp.2020.001",
      "url": "https://example.com/paper"
    }
  ]
}
```

#### 3. 添加到 Firestore

在 Firebase Console 中：
1. 進入 `species` collection
2. 找到對應的物種文件
3. 添加或更新 `references` 欄位
4. 保存

**注意**: 目前 `sync.ts` 不會覆蓋現有的 `references` 欄位，所以可以安全地手動添加。

---

## 📝 命名規則總結

### Species Slug
- **格式**: `{學名-slug}`
- **範例**: `tyrannosaurus-rex`, `trilobita`, `crotalocephalus-gibba`
- **生成**: 自動從學名轉換（小寫，空格轉連字號，移除特殊字元）

### Fossil Slug
- **單一產區格式**: `{species-slug}-{number}`
- **多產區格式**: `{species-slug}-{location-id}-{number}`
- **範例**: `crotalocephalus-gibba-001`（單一產區）或 `harpes-perradiatus-morocco-alnif-001`（多產區）
- **生成**: 自動生成，根據物種是否有多個產區決定格式

### ShortCode
- **格式**: 11 位數字
- **範例**: `08724390937`
- **生成**: 基於標本 slug 的 hash，固定不變
- **用途**: URL query parameter 和簡化連結（圖片路徑使用 species-slug 結構）

### 圖片路徑
- **格式**: `images/fossils/{species-slug}/{location-id}/{specimen-number}/{filename}.jpg`
- **範例**: `images/fossils/crotalocephalus-gibba/morocco-alnif/001/thumbnail.jpg`
- **支援 bodyPart**: `images/fossils/{species-slug}/{location-id}/{specimen-number}/{bodyPart}/{filename}.jpg`
- **生成**: 自動生成，使用 species-slug 和 location-id 結構

---

## ✅ 資料驗證檢查清單

### Input.json
- [ ] `species` 欄位存在且為字串
- [ ] `country` 欄位存在且為字串
- [ ] `state` 欄位存在且為字串
- [ ] 圖片資料夾 `public/images/fossils/{species-slug}/{location-id}/{specimen-number}/` 存在
- [ ] 圖片資料夾中包含 `thumbnail.jpg`

### Firestore Species
- [ ] `slug` 格式正確（小寫，使用連字號）
- [ ] `slug` 唯一（不與其他物種重複）

### Firestore Fossil
- [ ] `slug` 格式正確（單一產區：`{species-slug}-{number}`，多產區：`{species-slug}-{location-id}-{number}`）
- [ ] `shortCode` 存在且為 11 位數字
- [ ] `speciesRef.slug` 與物種的 `slug` 一致
- [ ] `slug` 開頭與 `speciesRef.slug` 一致
- [ ] `thumbnail` 路徑格式：`images/fossils/{species-slug}/{location-id}/{specimen-number}/thumbnail.jpg`
- [ ] `images[].url` 路徑格式：`images/fossils/{species-slug}/{location-id}/{specimen-number}/{filename}.jpg`
- [ ] 所有圖片路徑與標本的 slug 結構一致

### 圖片檔案
- [ ] 本地資料夾 `public/images/fossils/{species-slug}/{location-id}/{specimen-number}/` 存在
- [ ] 資料夾中包含 `thumbnail.jpg`（用戶手動選擇並命名）
- [ ] 圖片檔案格式正確（jpg, jpeg, png, webp）

---

## 🔍 常見問題

### Q: `fossils.json` 和 `species.json` 還需要嗎？

**A**: **不需要**（如果使用 `input.json` 流程）

- ✅ 使用 `input.json` + `sync.ts` 時，不需要這兩個檔案
- ✅ 所有資料直接同步到 Firestore
- ⚠️ 目前專案已不再使用 `fossils.json` 和 `species.json`

### Q: `shortCode` 是怎麼生成的？

**A**: 基於標本的 `slug` 進行 hash，確保：
- 相同 slug 總是生成相同的 shortCode
- 不同 slug 生成不同的 shortCode
- 固定不變（不會因為時間而改變）

### Q: 圖片路徑為什麼用 `species-slug` 結構而不是 `shortCode`？

**A**: 
- 更清晰的資料夾結構，方便管理和查找
- 支援多產區物種，路徑包含產區資訊
- 支援 bodyPart 子資料夾，方便組織部位化石
- `shortCode` 仍用於 URL query parameter 和簡化連結

### Q: 如果物種已存在，會覆蓋現有資料嗎？

**A**: **不會**（除非使用 `--force`）

- 如果物種已存在，腳本會**保留現有的詳細資料**（中文名稱、分類、地質年代等）
- 只會更新 `specimenCount` 和 `updatedAt`
- 使用 `--force` 時，會合併資料（保留現有詳細資訊）

### Q: 圖片會自動重新命名嗎？

**A**: **不會**（用戶手動命名）

- 本地圖片保持原始檔名（例如：`IMG_002.jpg`）
- **必須手動將一張圖片命名為 `thumbnail.jpg`**（用戶選擇最適合的圖片）
- 其他圖片可保持原始檔名或自訂名稱
- 上傳到 Storage 時會保持相同的檔名

---

## 📚 文獻資料管理

### 使用 ChatGPT 生成文獻資料

物種的文獻資料可以手動添加到 Firestore 的 `species` collection，或通過 Firebase Console 編輯。

**文獻資料結構**:
```json
{
  "references": [
    {
      "title": "論文標題",
      "authors": ["作者1", "作者2"],
      "journal": "期刊名稱",
      "year": 2020,
      "volume": "45",
      "pages": "123-145",
      "doi": "10.1234/jp.2020.001",
      "url": "https://example.com/paper"
    }
  ]
}
```

**建議流程**:
1. 使用 ChatGPT 查詢物種的相關文獻
2. 整理文獻資料（標題、作者、期刊、年份等）
3. 在 Firebase Console 中手動添加到對應物種的 `references` 欄位
4. 或未來可以擴展 `input.json` 支援文獻資料輸入

**文獻資料欄位說明**:
- `title`: 論文標題（必填）
- `authors`: 作者列表（必填）
- `journal`: 期刊名稱（選填）
- `year`: 發表年份（選填）
- `volume`: 卷號（選填）
- `pages`: 頁碼（選填）
- `doi`: DOI 號碼（選填）
- `url`: 論文連結（選填）

## 📚 相關檔案

- `data/input.json` - 簡化輸入格式（推薦）
- `data/STRUCTURE.md` - 資料結構說明（本檔案）
- `scripts/sync.ts` - Git 風格同步腳本（從 input.json 同步到 Firestore）
- `scripts/prepare-folders.ts` - 建立圖片資料夾結構
- `scripts/README.md` - 腳本使用說明

---

## 🎯 總結

### 推薦工作流程

```
編輯 input.json → prepare-folders.ts → 放置圖片 → sync.ts --apply --upload → Firestore + Storage
```

**優點**:
- ✅ 只需要編輯一個簡化的 JSON 檔案
- ✅ 自動生成所有欄位（slug、shortCode、圖片路徑等）
- ✅ Git 風格同步，讓線上資料庫與本機端完全一致
- ✅ 自動刪除不在 `input.json` 的標本和圖片
- ✅ 預覽模式，執行前可確認變更
- ✅ 不需要維護 `fossils.json` 和 `species.json`
- ✅ 適合大量資料輸入

