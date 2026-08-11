# QA 互動體感報告（臨時）

> **臨時文件：相關問題修完並驗證後即可刪除本檔。**  
> 勿當成長期架構文件。正式維護說明請看 [maintenance.md](./maintenance.md)。

- 測試日：2026-08-11
- Commit：`67ca4bb chore: remove legacy Firebase references`
- Dev URL：`http://localhost:3001/`（本機 3000 已被占用）
- 測試方式：Playwright Chromium 實際操作（點擊、捲動、開關選單、收藏、進詳情）

---

## 結論

**有問題。** 資料流與大多數頁面功能可用，但 **Menu 點擊** 與 **首頁 scroll** 的體感明顯怪異，容易被使用者解讀成「壞掉」或「沒反應」。

### 優先修這三個

1. **開場動畫擋住 Menu 熱區約 6 秒**，真實滑鼠點不到漢堡鈕；程式化 click 卻仍可能把 menu 打開在遮罩底下。
2. **Menu 開關有 `menu_stop` 鎖定（開 2s／關 1s）**，連點會被靜默忽略，體感像點了沒反應。
3. **首頁無限捲動每次多等約 1.2s**，加上 hero 大段 scroll／打字機，整體捲動節奏很怪。

---

## 體驗問題（這次實際操作確認）

### M1. 開場動畫期間 Menu 點不到（High）

- 路徑：`/`
- 操作：首頁剛載入（約前 5–6 秒）去點右上角 Menu
- 實際：
  - `elementFromPoint` 打到的是 `.opening-screen__inner`（`z-index: 9999`、`pointer-events: auto`）
  - 真實 pointer 點不到 `.menu_link`
  - 若用 JS 直接 `.menu_link.click()`，menu 仍會在遮罩底下進入 `menu_on + menu_stop`
- 預期：開場期間要嘛禁用 Menu，要嘛開場不攔截 header 點擊；不該出現「點了沒反應」或「遮罩結束後突然選單已開」
- 可能原因：`OpeningScreen.vue` 全螢幕遮罩 + `DURATION = 5000` + fade 1s；`MainNav.toggleMenu` 不檢查 opening 狀態
- 建議修法：
  - 開場期間 `pointer-events: none` 給 header 以外區域即可，或 header 提高 z-index 且可點
  - 開場中忽略 `toggleMenu`
  - 縮短開場或提供 skip
- 嚴重程度：**High**（體感）

### M2. Menu 開關被 `menu_stop` 鎖住（High）

- 路徑：全站（`MainNav.vue`）
- 操作：打開 Menu 後立刻再點關閉；或關閉後立刻再開
- 實際：
  - 開啟後 `.wrap` 帶 `menu_stop` **約 2 秒**，期間再點無效
  - 關閉後 `menu_stop` **約 1 秒**，期間再開無效
  - 使用者連點會覺得「選單壞了」
- 預期：動畫可播，但輸入不該被吞這麼久；至少要有可感知的過渡，而不是無回饋
- 可能原因：`toggleMenu` / `closeMenu` 開頭 `if (wrap.classList.contains("menu_stop")) return;`
- 建議修法：縮短 lock、改成佇列「動畫結束後執行最後一次意圖」、或允許 close 打斷 open
- 嚴重程度：**High**（體感）

### M3. `.wrap { overflow: hidden auto }` 與真實捲動容器不一致（Medium）

- 路徑：`/`、`/portfolio` 等
- 操作：檢查誰在捲動
- 實際：
  - `.wrap` 的 `scrollHeight === clientHeight`，`wrap.scrollTop` 幾乎永遠是 `0`
  - 真正捲動的是 **`window` / `documentElement`**
  - CSS 寫了 wrap 可捲，實際行為卻是整頁 window scroll，增加除錯與體感混亂
- 預期：捲動容器要單一且明確（要嘛 window，要嘛 wrap）
- 可能原因：`.wrap` 高度隨內容撐開，overflow 規則形同虛設
- 建議修法：若要用 window scroll，拿掉 wrap 的 overflow scroll；若要用 wrap scroll，給 wrap 固定視窗高度（如 `100dvh`）並讓內部滾
- 嚴重程度：**Medium**

