## 1. REST Cookie 身分回歸

- [x] 1.1 先在 server/tests/chatController.test.js 新增 Cookie-authenticated direct-chat REST identity 回歸案例，證明 Controller 必須使用 req.player.id、忽略 query/body playerId，並以原始實作執行 npm test -- --runInBand server/tests/chatController.test.js 時得到預期失敗。
- [x] 1.2 實作 REST identity is derived from requireAuth：server/src/routes/chatRoutes.js 的兩個聊天路由均先執行 requireAuth，server/src/controllers/chatController.js 只把 req.player.id 傳給 service；以 npm test -- --runInBand server/tests/chatController.test.js 驗證有效 Cookie 身分可載入及送出、偽造 playerId 不生效、未驗證請求不進入 Controller。

## 2. Socket Cookie 訂閱驗證

- [x] 2.1 先在 server/tests/chatSocket.test.js 新增 Credentialed Socket transport with chat event authentication 回歸案例，覆蓋有效 socket.request.cookies、缺少或無效 Cookie、payload token/playerId 被忽略、訪客仍完成 room/game handler 接線，並以 npm test -- --runInBand server/tests/chatSocket.test.js 確認原始實作因仍讀 payload.token 與缺少 credential 設定而失敗。
- [x] 2.2 實作 Shared auth cookie name and Engine.IO cookie parsing：新增 server/src/constants/auth.js，讓 authController、authMiddleware 與 chatHandlers 共用 officePoliticsAuthToken，並在 Engine.IO request middleware 使用 cookie-parser；以 server/tests/authController.test.js、server/tests/authMiddleware.test.js 與 server/tests/chatSocket.test.js 驗證 Cookie 名稱一致且 parser 不建立全域登入門檻。
- [x] 2.3 實作 Credentialed Socket.IO transport 與 Chat subscription keeps event-level authentication：src/services/socketClient.js 設定 withCredentials: true，server/src/socket/index.js 設定 CORS credentials: true，chat:subscribe 從握手 Cookie 呼叫 verifyToken 並忽略 payload 身分；以 npm test -- --runInBand server/tests/chatSocket.test.js 驗證只加入驗證玩家 room，未登入 socket 只被拒絕聊天訂閱。

## 3. 前端 tokenless 聊天契約

- [x] 3.1 先更新 tests/friend-chat-realtime.test.mjs 與 tests/friend-api-integration.test.mjs，建立 Tokenless frontend chat authentication contract 與 Cookie-authenticated reconnect recovery 回歸案例：測試 helper 不注入 authStore.token、chat:subscribe payload 必須是空物件、REST wrapper 不得傳 playerId、重連仍補載 selectedFriendId；分別執行 node tests/friend-chat-realtime.test.mjs 與 node tests/friend-api-integration.test.mjs 確認原始實作得到預期失敗。
- [x] 3.2 實作 Frontend uses verified player state without token：src/stores/chatStore.js 只檢查 isLoggedIn/currentPlayer.id、以空物件訂閱並保留既有 generation/retry/recovery，src/services/chatApi.js 移除 playerId query/body；以兩個前端回歸腳本驗證載入、送出、重連與 REST fallback 契約。

## 4. 完整驗證與範圍檢查

- [x] 4.1 依 Behavior、Interface and data shapes、Failure modes、Acceptance criteria、Scope boundaries 逐項驗證：執行 node tests/friend-chat-realtime.test.mjs、node tests/friend-api-integration.test.mjs、聊天與驗證相關的後端目標測試、server 目錄完整 npm test、根目錄 npm run build，並以 rg 搜尋聊天相關 authStore.token、chat:subscribe token payload 與 client playerId；目標測試與 build 必須退出碼為 0、搜尋無舊契約匹配，完整後端測試須確認未新增本次範圍失敗並記錄既有非聊天基線失敗。
