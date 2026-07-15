## Why

PR #209 將登入狀態改為 HttpOnly Cookie 並移除前端 token，但好友聊天仍依賴舊 token 契約，造成已登入玩家無法載入、傳送或即時接收訊息。聊天 REST 目前也仍信任前端 playerId，因此需要讓聊天身分完整回歸伺服器驗證的 Cookie 契約。

## What Changes

- 好友聊天前端不再讀取 authStore.token，也不在 chat:subscribe、歷史查詢或訊息送出請求中傳送 token 或 playerId。
- 聊天 REST 路由套用既有 HttpOnly Cookie 驗證 middleware，Controller 僅使用驗證後的 req.player.id 作為目前玩家身分。
- Socket.IO client 跨站連線攜帶 Cookie，伺服器允許 credentialed CORS 並解析 Engine.IO 握手 Cookie。
- chat:subscribe 保留事件層級驗證：從握手 Cookie 取得 token、透過既有 auth service 驗證玩家，只加入驗證身分對應的聊天房間。
- 保留訪客房間與遊戲 Socket 的既有連線能力，不新增全域 Socket 登入門檻。
- 更新前後端聊天測試，移除人工建立 authStore.token 的舊測試契約，覆蓋未登入拒絕、重連重新訂閱與目前對話補載。

## Capabilities

### New Capabilities

- `friend-chat-cookie-auth`: 定義好友聊天 REST 與 Socket.IO 使用 HttpOnly Cookie 驗證、前端不暴露 token，以及重連恢復的安全契約。

### Modified Capabilities

(none)

## Impact

- Affected specs: friend-chat-cookie-auth
- Affected code:
  - New:
    - server/src/constants/auth.js
  - Modified:
    - src/stores/chatStore.js
    - src/services/chatApi.js
    - src/services/socketClient.js
    - tests/friend-chat-realtime.test.mjs
    - tests/friend-api-integration.test.mjs
    - server/src/controllers/authController.js
    - server/src/middlewares/authMiddleware.js
    - server/src/routes/chatRoutes.js
    - server/src/controllers/chatController.js
    - server/src/socket/index.js
    - server/src/socket/chatHandlers.js
    - server/tests/chatController.test.js
    - server/tests/chatSocket.test.js
  - Removed: none
- Affected APIs:
  - GET /api/chats/direct/:friendId/messages 不再接受 playerId query 作為身分來源。
  - POST /api/chats/direct/:friendId/messages 不再接受 playerId body 作為身分來源。
  - chat:subscribe 不再接受或需要 token payload。
- Dependencies: 不新增套件，沿用 cookie-parser、Socket.IO 與既有 auth service。
