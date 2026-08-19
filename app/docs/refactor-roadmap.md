# 重構路徑圖

這份文件規劃 Lacunae 下一輪的結構性重構，目標是讓程式碼更好維護、更安全地擴充、更接近公司的 Nuxt 標準，同時不做風險過高的重寫。

## 重構目標

| 目標 | 結果 |
| --- | --- |
| 移除舊資料供應商的耦合 | 正式站只跑目前這套 NuxtHub/server API runtime |
| 把 API 契約從頁面狀態拆出來 | Endpoint 定義集中在 API modules，composable 只管狀態與流程 |
| 補強 server 端行為 | Server routes 驗證存取權限、上架狀態、名額、重複寫入 |
| 為後台功能做準備 | Auth、角色、layout、上傳流程在動 UI 之前先有清楚的契約 |
| 讓每次改動都好 review | 每個 phase 落地成一組小 commit，附 typecheck、lint、build 驗證 |

## 目標結構

以現有專案結構為基礎，不要整套照搬 `/Users/abel/nuxt-standard` 或 `/Users/abel/eip_fe`，只借用能解決現在問題的慣例。

```text
app/
├── api/
│   ├── client.ts           # 共用的 request 層
│   ├── normalize.ts        # ApiError 正規化
│   └── modules/            # 依業務領域分組的 endpoint 契約
│       ├── fossils.ts
│       ├── species.ts
│       ├── projects.ts
│       ├── events.ts
│       └── bookings.ts
├── composables/            # 有狀態的 UI/資料流程
├── middleware/             # 後台開始後的 auth/admin guard
├── stores/                 # session/全域狀態
└── layouts/                # default/admin layout

server/
├── api/                    # HTTP handler
├── db/                     # schema 與 migration
├── services/               # server routes 共用的領域邏輯
└── utils/                  # 小型 server 工具
```

## 從 `eip_fe` 借用的整併原則

`/Users/abel/eip_fe` 是一個 Vue 3 + Vite 的企業後台專案，不是 Nuxt app，但它的整併原則對 Lacunae 有參考價值。

### 可以採用的做法

| 模式 | 對 Lacunae 的幫助 |
| --- | --- |
| 領域 API 檔案，例如 `repairApi.ts`、`websiteApi.ts` | 把 endpoint URL、payload 型別、回應解包邏輯從頁面裡拆出來 |
| 集中管理的 API 常數（module 名稱、權限、URL 片段） | 後台 CRUD API 一多，能減少字串手誤 |
| Request wrapper 統一管 token、錯誤、二進位回應、abort | 把驗證跟網路行為從元件裡拿掉 |
| Route meta 統一管標題、icon、auth、返回路徑 | 後台導覽跟權限可以從單一路由表就看得出來 |
| Store 管跨頁面的流程狀態 | 分頁、篩選、權限、session 狀態在換頁時能維持穩定 |
| 共用的 table、modal、upload、表單元件 | 避免每個 CRUD 頁面都重做一次一樣的後台互動 |
| 一個問題一個 branch、一個 PR | Review 範圍小，回滾也實際可行 |

### 不要照搬的做法

| 模式 | 原因 |
| --- | --- |
| 一個包辦所有欄位型別的超通用 `FormInput` | 雖然減少重複，但型別跟可讀性會變差；優先用專職的欄位元件或小型表單 wrapper |
| 一次處理很多流程的巨大 router guard | 保留 route meta 的概念，但後台開始後要依職責拆開 guard |
| 把 LocalStorage-backed auth 當長期 session 模型 | Lacunae 用 Nuxt + SSR，cookie-backed session 才是比較合適的目標 |
| 整套企業後台的抽象都搬過來 | Lacunae 目前還是以公開內容站為主，後台抽象要等後台功能真的開始才加 |

### 什麼時候該整併

至少符合以下兩項才整併：

- 同樣的值、payload 結構、流程在超過一個地方出現
- 打錯字會造成實際的 runtime bug（例如路由名稱、權限名稱、API 路徑片段、狀態值）
- 多個功能需要延伸同一條規則
- 這條規則對應到 API schema、表單 schema 或資料庫 schema
- 抽象化之後呼叫端會變短、變清楚

程式碼只出現一次、樣子還在摸索、或抽象化需要一堆選項才能描述單一個別情境時，不要整併。

## Phase 1：移除舊 runtime

狀態：**已完成**（2026-08-11）。正式站現在只跑目前這套 NuxtHub/server API runtime，舊供應商專用的腳本與文件都已移除。

### Tasks

1. 在後台 auth 還沒準備好之前，把 `useAuth()` 換成本地的停用版實作 ✅
2. 把 `useFavorites()` 換成純 localStorage 實作 ✅
3. 從 `nuxt.config.ts` 移除舊供應商 module ✅
4. import 都清乾淨後移除舊供應商依賴套件 ✅
5. 把供應商專用的時間戳型別換成本地可序列化的日期型別 ✅
6. 刪除舊供應商專用的維護腳本與文件 ✅

### Acceptance checks

```bash
npm run typecheck
npm run lint:script
npm run lint:style
npm run build
```

正式環境的 build 不應該再警告 client bundle 裡包了舊資料供應商的 SDK。

## Phase 2：把 API modules 從 composable 狀態裡拆出來

現在的 `apiFetch()` 層本身沒問題，但 endpoint 路徑還是寫在各個業務 composable 裡。先把 endpoint 呼叫搬到 API modules，composable 對外的方法名稱維持不變。

### Tasks

