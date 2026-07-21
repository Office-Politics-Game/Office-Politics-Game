## Context

PR #209 已讓登入、驗證與登出 REST 流程使用 officePoliticsAuthToken HttpOnly Cookie，Axios client 也已設定 withCredentials。好友聊天是在該重構前後分支中完成，仍以 authStore.token、REST playerId 與 chat:subscribe payload token 識別玩家，因而同時產生功能回歸與可偽造玩家身分的邊界。

專案共用一條 Socket.IO 連線處理訪客房間、遊戲與會員聊天。修復必須讓 Cookie 隨跨站 Socket 握手送出，並只在聊天訂閱事件驗證會員，不得讓未登入訪客失去其他 Socket 功能。

## Goals / Non-Goals

**Goals:**

- REST 聊天目前玩家身分完全由 HttpOnly Cookie 驗證結果決定。
- chat:subscribe 不接收前端 token，改從 Socket 握手 Cookie 驗證玩家。
- 跨站 Socket.IO 連線正確攜帶 Cookie，並保留重連重新訂閱與對話補載。
- 前端聊天程式與測試符合 authStore 不含 token 的正式契約。
- 未登入或 Cookie 無效的呼叫不得讀取、傳送或訂閱好友聊天。

**Non-Goals:**

- 不為所有 Socket 事件新增全域登入 middleware。
- 不修改訪客房間、遊戲事件 payload 或玩家識別流程。
- 不建立獨立聊天 namespace、第二條 Socket 連線或新的 session 儲存。
- 不修改好友關係、訊息資料表、訊息排序、重試次數或聊天 UI。
- 不修復聊天以外仍使用前端 playerId 的好友 API。

## Decisions

### REST identity is derived from requireAuth

server/src/routes/chatRoutes.js 的 GET 與 POST 路由使用既有 requireAuth。server/src/controllers/chatController.js 從 req.player.id 取得 playerId，只接受 friendId 與 content 等操作資料。src/services/chatApi.js 不再送出 playerId query/body，src/stores/chatStore.js 仍以 authStore.currentPlayer.id 維持本地訊息擁有者狀態，但不把該 ID 當成伺服器授權證明。

替代方案是保留 playerId 並在 Controller 比對 req.player.id；這會維持多餘且容易誤用的身分欄位，因此拒絕。

### Shared auth cookie name and Engine.IO cookie parsing

新增 server/src/constants/auth.js 作為 officePoliticsAuthToken 的單一來源，authController、authMiddleware 與聊天 Socket handler 共用該常數。server/src/socket/index.js 將既有 cookie-parser 掛到 Engine.IO request middleware，使 socket.request.cookies 與 Express req.cookies 使用相同解析方式，不新增套件或自製 Cookie parser。

替代方案是在 chat handler 手動切割 Cookie header；該作法容易錯誤處理編碼、空白與等號，因此拒絕。

### Chat subscription keeps event-level authentication

registerChatHandlers 在每次 chat:subscribe 時從 socket.request.cookies 取得 auth Cookie，呼叫既有 verifyToken，並只加入驗證玩家對應的 chat:player:<playerId>。事件 payload 不含 token 或 playerId。缺少、過期或無效 Cookie 透過既有 acknowledgement error 回覆，且不加入任何聊天 room。

不採用 io.use 全域驗證，因為共用 Socket 仍需支援未登入訪客的房間與遊戲事件。也不建立聊天 namespace，避免本次回歸修復擴張為雙連線生命週期重構。

### Credentialed Socket.IO transport

src/services/socketClient.js 建立 client 時設定 withCredentials: true；server/src/socket/index.js 的 Socket.IO CORS 同時設定明確的 CORS_ORIGIN 與 credentials: true。這讓不同來源的瀏覽器在初始握手與重連時攜帶 HttpOnly Cookie。

### Frontend uses verified player state without token

chatStore 的登入判斷只使用 authStore.isLoggedIn 與 authStore.currentPlayer.id。subscribeRealtime 發送 chat:subscribe 空物件；既有 generation、retry、listener 去重、重連後 loadMessages 與 REST fallback 邏輯維持不變。測試 helper 只建立 currentPlayer、isLoggedIn 與 hasVerifiedToken，不新增臨時 token 欄位。