### M4. 首頁 hero／quote 依賴 window scroll，節奏怪異（Medium）

- 路徑：`/`
- 操作：上下捲動首頁
- 實際：
  - `hero-quote-parent` 約 `min-height: 200vh`，背景依 `useWindowScroll()` 黑→白
  - quote 打字機在「捲到區塊」後觸發；快速上下捲時背景與文字狀態跳動感強
  - 圖鑑區要捲過一大段 hero/quote 才到
- 預期：捲動進度與視覺變化可預期，不要為了效果製造「空轉捲動」
- 可能原因：大段 spacer + scroll-driven JS（非 CSS sticky 單一節奏）
- 建議修法：縮短 hero/quote 佔高、打字機只播一次且不倒退、背景過渡用 CSS 較穩的方式
- 嚴重程度：**Medium**

### M5. 無限捲動刻意延遲 800ms + 400ms（Medium）

- 路徑：`/`
- 操作：捲到圖鑑底部載入更多
- 實際：window scroll 可觸發載入（12→24→31），但每次 `onInfiniteLoad` 人工等待約 1.2s，體感卡頓
- 預期：有 loading 即可，不需額外睡 1.2 秒
- 可能原因：`index.vue` 註解寫「強化停留感」
- 建議修法：刪除或大幅縮短 `promiseTimeout`
- 嚴重程度：**Medium**

### M6. 首頁每次進入隨機排序（Low）

- 路徑：`/`
- 操作：點卡片進詳情再返回
- 實際：`data.sort(() => Math.random() - 0.5)`，原卡片常不在首批 12 筆
- 預期：返回後仍看得到剛瀏覽的項目，或排序穩定
- 建議修法：固定排序，或 session 記住順序／scroll
- 嚴重程度：**Low**（但會被誤認成收藏／狀態 bug）

---

## 功能／資料問題

### F1. 活動 `capacity: 0` 導致無法報名（Medium）

- 路徑：`/events`
- 實際：`0 / 0 registered`、`名額已滿`，沒有報名按鈕
- 原因：`data/mock/events.json` 的 `capacity: 0`
- 建議：改合理容量後重新 seed；前端可對異常容量給明確提示
- 嚴重程度：**Medium**

### F2. `/collection` hydration mismatch（Medium）

- 路徑：`/collection`
- 實際：localStorage 已有收藏時，console 出現 `Hydration completed but contains mismatches.`
- 原因：SSR 當空收藏渲染，client 再灌 localStorage
- 建議：列表包 `ClientOnly`，或 SSR 固定空殼、掛載後再載
- 嚴重程度：**Medium**

---

## 已確認正常的流程

| 項目 | 結果 |
| --- | --- |
| 首頁化石卡與圖片 | 正常 |
| 愛心收藏／快速連點與 localStorage | 一致 |
| 點卡進物種詳情 | 正常 |
| 收藏頁顯示、reload、取消、空狀態 | 正常（忽略 hydration 警告時） |
| 作品集列表／詳情／下一筆 | 正常 |
| 物種國家切換（如 Morocco／Russia） | 正常 |
| 登入停用 | UI 顯示「資料庫維護中…」，無 Google popup |

---

## 建議修復順序

1. **M1** 開場遮罩 vs Menu 點擊  
2. **M2** `menu_stop` 鎖定策略  
3. **M5** 拿掉無限捲動人工延遲  
4. **M3／M4** 統一捲動容器與縮短 hero 空轉  
5. **F1** events capacity  
6. **F2** collection hydration  
7. **M6** 首頁排序

一題一個小 commit，不要跟大型重構混在一起。

---

## 刪除條件

當下列項目都驗證完畢，即可刪除本文件，並從 [README.md](./README.md) 拿掉連結：

- [ ] Menu 在開場期間行為可預期（可點或明確不可點）
- [ ] Menu 連點不再被長時間靜默忽略
- [ ] 首頁捲動節奏可接受（無多餘 1.2s 載入睡眠；hero 空轉可接受）
- [ ] `/events` 可走完報名 UI（或刻意關閉並有說明）
- [ ] `/collection` 無 hydration mismatch
