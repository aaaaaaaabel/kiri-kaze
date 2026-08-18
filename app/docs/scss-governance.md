# SCSS Governance

這份文件說明 `app/assets/styles/` 的分層方式、token 的唯一來源、`$lc-*` 與 `var(--lc-*)` 該怎麼選、legacy 相容層為什麼還留著，以及新程式碼的規則。架構參考 `/Users/abel/eip_fe` 的 governance 模式（分層 + token map + stylelint 命名規則），但不套用 eip_fe 的 UI 元件或視覺樣式。

## 1. SCSS 分層

```text
app/assets/styles/
├── abstracts/            # 不輸出任何 CSS，純編譯期資源
│   ├── _variables.scss   # Token 的唯一來源（$lc-*）
│   ├── _tokens.scss      # 把 _variables.scss 收成 map，供 base/_root.scss 輸出成 CSS 變數
│   ├── _bootstrap.scss   # 文件說明用，Bootstrap 實際整合在 vendors/bootstrap/
│   ├── functions/        # lc- 前綴的 SCSS function（目前尚未有內容）
│   └── mixins/
│       ├── _index.scss   # @forward 舊版 `_mixins.scss` + `_patterns.scss`
│       └── _patterns.scss# 從頁面重複樣式抽出的新版 pattern mixin
│
├── base/                 # reset → :root CSS 變數輸出 → typography
├── components/           # 專案共用元件樣式（button、portfolio、menu）
├── layouts/              # 全域版面輔助（grid、wrap、contents）
├── overrides/            # 第三方套件 CSS 覆蓋（放最後，優先權最高）
├── vendors/              # Bootstrap 變數覆蓋與基礎層載入
├── main.scss             # 唯一入口，依序 @use 上面各層，本身不含樣式
│
├── _variables.scss       # legacy 相容層（舊變數名稱，見第 4 節）
├── _mixins.scss          # legacy 相容層（舊 mixin 名稱，見第 4 節）
└── _menu.scss            # Menu 樣式，暫不搬動（見第 4 節）
```

載入順序（`main.scss`）固定為：`vendors → base → components → layouts → overrides`，不可任意調整。

## 2. Token 唯一來源

- **唯一來源**：`abstracts/_variables.scss`，所有可重複使用的顏色、字型、間距、圓角、z-index、動畫時間都定義在這裡，命名一律 `$lc-*`。
- **Token map**：`abstracts/_tokens.scss` 把上面的變數收成 `$lc-base-tokens` map。
- **CSS 變數輸出**：`base/_root.scss` 用 `@each` 把 `$lc-base-tokens` 輸出成 `:root { --lc-xxx: ...; }`，瀏覽器與 JS 都能讀到。

新增 token 時只改 `abstracts/_variables.scss` 和 `_tokens.scss` 這兩個檔案，`base/_root.scss` 不需要動。

## 3. `$lc-*` 與 `var(--lc-*)` 何時使用

| 情境 | 用法 | 原因 |
| --- | --- | --- |
| Bootstrap 變數覆蓋（`vendors/bootstrap/variables/_overrides.scss`） | `$lc-*`（SCSS 變數） | Bootstrap 的 `$spacer`、`$border-radius` 等只認編譯期 SCSS 變數，不能吃 CSS 變數 |
| `abstracts/mixins/_patterns.scss` 這類編譯期 mixin | `$lc-*` | Mixin 展開當下就要決定數值，且可能用在 `calc()`/運算 |
| 一般元件 `<style scoped>` 內的顏色、字型、圓角、動畫時間 | `var(--lc-*)` | 元件不需要在意 SCSS 編譯期或執行期差異，走 CSS 變數之後如果之後要做主題切換（例如未來可能的 dark mode）不用改元件程式碼，只要換 `:root` 底下的值 |
| 響應式斷點、grid 欄數 | `$lc-*`（透過 `pc`/`tb`/`sp` mixin） | `@media` 的條件必須是編譯期就能決定的值，CSS 變數不能拿來當 media query 條件 |

