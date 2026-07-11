## Why

目前好友私訊只能透過 REST 載入與送出，接收方必須重新整理或重新載入紀錄才能看到新訊息。現在需要在不改變既有 REST 驗證與儲存契約的前提下，加入具身分驗證、可重連且不重複顯示的即時推播能力；同時修正訊息增加後聊天面板被撐高、輸入區離開可視範圍的版面問題。

## What Changes

- 新增好友聊天 Socket 訂閱與取消訂閱事件，使用登入 token 驗證玩家並加入個人聊天房間。
- 保留既有 REST 訊息送出流程，在訊息成功儲存後向接收者推送 chat:message。
- 擴充前端聊天狀態，處理即時訊息、依訊息 ID 去重、重連後重新訂閱與補載目前對話。
- 登出或清除聊天資料時移除聊天 listener 與訂閱狀態。
- 新增後端 Socket 權限、REST 推播與前端重連／合併行為的測試。
- 限制好友聊天面板高度，讓標題與輸入區固定、只有訊息內容區垂直捲動。
- 將訊息泡泡調整為窄版方形比例，依訊息方向加入左右 CSS 三角尾巴。

## Capabilities

### New Capabilities

- `friend-direct-chat-realtime`: Defines authenticated Socket.IO subscription, REST-triggered direct-message delivery, client-side conversation synchronization, deduplication, and reconnect recovery.

### Modified Capabilities

(none)

## Impact

- Affected specs: friend-direct-chat-realtime
- Affected code:
  - New:
    - server/src/socket/chatHandlers.js
    - server/tests/chatSocket.test.js
    - tests/friend-chat-realtime.test.mjs
    - tests/friend-chat-layout.test.mjs
  - Modified:
    - server/src/socket/index.js
    - server/src/controllers/chatController.js
    - server/tests/chatController.test.js
    - src/stores/chatStore.js
    - src/views/FriendView.vue
    - src/components/friend/FriendChatPanel.vue
  - Removed: none
- Affected APIs:
  - New Socket events: chat:subscribe, chat:unsubscribe, chat:message
  - Existing REST endpoint remains unchanged: POST /api/chats/direct/:friendId/messages
- Dependencies: no new package dependencies
