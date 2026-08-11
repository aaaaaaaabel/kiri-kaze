# Server API 參考

所有 route 定義在 `server/api/`，回傳形狀對齊 `app/types/fossil.ts` 的 `IFossil`/`ISpecies`，前端不需要額外轉換。找不到資料時回傳 HTTP 404，`statusMessage` 是中文錯誤訊息。

## Species

### `GET /api/species/:slug`

依 slug 取得單一物種。

```bash
curl http://localhost:3000/api/species/crotalocephalus-gibba
```

回傳：`ISpecies` 物件（見 [database.md](./database.md) 的 `species` 表欄位）。找不到 → 404。

### `GET /api/species/code/:code`

依標本的 `shortCode` 反查所屬物種（先查 `fossils.shortCode`，再用查到的 `speciesId` 找 `species`）。

```bash
curl http://localhost:3000/api/species/code/00422825591
```

回傳：`ISpecies` 物件。標本或物種任一找不到 → 404。

## Fossils

### `GET /api/fossils`

化石列表，支援 query 篩選/排序/分頁。

| 參數 | 型別 | 預設 | 說明 |
| --- | --- | --- | --- |
| `publicOnly` | `"true" \| "false"` | `true` | 只顯示 `isPublic` 為真的標本 |
| `featuredOnly` | `"true" \| "false"` | `false` | 只顯示 `featured` 為真的標本 |
| `sortBy` | `"createdAt" \| "updatedAt"` | `createdAt` | 排序欄位。型別上支援 `scientificName` 但目前前端沒有任何地方實際傳這個值，傳了會 fallback 成 `createdAt` |
| `sortDirection` | `"asc" \| "desc"` | `desc` | |
| `pageSize` | number | 不限 | 取前 N 筆 |
| `lastDocId` | string | 無 | Cursor 分頁：只回傳排在這個 `id` 之後的資料 |

```bash
curl "http://localhost:3000/api/fossils?pageSize=3&sortDirection=asc"
```

回傳：`IFossil[]`（已經用 JOIN 補上 `speciesRef`）。

### `GET /api/fossils/:id`

依 `id` 取得單一標本（`id` 就是 `slug`，不是自動編號）。

### `GET /api/fossils/slug/:slug`

依 `slug` 取得單一標本。跟 `/api/fossils/:id` 效果相同（`id === slug`），保留兩個路徑是為了對齊舊版 Firestore 版本 `useFossils` 的方法命名（`fetchFossilById` / `fetchFossilBySlug`）。

### `GET /api/fossils/code/:code`

依 `shortCode` 取得單一標本。

### `GET /api/fossils/by-species/:speciesSlug`

依物種 slug 取得該物種所有公開標本。同時支援「推薦相關標本」的用途：

| 參數 | 型別 | 說明 |
| --- | --- | --- |
| `excludeId` | string | 排除某一筆（通常是「目前正在看的這筆」） |
| `limit` | number | 上限筆數 |

```bash
# 該物種所有標本
curl http://localhost:3000/api/fossils/by-species/harpes-perradiatus

# 推薦相關標本：同物種、排除自己、最多 20 筆
curl "http://localhost:3000/api/fossils/by-species/harpes-perradiatus?excludeId=harpes-perradiatus-morocco-alnif-001&limit=20"
```

物種不存在時回傳空陣列（不是 404），因為前端呼叫這個 API 時通常已經確定物種存在，空結果代表「這個物種目前沒有標本」是合理狀態。

## Projects

### `GET /api/projects`

作品集列表，支援 query 篩選/排序/分頁。

| 參數 | 型別 | 預設 | 說明 |
| --- | --- | --- | --- |
| `publicOnly` | `"true" \| "false"` | `true` | |
| `featuredOnly` | `"true" \| "false"` | `false` | |
| `category` | string | 無 | 依 `ProjectCategory`（`work`/`personal`/`side-project`）篩選 |
| `sortBy` | `"createdAt" \| "updatedAt" \| "period"` | `createdAt` | |
| `sortDirection` | `"asc" \| "desc"` | `desc` | |
| `pageSize` | number | `20` | |
| `lastDocId` | string | 無 | Cursor 分頁 |

