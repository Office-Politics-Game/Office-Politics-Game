## Context

後端 change add-friend-direct-chat-backend 已完成好友私訊 REST MVP，提供讀取歷史訊息與送出訊息的 API，並在服務層處理好友關係、封鎖與空訊息驗證。前端好友頁目前已串接好友列表、好友邀請與封鎖流程，但右側仍顯示好友資料與「好友聊天尚未串接」提示，沒有聊天 API wrapper、Pinia chat store 或聊天面板。

## Goals / Non-Goals

**Goals:**

- 讓登入玩家在好友頁選擇好友後可以讀取該好友的歷史私訊。
- 讓登入玩家可以輸入文字並送出好友私訊。
- 將聊天 API 與聊天狀態放在獨立模組，避免 friendStore 承擔更多職責。
- 以現有 Square UI 方形風格建立最小可用的聊天面板。
- 以現有 tests/friend-api-integration.test.mjs 驗證前端串接存在且移除未串接提示。

**Non-Goals:**

- 不加入 Socket.IO 即時推播。
- 不加入未讀數、已讀狀態、typing 狀態或最後一則訊息摘要。
- 不加入訊息分頁、附件、貼圖、群聊、房間聊天或遊戲內聊天。
- 不修改後端聊天 API、資料表或服務規則。
- 不重構既有好友邀請、搜尋、封鎖流程。

## Decisions

### Keep direct chat API access in a dedicated chatApi module

新增 src/services/chatApi.js，沿用現有 apiClient 封裝錯誤與 base URL。chatApi 只負責把前端呼叫轉換成既有 REST contract：GET /chats/direct/:friendId/messages 帶 playerId query，POST /chats/direct/:friendId/messages 帶 playerId 與 content body。

Alternative considered: 把聊天 API 加進 src/services/friendApi.js。此做法被排除，因為 friendApi 已涵蓋好友關係管理；聊天訊息是不同資源，分開後後續加入 Socket 或訊息分頁時邊界更清楚。

### Keep message state in a dedicated chatStore

新增 src/stores/chatStore.js，管理 conversation by friendId、selected loading、sending、error 與目前玩家檢查。friendStore 繼續只管理好友關係資料，FriendView 透過 selectedFriend 把 friendId 傳給聊天面板。

Alternative considered: 直接把 messages、sendMessage、loadMessages 放進 friendStore。此做法被排除，因為 friendStore 已經包含邀請、搜尋、封鎖與好友關係操作，加入聊天狀態會讓單一 store 過重，也讓後續 Socket 狀態難以切分。

### Render the MVP chat panel inside FriendView right pane

新增 src/components/friend/FriendChatPanel.vue 作為右側內容。FriendView 保留頁面組裝、登入限制、選擇好友與返回大廳等流程；聊天面板負責載入訊息、顯示列表、輸入框、送出按鈕與錯誤狀態。

Alternative considered: 先用 FriendView 內聯整個聊天 UI。此做法被排除，因為 FriendView 已負責多個好友頁流程，聊天面板有獨立狀態與互動，抽成元件更容易測試與維護。

### Use REST-only behavior for the first frontend MVP

第一版只在選擇好友時讀取歷史訊息，送出成功後把 API 回傳 directMessage 加入目前 conversation。這能讓既有後端能力立即可用，同時避免在同一張 issue 引入 Socket 房間、重連、未讀或推播一致性問題。

Alternative considered: 同時加入 Socket.IO live delivery。此做法被排除，因為它需要新的事件 contract、連線生命週期與未讀策略，不屬於這張 MVP issue。

## Implementation Contract

#### Observable behavior

- 登入玩家開啟好友頁並選擇好友後，右側顯示好友私訊面板，而不是「好友聊天尚未串接」提示。
- 好友私訊面板會載入所選好友的聊天紀錄。
- 訊息依照 API 回傳順序顯示；目前玩家送出的訊息靠右顯示，好友送出的訊息靠左顯示。
- 無聊天紀錄時顯示空狀態。
- 載入聊天紀錄時顯示載入狀態。
- API 失敗時顯示錯誤文字。
- 使用者輸入非空白文字可以送出訊息；送出期間按鈕 disabled。
- 送出成功後，API 回傳的 directMessage 會出現在目前好友的訊息列表。
- 空白或只有空格的訊息會被前端阻擋並顯示錯誤，不會呼叫送出 API。
- 未登入玩家仍看到既有登入提示，不會看到聊天輸入框。

#### Interface / data shape

- getDirectMessages({ playerId, friendId }) 呼叫 GET /chats/direct/:friendId/messages，query params 包含 playerId。
- sendDirectMessage({ playerId, friendId, content }) 呼叫 POST /chats/direct/:friendId/messages，request body 包含 playerId 與 content。
- chatStore 對外提供 loadMessages(friendId)、sendMessage({ friendId, content })、clearChatData()，並提供目前 friendId 的 messages、isLoading、isSending、errorMessage 狀態。
- chatStore 使用 authStore.currentPlayer.id 作為目前玩家 ID，並沿用登入狀態判斷；缺少登入玩家時丟出或記錄「登入後才能使用好友聊天」。
- FriendChatPanel 接收 friend 與 currentPlayerId；friend 至少需要 playerId、name、status、online 欄位。

#### Failure modes

- 缺少登入玩家 ID 時，聊天 store 不呼叫 API，並記錄登入需求錯誤。
- 缺少有效 friendId 時，聊天 store 不呼叫 API，並記錄「請先選擇好友」。
- 空白訊息不呼叫 API，並記錄「請輸入訊息內容」。
- API 錯誤沿用 apiClient 正規化後的 error.message 顯示。
- 切換好友時，新好友載入失敗不得清除其他好友已成功載入的 conversation 快取。

#### Acceptance criteria

- node tests/friend-api-integration.test.mjs 通過，且測試確認 chatApi、chatStore、FriendChatPanel 與 FriendView 串接存在。
- npm run build 通過。
- 原有好友列表、邀請、加入好友與封鎖相關測試斷言仍符合目前行為。
- Source review 確認沒有新增 Socket.IO 聊天事件、未讀數、typing 或已讀狀態。

#### Scope boundaries

- In scope: src/services/chatApi.js、src/stores/chatStore.js、src/components/friend/FriendChatPanel.vue、src/views/FriendView.vue、tests/friend-api-integration.test.mjs。
- Out of scope: server 目錄、socketClient.js、room/game socket handlers、資料庫 schema、訊息分頁、未讀、typing、已讀、附件與第二階段 UI polish。

## Risks / Trade-offs

- [Risk] REST-only 聊天不會即時收到對方新訊息。→ Mitigation: 本 change 明確標記為 MVP，後續以獨立 Socket issue 處理 live delivery。
- [Risk] 未分頁的聊天紀錄在長對話中可能載入過多資料。→ Mitigation: 後端 MVP 目前也無分頁，前端保持契約一致，未來可在 chatApi 與 chatStore 加入 before 或 limit。
- [Risk] 前端仍從 authStore.currentPlayer.id 取得玩家 ID。→ Mitigation: 這符合現有 friend API 模式；未來若後端改由 token 推導玩家，另開 auth/API contract change。