簡單記憶：**能用 `var(--lc-*)` 就優先用**，只有「CSS 變數做不到」的情境（Bootstrap 變數、media query 條件、SCSS 運算）才用 `$lc-*`。

## 4. Legacy 相容層存在的原因

專案曾經有一套沒有 `lc-` 前綴的舊變數/mixin 系統，現在的 `abstracts/_variables.scss`（`$lc-*`）已經是唯一的數值來源，但下面三個檔案還留著、還在被引用：

- `app/assets/styles/_variables.scss`：轉出舊變數名稱（`$color-primary`、`$font-family-en`、`$breakpoint-pc`…），**數值全部來自 `abstracts/_variables.scss`，不會有兩份數字**，純粹是給還沒遷移的程式碼一個相容的變數名稱。
- `app/assets/styles/_mixins.scss`：舊版 mixin（`pc`、`tb`、`sp`、`clearfix`、`transition`、`font-ja`…），沒有 `lc-` 前綴。
- `app/assets/styles/_menu.scss`：Menu 的互動樣式，牽動大量動畫時序與 class 狀態（`menu_on`/`menu_off`/`menu_closing`），近期才修過閃爍關閉的問題，暫時不搬動、不重構，降低誤動到動畫時序的風險。

這三個檔案在 `.stylelintrc.json` 裡被明確排除在新的命名規則檢查之外（見第 6 節），**這是刻意的例外，不是遺漏**。

還在使用舊入口（`@use "~/assets/styles/variables"` / `"~/assets/styles/mixins"`）的檔案：

- `app/assets/styles/_mixins.scss`、`app/assets/styles/_menu.scss`（相容層本身，互相引用，維持原樣）
- `app/components/ui/BookingModal.vue`
- `app/components/ui/FloatingCardsHero.vue`
- `app/components/layout/OpeningScreen.vue`
- `app/components/layout/Menu.vue`
- `app/components/layout/MainNav.vue`
- `app/components/layout/Loading.vue`
- `app/components/layout/Footer.vue`
- `app/components/fossil/FossilCard.vue`
- `app/pages/index.vue`

其中 `FloatingCardsHero.vue` 這次有獨立的 scroll/過場行為修正，但它的 `<style>` block 仍保留舊入口，未納入本輪 SCSS token 遷移。

## 5. 新程式碼禁止使用舊入口

任何新增或本次有觸碰到 `<style>` 區塊的 `.vue` 檔，一律：

```scss
// ✅ 新程式碼／本次遷移過的檔案
@use "~/assets/styles/abstracts" as *;
```

```scss
// ❌ 禁止在新程式碼出現
@use "~/assets/styles/variables" as *;
@use "~/assets/styles/mixins" as *;
```

已經改用 `abstracts` 的檔案：`app/components/ui/AuthModal.vue`、`app/components/ui/LoadingSpinner.vue`。

同時，新的顏色/圓角/間距/動畫時間一律用 `var(--lc-*)` 或 `$lc-*`（見第 3 節），不要再寫死 `#fff`、`#666`、`rgb(...)`、固定 px 圓角這類數值——如果數值剛好對得上現有 token（例如 `#666` = `$lc-color-text-muted`、`#ccc` = `$lc-color-gray-mid`、`12px` 圓角 = `$lc-radius-md`），直接換成對應 token；如果專案還沒有對應 token（例如錯誤提示的紅色、Google 登入按鈕的品牌色），先不要亂猜或新增 token，維持原樣並在 PR 說明或這份文件的「待補 token」清單提出。

### 待補 token（本次遷移時發現、刻意不處理）

- 錯誤狀態色：`#b91c1c`（文字）、`#fef2f2`（背景），目前只出現在 `AuthModal.vue`，數量太少不足以判斷是不是要抽成 `$lc-color-danger*`，先觀察。
- Google 登入按鈕品牌色：`#3c4043`、`#dadce0`、SVG 內的 `#4285F4`/`#34A853`/`#FBBC05`/`#EA4335`——這些是 Google 官方品牌色規範，不應該被專案 token 覆蓋，維持寫死。
- `LoadingSpinner.vue` 的 `#f3f3f3`（spinner 底色）跟現有 `$lc-color-gray-light`（`#f5f5f5`）很接近但不是同一個值，沒有直接替換，避免產生肉眼看不太出來但確實存在的視覺差異。