```bash
curl "http://localhost:3000/api/projects?pageSize=3"
```

回傳：`IProject[]`。

### `GET /api/projects/:id`

依 `id` 取得單一專案。

### `GET /api/projects/slug/:slug`

依 `slug` 取得單一專案。

## Events

### `GET /api/events`

已發布的活動列表，依 `date` 由早到晚排序。

```bash
curl http://localhost:3000/api/events
```

回傳：`IEvent[]`（只包含 `isPublished` 為真的活動）。

### `GET /api/events/slug/:slug`

依 `slug` 取得單一活動。

## Bookings

### `POST /api/bookings`

建立報名紀錄，並將對應活動的 `registeredCount` 原子性 +1（用 SQL `registeredCount = registeredCount + 1`，不是先讀再寫，避免併發報名時計數不準）。

```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"eventId":"placeholder-event","eventTitle":"...","uid":null,"name":"Abel","email":"a@b.com","phone":"0912345678","notes":""}'
```

必填：`eventId`、`eventTitle`、`name`、`email`、`phone`。缺少任一 → 400。

### `GET /api/bookings/check`

檢查是否已報名過某活動。

| 參數 | 型別 | 說明 |
| --- | --- | --- |
| `eventId` | string | 必填 |
| `uid` | string | 登入使用者查詢方式，跟 `email` 至少要有一個 |
| `email` | string | 未登入使用者查詢方式（會自動轉小寫比對） |

```bash
curl "http://localhost:3000/api/bookings/check?eventId=placeholder-event&email=a@b.com"
# { "exists": false }
```

## 圖片

### `GET /cdn/:pathname`

服務存在 blob 儲存（NuxtHub blob / R2）裡的圖片，`pathname` 是上傳時的 key（例如 `images/fossils/crotalocephalus-gibba/morocco-alnif/001/thumbnail.jpg`）。這不是 `server/api/` 底下的 API，是 `server/routes/cdn/`，回傳的是圖片本身（bytes），不是 JSON。詳見 [images-and-blob.md](./images-and-blob.md)。

```bash
curl http://localhost:3000/cdn/images/fossils/crotalocephalus-gibba/morocco-alnif/001/thumbnail.jpg
```

## 開發用（不對外）

### `POST /api/_dev/seed`

清空並重新從 `data/mock/*.json` 灌資料（species、fossils、projects、events），見 [database.md](./database.md#重新灌入-mock-資料seed)。**這個端點沒有身分驗證，正式環境不應該讓外部存取。**

### `POST /api/_dev/migrate-images` {#dev-migrate-images}

一次性把 `public/images/fossils/`、`public/images/case/` 底下的圖片上傳進 blob 儲存，並更新資料庫裡對應的路徑欄位（`thumbnail`/`cover`/`images[].url`/`representativeImage`），詳見 [images-and-blob.md](./images-and-blob.md)。可重複執行，已經是新路徑的欄位不會重複處理。**同樣沒有身分驗證，正式環境不應該讓外部存取。**

```bash
curl -X POST http://localhost:3000/api/_dev/migrate-images
# { "filesUploaded": 200, "updatedFossils": 31, "updatedSpecies": 0, "updatedProjects": 15, "updatedEvents": 0 }
```

## 共用實作細節

- `server/utils/fossil-mapper.ts` 的 `attachSpeciesRef(fossilRow)`：查出 `fossilRow.speciesId` 對應的物種，組成 `{ ...fossil, speciesRef: { id, slug, name: { zh, scientific } } }`，找不到物種回傳 `null`。單筆查詢類的 route（`[id]`、`slug/[slug]`、`code/[code]`）都靠這個函式組裝回傳值。
- 列表類 route（`fossils/index.get.ts`、`fossils/by-species/[speciesSlug].get.ts`）因為要處理多筆，改成先撈出所有涉及的 `speciesId`，一次查完 `species` 表建 `Map`，避免對每一筆標本各查一次物種（N+1 查詢）。
- `bookings` 沒有對應的 `useMockBookings`——mock 模式下的報名資料是直接寫在 `useMockEvents.ts` 裡用 `localStorage` 模擬的，遷移到 D1 後這部分邏輯整個被 `server/api/bookings/*` 取代。
