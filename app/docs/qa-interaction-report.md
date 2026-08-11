# QA 互動體感報告（臨時）

> **臨時文件：相關問題修完並驗證後即可刪除本檔。**  
> 勿當成長期架構文件。正式維護說明請看 [maintenance.md](./maintenance.md)。

- 測試日：2026-08-11
- 基準 Commit：`67ca4bb`
- Dev URL：`http://localhost:3001/`（本機 3000 已被占用）
- 測試方式：Playwright Chromium 實際操作（點擊、捲動、開關選單）

---

## 結論

使用者回報的重點不是「刻意 loading 延遲」，而是：

1. **第一次點擊失效**
2. **點了像閃退／被彈回去**

這兩類比人工 `promiseTimeout` 嚴重得多。已對 Menu／開場遮罩、events／collection、以及首頁 hero 佔高做對應修復。

### 優先順序（更新後）

1. ~~開場動畫擋住 Menu／第一次點失效~~ → **已修**
2. ~~Menu 關閉 timeout 殘留導致打開後閃退~~ → **已修**
3. ~~`menu_stop` 長時間吞點~~ → **已縮短／關閉可強制**
4. ~~首頁 scroll 節奏（hero 空轉）~~ → **最小修法已套用**；無限載入延遲仍可選
5. ~~`/events` capacity~~ → **已修**；~~`/collection` hydration~~ → **已修**

---

## 已修復

### M1. 開場動畫吞掉第一次點擊 — Fixed

- 原因：`OpeningScreen` `z-index: 9999` + `pointer-events: auto`，蓋住 header 約 6 秒
- 修法：開場改為 `pointer-events: none`（純視覺，不攔截 Menu／Logo）

### M2. Menu 打開後閃退 — Fixed

- 原因：`closeMenu` 的 `setTimeout(~1500ms)` 會在使用者重新打開後仍執行 `menu.classList.add("none")`
- 修法：所有 menu timer 可取消；用 `menuGeneration` 忽略過期回呼；`toggle`／路由關閉用 `closeMenu(true)`

### M3. 連點無反應（長 `menu_stop`）— Fixed（部分）

- 原因：開鎖 2s／關鎖 1s，期間 `return` 靜默忽略
- 修法：開啟只短鎖 ~450ms；使用者關閉與路由關閉強制執行

### F1. 活動 `capacity: 0`（Medium）— Fixed

- 原因：`registeredCount >= capacity` 在 `capacity: 0` 時永遠為真；mock／schema 預設也是 0
- 修法：mock／產生腳本／schema 預設改為 20；`capacity <= 0` 不擋報名；登入停用時直接開表單並允許 guest（`uid: null`）

### F2. `/collection` hydration mismatch（Medium）— Fixed

- 原因：SSR 收藏為空、client 從 localStorage 讀出，導致 grid 內容不一致
- 修法：`FossilGrid` 包在 `<ClientOnly>`，fallback 顯示載入文案，避免 hydration mismatch

### S2. 首頁 hero／quote 空轉感（Medium）— Fixed（最小）

- 原因：`hero-quote-parent` `min-height: 200vh`，背景黑→白過渡佔了過多空白捲動
- 修法：改為 `140vh`（保留 scroll 過渡空間，不改動畫系統／打字機／無限載入延遲）

---

## 仍待處理的體驗問題（低優先／可選）

### S1. `.wrap` overflow 與 window scroll 不一致（Medium）

- `.wrap { overflow: hidden auto }` 但實際多半是 window 在滾
- 建議：統一捲動容器

### S3. 無限捲動人工延遲 800ms+400ms（Low／可選）

- 使用者已說明這不是主訴；可之後再收

### S4. 首頁隨機排序（Low）

- 返回後原卡常不在首批 12 筆

---

## 已確認正常的流程

| 項目 | 結果 |
| --- | --- |
| 首頁化石卡與圖片 | 正常 |
| 愛心收藏／連點與 localStorage | 一致 |
| 點卡進物種詳情 | 正常 |
| 收藏頁 CRUD／空狀態 | 正常 |
| 作品集列表／詳情／下一筆 | 正常 |
| 登入停用文案 | 正常、無 Google popup |

---

## 刪除條件

- [x] Menu 第一次點擊不再被開場遮罩吃掉
- [x] Menu 不再因過期 timeout 閃退
- [x] Menu 連點不再被 1–2 秒靜默忽略
- [x] 首頁捲動節奏可接受
- [x] `/events` 可走報名 UI（或明確關閉）
- [x] `/collection` 無 hydration mismatch

以上勾項都完成後，可刪除本檔並從 [README.md](./README.md) 移除連結（S1／S3／S4 為可選後續，不擋刪除）。