1. 重複出現的 API 路徑片段，集中放進 `app/constants/api.ts`
2. 新增 `app/api/modules/fossils.ts`、`species.ts`、`projects.ts`、`events.ts`、`bookings.ts`
3. 從 module 匯出單純的 async function，例如 `listFossils()`、`getFossilBySlug()`、`createBooking()`
4. 更新 `useFossils()`、`useSpecies()`、`useProjects()`、`useEvents()` 改呼叫 API modules
5. 頁面元件維持不動，除非 TypeScript 需要小幅 import 調整
6. 把 module 的慣例寫進 [api-reference.md](./api-reference.md) 或這份文件

### Acceptance checks

- 既有頁面行為不變
- Composable 對外方法名稱維持穩定
- Typecheck、lint 都通過

## Phase 3：補強報名與公開內容 API

化石、作品集、活動這幾個公開內容的檢查已經改善過，報名（booking）在正式接受真實流量之前還需要更嚴謹的 server 端規則。

### Tasks

1. `POST /api/bookings` 要驗證活動存在且已上架
2. `registeredCount >= capacity` 時要拒絕報名
3. 同一場活動要用 `uid` 或正規化後的 email 擋掉重複報名
4. 如果部署用的資料庫 driver 支援交易，把報名寫入跟 `registeredCount` 更新包在同一個交易裡
5. 重複報名、額滿、活動不存在、活動未上架，統一回傳一致格式的 `ApiError`
6. 如果專案之後有測試框架，補上針對這幾條規則的 server 端測試

### Acceptance checks

- 重複請求不會讓 `registeredCount` 累加
- 額滿的活動回傳前端可以安全處理的錯誤
- 未上架的活動不能收到報名

## Phase 4：準備後台的基礎建設

完整規劃（已確認的決定、tasks、待決問題、acceptance checks）搬到專門的 [admin-panel-plan.md](./admin-panel-plan.md)，這裡不重複內容。這個 phase 完成的判斷標準以那份文件為準。

## Phase 5：改善頁面與元件的邊界

有些路由頁面還是把資料讀取、資料轉換、UI 狀態、大段 template 全部包在同一個檔案裡。只在真的能降低複雜度的地方才拆分。

### Tasks

1. 路由頁面維持只當組合的介面
2. 把大段的功能區塊搬進 `app/components/<domain>/`
3. 把路由專屬的狀態流程搬進專職的 composable
4. 把重複的圖片 URL 正規化邏輯換成單一個 helper
5. 視覺元件盡量維持純呈現用途
6. 有兩個畫面都需要同一種 table、modal、表單、上傳、確認流程時，才抽出共用的後台元件

### 候選拆分區域

| 區域 | 原因 |
| --- | --- |
| `app/pages/species/[slug].vue` | 一個檔案包了路由、資料讀取、分組、分頁籤、圖片選擇、呈現 |
| `app/pages/index.vue` | 一個檔案包了 hero 行為、化石資料抓取、隨機排序、分頁、lazy loading |
| `app/components/ui/BookingModal.vue` | 一個檔案包了表單狀態、重複報名檢查、建立報名、EmailJS 副作用 |

### 後台共用元件候選

這些要等第一批後台頁面真的存在之後再做：

| 元件 | 什麼時候該做 |
| --- | --- |
| `AdminDataTable` | 兩個以上的後台資源需要同一種列表、分頁、排序、列操作 |
| `AdminModal` | 新增/編輯/刪除的對話框共用同一套 header、footer、pending、錯誤狀態 |
| `useCrudModal()` | 多個後台畫面都需要新增/編輯/目前選取項目的狀態 |
| `usePaginatedQuery()` | 多個列表畫面共用頁碼、每頁筆數、篩選、重新載入邏輯 |
| `useConfirmAction()` | 破壞性操作重複用到同一套確認、pending、成功、錯誤處理 |

### Acceptance checks

- 路由行為不變
- 拆出來的元件有明確的 props 跟 emits
- 每次拆分之後既有的 lint、typecheck 都要過

## Phase 6：補上輕量的測試基礎

等第一輪結構性重構做完再做這個。測試要鎖住高風險的行為，不用每個元件都做 snapshot。

### Tasks

1. 用 Vitest 測純函式、API 正規化邏輯、server 端的 service 邏輯
2. 只用 Playwright 測關鍵流程，例如打開首頁、物種頁、作品集頁、報名 modal
3. 用 `.playwright-mcp/` 忽略本機 Playwright MCP 產生的檔案
4. 等本機測試穩定後再加進 CI 指令

### Acceptance checks

```bash
npm run typecheck
npm run lint
npm run build
```

等測試指令真的存在之後，補進這份清單。

## Commit 策略

依行為分組，用小 commit。遵循 `eip_fe` 的規則：一個問題一個 branch，改動大到值得獨立 review 時開一個獨立的 PR。

```text
refactor(auth): remove obsolete runtime fallback
refactor(api): add domain api modules
fix(bookings): enforce server-side registration rules
feat(admin): add session and admin route foundation
refactor(species): split species page sections
test(api): add server behavior coverage
```

每個 commit 都要讓 app 維持可執行狀態。避免把「移除依賴套件」「API 行為改動」「UI 拆分」混在同一個 commit 裡。

## 暫停條件

發生以下任何一種情況，重構要先暫停：

- 這個 phase 需要一個產品層級的決定，例如登入方式、後台角色、領域模型的改動
- 這個改動需要刪除歷史資料，或是要重新產生正式環境的資料
- 這次重構會改到公開路由、URL query 行為，或圖片路徑
- 這個 phase 沒辦法在不修無關問題的情況下通過 typecheck 跟 lint