## 6. `.stylelintrc.json` 本次新增的規則

| 規則 | 設定 | 目的 |
| --- | --- | --- |
| `scss/dollar-variable-pattern` | `^lc-[a-z][a-z0-9-]*$`（`ignore: ["local"]`） | SCSS 變數要有 `lc-` 前綴 |
| `scss/at-mixin-pattern` | `^lc-[a-z][a-z0-9-]*$` | 新版 mixin 要有 `lc-` 前綴；legacy/vendor/overrides 透過下方例外放寬 |
| `scss/at-function-pattern` | `^lc-[a-z][a-z0-9-]*$` | 之後如果加 px→rem 這類 function，要有前綴 |
| `scss/no-duplicate-mixins` | `true` | 防止同名 mixin 被定義兩次 |
| `custom-property-pattern` | `^(?:lc|bs)-[a-z][a-z0-9-]*$`，但 `.vue` 檔關掉這條規則 | `:root` 輸出的 `--lc-*`/Bootstrap 的 `--bs-*` 要符合前綴；Vue SFC 常見的區域性 custom property（例如 `FloatingCardsHero.vue` 用 JS 動態寫入的 `--card-blur`）不受此規則限制，避免誤傷 |

**放寬例外**（不受上面新規則檢查）：

```json
"app/assets/styles/_variables.scss",
"app/assets/styles/_mixins.scss",
"app/assets/styles/_menu.scss",
"app/assets/styles/vendors/**/*.scss",
"app/assets/styles/overrides/**/*.scss"
```

這幾個檔案分別是 legacy 相容層（見第 4 節）跟第三方套件變數覆蓋（Bootstrap 要求特定變數名稱，例如 `$spacer`、`$border-radius`，不可能套用 `lc-` 前綴)。

其餘既有規則（`max-nesting-depth`、`selector-class-pattern`、`declaration-no-important` 等）本次未調整，維持原樣。

## 7. 本次刻意不動的範圍

- `Menu.vue`、`MainNav.vue`、`Footer.vue`、`FossilCard.vue`、`ProjectCard.vue`：牽動較廣的版面/互動元件，本次沒有做 token 或 import 遷移。
- `FloatingCardsHero.vue`：本次只補 scroll/過場行為修正與 RAF 清理，未做 `<style>` import/token 遷移。
- 所有既有的 scoped style 都留在原本的元件內，沒有搬到全域 `components/` 層。
- 沒有調整任何視覺設計（顏色、間距、圓角的實際呈現值不變，只是把「寫死的數字」換成「數值相同的 token」）。

## 8. 後續遷移順序建議

依風險由低到高：

1. **`BookingModal.vue`、`FossilCard.vue`**：跟本次遷移的 `AuthModal.vue` 性質類似（獨立 modal/card，不涉及全站互動狀態），可以用同樣的方式換 import + 對得上的 token。
2. **`OpeningScreen.vue`、`Loading.vue`**：有進場動畫，但範圍侷限在自己元件內，遷移時要留意動畫時間（`0.2s`/`0.5s`/`1s`）能不能對應 `$lc-transition-*`。
3. **`index.vue`、`FloatingCardsHero.vue`**：`FloatingCardsHero.vue` 目前有其他人正在修改中的邏輯（滾動/過場行為），等那部分穩定後再處理它的 `<style>` block；`index.vue` 可以先行。
4. **`MainNav.vue`、`Footer.vue`**：全站共用版面，改動前建議先跑過所有頁面確認視覺無誤。
5. **`Menu.vue` / `_menu.scss`**：留到最後。牽動最多動畫時序與狀態 class（`menu_on`/`menu_off`/`menu_closing`），近期才修過閃爍關閉的問題，需要獨立一輪、有回歸測試的時段再處理，不要跟其他遷移混在同一個 PR。

每遷移一批檔案，先跑 `npm run lint:style`，再跑 `npm run typecheck`，確認沒有新增的失敗再進下一批。