## Implementation Contract

### Behavior

- 已登入會員進入好友頁後，可透過 Cookie 載入與傳送訊息，並在接收端即時取得 chat:message。
- Socket 重新連線後會以新握手所帶 Cookie 再次訂閱；若已有 selectedFriendId，成功 acknowledgement 後補載該對話。
- 未登入 REST 請求由 requireAuth 回傳 401；未登入 Socket 可繼續使用非聊天事件，但 chat:subscribe 回覆 ok: false 且不加入聊天 room。
- 即時訂閱失敗不阻止 REST 操作；REST 本身仍需通過 Cookie 驗證。

### Interface and data shapes

- GET /api/chats/direct/:friendId/messages：不需要 playerId query；目前玩家來自 req.player.id。
- POST /api/chats/direct/:friendId/messages：body 僅需要 content；目前玩家來自 req.player.id。
- chat:subscribe payload：空物件。成功 acknowledgement 維持 { ok: true, data: { playerId } }；失敗維持 { ok: false, error: { message } }。
- Auth Cookie 名稱固定為 officePoliticsAuthToken，前端 JavaScript 不讀取該值。

### Failure modes

- req.player.id、friendId 或 content 不合法時沿用 Controller 的 400 回應。
- Cookie 缺少或 verifyToken 拒絕時，REST 使用既有 requireAuth 401 行為；Socket 回覆驗證錯誤且不變更 chatPlayerId。
- Socket 推播不可用時，既有 REST 寫入成功回應仍維持成功。

### Acceptance criteria

- server/tests/chatController.test.js 驗證 Controller 使用 req.player.id 且忽略 body/query playerId。
- server/tests/chatSocket.test.js 驗證有效、缺少與無效握手 Cookie，以及 Socket credential CORS/解析接線。
- tests/friend-chat-realtime.test.mjs 驗證不建立 authStore.token、chat:subscribe payload 為空物件、重連訂閱與補載不回歸。
- tests/friend-api-integration.test.mjs 驗證聊天 REST wrapper 不傳 playerId。
- node tests/friend-chat-realtime.test.mjs、node tests/friend-api-integration.test.mjs、聊天與驗證相關的後端目標測試，以及根目錄 npm run build 全部退出碼為 0。server 目錄 npm test 仍須完整重跑，確認沒有新增本變更範圍內的失敗；既有非聊天基線失敗需如實記錄。
- 全專案搜尋 authStore.token、chat:subscribe token payload 與 gameAuthToken 在聊天相關檔案中無匹配。

### Scope boundaries

- In scope: 聊天 REST route/controller/client/store、共用 Socket.IO credential 設定、聊天事件握手 Cookie 驗證、共用 auth Cookie 名稱、相關測試。
- Out of scope: 全域 Socket auth、訪客與遊戲事件授權重構、好友 API playerId 契約、資料庫 migration、聊天 UI 與訊息資料模型。

## Risks / Trade-offs

- [Risk] Socket Cookie 來自目前連線的握手快照，Cookie 更新需等下一次連線才反映。→ Mitigation: 聊天在已驗證會員進入好友頁時啟動，既有 reconnect 流程會建立新握手並重新訂閱；登出或離開好友頁會停止聊天 listener 並取消訂閱。
- [Risk] credentialed CORS 若搭配萬用字元 origin 會被瀏覽器拒絕。→ Mitigation: 延用部署必填的具體 CORS_ORIGIN，不設定萬用字元。
- [Risk] 將聊天 REST 改為 req.player.id 會破壞仍送 playerId 的舊 client 假設。→ Mitigation: 同一變更同步更新唯一的 src/services/chatApi.js 呼叫端與回歸測試；額外 playerId 即使存在也不參與授權。
- [Risk] Engine.IO cookie parser 會在共用連線解析 Cookie。→ Mitigation: parser 只填入 request.cookies，不拒絕連線；會員驗證仍只在 chat:subscribe 執行。

## Migration Plan

- 不需要資料庫 migration、環境變數新增或套件安裝。
- 前後端需同一版本部署，因為 chat:subscribe 與聊天 REST 的 playerId 契約同步移除。
- 回滾時同時回滾前後端；資料庫內容不受影響。

## Open Questions

- none
