# Composables 參考

`app/composables/` 底下的檔案由 Nuxt 自動 import，頁面/元件裡不需要手動 `import`。這份文件依「資料存取類」跟「UI 邏輯類」分組。

## 資料存取類

### `useFossils()` — 標本

**資料來源**：D1（`server/api/fossils/*`），已完全遷移，沒有 mock 分支。

| 方法 | 說明 |
| --- | --- |
| `fetchFossils(options?)` | 列表，支援 `publicOnly`/`featuredOnly`/`sortBy`/`sortDirection`/`pageSize`/`lastDocId` |
| `fetchFossilById(id)` | 依 id 取單筆 |
| `fetchFossilBySlug(slug)` | 依 slug 取單筆 |
| `fetchFossilByCode(code)` | 依 shortCode 取單筆 |
| `fetchFossilsBySpeciesSlug(speciesSlug)` | 該物種所有公開標本 |
| `getRecommendations(fossil, limitCount?)` | 同物種其他標本，預設 20 筆 |
| `clearError()` / `reset()` | 清除狀態 |

回傳的 `fossils`/`currentFossil`/`loading`/`error` 都是 `readonly` ref。`error` 的型別是 `ApiError | null`（`app/types/api.ts`），內容是 `{ statusCode, message }`，`message` 直接來自 server 的 `statusMessage`（見下方「API 呼叫層」）。

舊版有的 `createFossil`/`updateFossil`/`deleteFossil`/`incrementViewCount` 在遷移時被拿掉了——檢查過沒有任何頁面呼叫這些方法（專案沒有後台管理介面），保留只會增加沒人用的程式碼。如果之後要做後台編輯功能，再依 [api-reference.md](./api-reference.md) 的模式補對應的 API route 跟方法。

### `useSpecies()` — 物種

**資料來源**：D1（`server/api/species/*`），已完全遷移。

| 方法 | 說明 |
| --- | --- |
| `fetchSpeciesBySlug(slug)` | 依 slug 取物種 |
| `fetchSpeciesByCode(code)` | 依標本 shortCode 反查物種 |
| `clearError()` / `reset()` | |

### `useProjects()` — 作品集

**資料來源**：D1（`server/api/projects/*`），已完全遷移，沒有 mock 分支。

| 方法 | 說明 |
| --- | --- |
| `fetchProjects(options?)` | 列表，支援 `publicOnly`/`featuredOnly`/`category`/`sortBy`/`sortDirection`/`pageSize`/`lastDocId` |
| `fetchProjectBySlug(slug)` | 依 slug 取單筆 |
| `fetchProjectById(id)` | 依 id 取單筆 |
| `clearError()` / `reset()` | |

舊版有的 `createProject`/`updateProject`/`deleteProject`/`waitForFirestore` 在遷移時被拿掉了——前三個沒有任何頁面呼叫（沒有後台管理介面），`waitForFirestore` 是專門處理 VueFire binding 可能還沒就緒的輪詢機制，D1 走一般 HTTP API 沒有這種非同步就緒的問題，整個方法失去意義。

### `useEvents()` — 活動

**資料來源**：D1（`server/api/events/*`、`server/api/bookings/*`），已完全遷移。

| 方法 | 說明 |
| --- | --- |
| `fetchEvents()` | 已發布的活動列表 |
| `fetchEventBySlug(slug)` | 單筆活動 |
| `checkBookingByUser(eventId, uid)` / `checkBookingExists(eventId, email)` | 是否已報名 |
| `createBooking(data)` | 建立報名紀錄，同時讓 D1 裡對應活動的 `registeredCount` +1 |
| `toEventImageUrl(image)` | 圖片路徑已經是 `/images/...`，直接原樣回傳，保留這個函式只是維持跟舊版一致的介面 |

`checkBookingByUser`/`checkBookingExists` 目前實際上共用同一個 API（`GET /api/bookings/check`），差別只是傳 `uid` 還是 `email`。報名紀錄現在真正落地在 D1 的 `bookings` 表，不會因為重整瀏覽器或清 localStorage 而消失。

