# 好友聊天訊息對齊與配色設計

## 目標

修正好友聊天訊息泡泡的視覺歸屬，讓本人發出的訊息靠右顯示，對方傳入的訊息靠左顯示，並以專案既有品牌色區分雙方。

## 視覺規則

- 本人訊息使用右側對齊，泡泡箭頭朝右。
- 本人訊息底色使用 `--brand-primary`（`#86B3E0`），文字使用 `--brand-navy`，確保清楚對比。
- 對方訊息使用左側對齊，泡泡箭頭朝左。
- 對方訊息使用白色底、`--gray-100` 邊框及 `--brand-active` 文字。
- 作者名稱與訊息時間跟隨各自訊息泡泡對齊。
- 保留現有 Square UI 方形泡泡、陰影、最大寬度及響應式規則。

## 實作範圍

只調整 `src/components/friend/FriendChatPanel.vue` 的 scoped CSS，不修改訊息資料、本人身分判定、即時聊天流程或 API 契約。

需要同步調整泡泡外框與內層箭頭顏色，避免箭頭仍顯示舊方向或舊底色。

## 驗證

- 更新 `tests/friend-chat-layout.test.mjs`，先以失敗案例鎖定本人靠右、對方靠左及雙方底色。
- 驗證本人箭頭位於右側且使用品牌藍，對方箭頭位於左側且使用白色。
- 執行 `node tests/friend-chat-layout.test.mjs`。
- 執行 `npm run build`，確認 Vue 與 Tailwind 樣式可正常建置。

## 非目標

- 不修改聊天內容、作者名稱或時間格式。
- 不新增圓角、動畫或新的訊息泡泡元件。
- 不變更聊天 REST、Socket.IO、Pinia store 或資料庫。
