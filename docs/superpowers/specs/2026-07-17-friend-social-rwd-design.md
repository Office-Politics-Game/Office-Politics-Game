# 好友系統社交頁 RWD 設計

## Issue 標題

`feat(friend): 建立社交頁雙尺寸橫向 RWD 畫布`

## 背景

目前 `/friend` 社交頁使用 `vw`、`vh`、百分比尺寸、`md` breakpoint，以及窄畫面上下堆疊版面。這些做法與專案 Square UI 規範不一致：遊戲介面只支援橫向，僅允許 `< 1024px` 與 `>= 1024px` 兩檔固定畫布，viewport 小於畫布時應整體等比例縮放，而不是個別元件重排。

社交頁已包含好友列表、好友邀請、玩家搜尋、封鎖名單與好友聊天。本任務只調整 `/friend` 的顯示與版面行為，不變更任何好友或聊天功能。

## 目標

- 將 `/friend` 改為符合 Square UI 規範的雙尺寸橫向固定畫布。
- 在不同橫向 viewport 中維持左側社交功能區與右側聊天區的穩定雙欄結構。
- viewport 小於設計畫布時等比例縮放整張畫布，避免個別區塊壓縮、換行重排或超出可視範圍。
- 保留所有既有好友與聊天互動、狀態與資料流程。

## 設計方案

### 畫布與縮放

- `/friend` 外層維持全螢幕背景，社交畫布在 viewport 中水平與垂直置中。
- viewport 寬度 `< 1024px` 時使用 `960 x 540px` 小型橫向畫布。
- viewport 寬度 `>= 1024px` 時使用 `1280 x 720px` 標準橫向畫布。
- 當 viewport 的可用寬度或高度小於目前畫布時，以 `min(可用寬度 / 畫布寬度, 可用高度 / 畫布高度, 1)` 計算整體縮放比例。
- 縮放只套用在完整社交畫布，不以 `vw`、`vh`、百分比或 `clamp()` 個別縮放內部元件。
- viewport 大於目前畫布時，畫布維持原尺寸且不放大，多餘空間由頁面背景填滿。
- 直向 viewport 沿用 `src/components/common/RotateDeviceNotice.vue`，不建立直向重排版面。

縮放計算保留在 `src/views/FriendView.vue` 的頁面層級。這能將改動限定在 `/friend`，避免為單一頁面提前建立全站畫布系統。

### 固定版面

小型橫向畫布：

- 畫布：`960 x 540px`
- 安全距離：`10px`
- 主面板：`920 x 520px`
- 左側社交功能區：`340px`
- 右側聊天區：`580px`

標準橫向畫布：

- 畫布：`1280 x 720px`
- 安全距離：`16px`
- 主面板：`1180 x 688px`
- 左側社交功能區：`420px`
- 右側聊天區：`760px`

兩種畫布都維持左右雙欄，不切換為上下排列。四個社交分頁固定顯示在左欄頂部，不依賴橫向捲動才能操作。

### 捲動與內容邊界

- 好友列表、好友邀請、玩家搜尋結果及封鎖名單只在各自內容容器內垂直捲動。
- 聊天工具列與輸入區固定可見，只有訊息紀錄區垂直捲動。
- 長好友名稱、玩家 ID 與狀態文字使用安全截斷，不得改變欄寬。
- 長聊天訊息在訊息泡泡內換行，不得造成頁面級水平捲動。
- 登入限制、載入中、空資料、錯誤與處理中狀態皆須留在所屬面板內，不得撐破固定畫布。

### 視覺與互動

- 沿用既有 Square UI 方形設計，不新增圓角卡片、膠囊按鈕或圓形主要控制項。
- 色彩沿用既有專案 token。
- 小型與標準橫向畫布分別使用專案定義的兩組固定字級。
- 互動元件保留 default、hover、active、focus-visible 與 disabled 狀態。
- 鍵盤焦點環不得被固定容器或 overflow 邊界裁切。
- 保留既有進場、返回大廳與 reduced-motion 行為。

## 資料與錯誤處理

本任務不修改資料流或錯誤規則。`friendStore`、`chatStore`、API 與 Socket 行為維持不變；現有載入、空資料、錯誤、重新連線與處理中狀態只做版面適配。

## 預計影響範圍

主要修改：

- `src/views/FriendView.vue`
- `src/components/friend/FriendChatPanel.vue`
- `src/components/friend/FriendList.vue`
- `src/components/friend/FriendItem.vue`
- `src/components/friend/AddFriendForm.vue`
- `src/components/friend/FriendRequestList.vue`
- `src/components/friend/BlockedPlayerList.vue`

測試：

- 更新 `tests/friend-chat-layout.test.mjs`
- 新增 `tests/friend-social-rwd.test.mjs`

實作時只修改確實需要適配固定畫布的好友元件；不得藉此重構無關程式碼。

## 驗收條件

- [ ] `960 x 540px` viewport 顯示完整小型橫向畫布，沒有頁面級水平或垂直溢出。
- [ ] `1280 x 720px` viewport 顯示完整標準橫向畫布，沒有頁面級水平或垂直溢出。
- [ ] 小於 `960 x 540px` 的橫向 viewport 會等比例縮小完整畫布，左右欄比例與內部固定尺寸不變。
- [ ] 大於設計畫布的 viewport 不會放大畫布，背景延伸且畫布保持水平、垂直置中。
- [ ] 直向 viewport 顯示既有旋轉裝置提示，不顯示社交頁直向重排版面。
- [ ] 兩種畫布皆維持左側社交功能區與右側聊天區，不切換為上下排列。
- [ ] 好友列表、邀請、加入好友、封鎖與聊天訊息的長內容不會撐破欄位或產生頁面級捲動。
- [ ] 聊天工具列與輸入區固定可見，長對話只捲動訊息紀錄區。
- [ ] 四個社交分頁、好友操作、聊天輸入與返回大廳按鈕均可操作。
- [ ] 所有互動元件的 focus-visible 樣式完整可見，且保留 disabled 狀態。
- [ ] 原有好友、邀請、搜尋、封鎖、聊天、Realtime 與返回大廳行為沒有變更。
- [ ] 頁面及相關好友元件不以 `vw`、`vh`、`clamp()`、第三組 breakpoint 或 `width: 100%` 規避固定尺寸規格；文字內容區的必要填滿與內部排版不視為畫布尺寸規避。

## 驗證方式

- `node tests/friend-chat-layout.test.mjs`
- `node tests/friend-social-rwd.test.mjs`
- `npm run build`
- 瀏覽器人工驗證：`960 x 540`、`1280 x 720`、小於 `960 x 540` 的橫向 viewport，以及任一代表性直向 viewport。

## 非目標

- 不修改 `FriendPanel` 側邊好友面板。
- 不修改好友、邀請、搜尋、封鎖或聊天的 API 契約。
- 不修改 Pinia store、Socket 事件、路由、後端或資料庫。
- 不新增手機直向版面。
- 不建立全站共用固定畫布系統。
- 不新增未讀數、已讀狀態、typing、附件、群聊或其他社交功能。

## 風險與控制

- 固定畫布縮放可能讓低解析度裝置上的文字變小；此行為符合專案橫向固定畫布規範，且不以局部重排破壞操作結構。
- 目前社交元件部分樣式使用 `w-full`、百分比訊息寬度及非專案色彩。實作時只調整會違反畫布或驗收條件的用法，避免把視覺全面重構混入本任務。
- 既有 `tests/friend-chat-layout.test.mjs` 綁定目前 `md` 重排 class；實作需先更新測試契約，再移除舊版面依賴。