### `useAuth()` — 登入

mock 模式下：`isLoggedIn` 永遠是 `false`，`loginWithGoogle()` 直接 throw 一個錯誤（訊息：「資料庫維護中，登入功能暫停使用，請稍後再試」），`logout()` 是 no-op。UI 層（`Menu.vue`）已經有處理未知錯誤 code 的 fallback 訊息，不會整頁壞掉。

### `useFavorites()` — 收藏

**模組層級 singleton**（不是每次呼叫都建立新狀態），全站共用一份 `favorites` ref，讓 `FossilCard` 的愛心跟 `/collection` 頁面同步。

- mock 模式下：完全忽略 `useCurrentUser()`/Firestore，一律使用 `localStorage`（key: `fossil_favorites`），不管有沒有殘留的舊登入狀態
- 非 mock 模式：未登入用 `localStorage`，登入後存 Firestore `users/{uid}/favorites`，登入瞬間呼叫 `mergeFavorites()` 把 localStorage 內容合併進 Firestore

## Mock 資料層（`useMockFossils`/`useMockSpecies`/`useMockProjects`/`useMockEvents`）

四個檔案現在**都已經沒有任何地方呼叫**——`useFossils`/`useSpecies`/`useProjects`/`useEvents` 全部遷移到 D1 之後不再委派給它們。保留是為了保險，等確認 D1 版本穩定後可以整批刪除，連同 `data/mock/*.json`（見 [data-architecture.md](./data-architecture.md#可以刪除的東西確認-d1-版本穩定後)）。

## UI 邏輯類（跟資料來源無關，沒有被這次遷移影響）

| Composable | 用途 |
| --- | --- |
| `useGalleryInView(galleryRef)` | gallery 元素進入視窗時在 `body` 加 class，供 `MainNav` 的 portfolio 按鈕 fade-in（`index.vue`、`collection.vue` 共用） |
| `useInfiniteScroll(fetchMore, getHasMore?)` | IntersectionObserver 觸發式無限捲動 |
| `useImageSize()` | 動態取得圖片真實尺寸（`loadImageSize(src)`），用於瀑布流佈局 |
| `usePortfolioView()` | 作品集頁面「項目顯示／圖片顯示」的 view mode 切換（`grid`/`image`），模組層級狀態 |
| `useAppTransition()` | 頁面過場動畫（簡化版用 CSS transition，非 GSAP） |
| `useWidgetsBlocksEvents()` | 追蹤頁面區塊載入狀態 |
| `useFirebaseConfig()` / `useStorage()` | 讀 VueFire 目前的 Firebase config、圖片路徑轉換工具（`getStorageUrl`）。因為所有圖片路徑都已經是 `/images/...` 開頭，這兩個工具現在實際上不會被觸發轉換邏輯，但沒有刪除的必要 |

## API 呼叫層（`app/api/`）

`useFossils`/`useProjects`/`useSpecies`/`useEvents` 內部都改用 `app/api/client.ts` 的 `apiFetch<T>(path, options?, fallbackMessage?)` 呼叫 server API，取代直接呼叫 `$fetch`。這一層只做一件事：把錯誤正規化成統一的 `ApiError`（`{ statusCode, message }`，定義在 `app/types/api.ts`），composable 不用再各自手刻 try/catch 時的錯誤訊息——`message` 直接來自 server `createError({ statusMessage })` 的內容（見 `app/api/normalize.ts` 的 `normalizeApiError`）。

新增一個資料存取方法時的慣例：
```ts
const result = await apiFetch<IFossil[]>("/api/fossils", { query: {...} }, "獲取化石列表失敗");
```
第三個參數是「當 server 沒回應（網路錯誤等，沒有 statusMessage 可用）時」的 fallback 訊息，不是用來覆蓋 server 已經給的錯誤訊息。

舊的 `app/composables/useApi.ts`（從 `lrc-frontend-nuxt` 移植、一直是空殼、沒有任何呼叫者）已經刪除，改成上面這套實際在用的架構。
