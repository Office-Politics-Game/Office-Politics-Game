## Why

好友私訊後端已完成 REST 基礎，但好友頁仍顯示聊天尚未串接，玩家目前無法在前端讀取或送出好友私訊。這次先補上最小可用的前端串接，讓既有後端能力可以被實際使用。

## What Changes

- 新增前端聊天 API wrapper，呼叫既有好友私訊 REST endpoints。
- 新增獨立的 Pinia 聊天狀態管理，負責訊息列表、載入、送出與錯誤狀態。
- 新增好友聊天面板，顯示聊天紀錄並提供文字輸入與送出。
- 修改好友頁右側內容，選擇好友後顯示聊天面板，未選擇好友時保留空狀態。
- 更新前端整合測試，確認好友私訊前端 MVP 已接上真實 API wrapper 與 store。

## Non-Goals

- 不加入 Socket.IO 即時推播。
- 不加入未讀數、已讀狀態或 typing 狀態。
- 不加入訊息分頁、圖片、貼圖、附件、群聊、房間聊天或遊戲內聊天。
- 不修改既有後端聊天 API 契約。
- 不進行第二階段 UI 細節拋光，例如最後一則訊息摘要或完整手機聊天體驗強化。

## Capabilities

### New Capabilities

- friend-direct-chat-frontend: Defines the frontend REST MVP for loading and sending direct friend chat messages from the friend page.

### Modified Capabilities

(none)

## Impact

- Affected specs: friend-direct-chat-frontend
- Affected code:
  - New: src/services/chatApi.js
  - New: src/stores/chatStore.js
  - New: src/components/friend/FriendChatPanel.vue
  - Modified: src/views/FriendView.vue
  - Modified: tests/friend-api-integration.test.mjs
  - Removed: none
