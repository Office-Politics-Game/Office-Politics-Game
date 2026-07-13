## Context

好友私訊後端目前以 REST 提供歷史查詢與訊息送出，chatService 已集中處理玩家存在、好友關係、封鎖狀態、空白內容與資料寫入。前端 chatStore 會在選擇好友時載入紀錄，並在 POST 成功後把 directMessage 加入目前 conversation，但接收方無法在不重新載入的情況下看到訊息。

專案已有共用 Socket.IO client、伺服器初始化入口與房間／遊戲 handlers。好友功能只允許持有會員 token 的登入玩家使用，但既有房間與遊戲 Socket 仍支援不具會員 token 的流程，因此本變更不能把全站 Socket 連線改為強制會員驗證。

## Goals / Non-Goals

**Goals:**

- 讓通過會員 token 驗證的玩家訂閱自己的聊天推播房間。
- 保留 REST 作為訊息驗證、儲存與送出成功回應的唯一寫入介面。
- REST 成功儲存訊息後，將同一個 directMessage 推送給接收者。
- 讓 chatStore 將即時訊息寫入正確好友 conversation，並依訊息 ID 去重。
- Socket 重連後重新訂閱，並補載目前選取的 conversation。
- Socket 推播失敗時仍維持已成功 REST 寫入的 201 回應。
- 訊息增加時標題與輸入區維持可見，僅訊息內容區產生垂直捲動。
- 訊息泡泡維持 Square UI 方形語言，以較窄比例與左右三角尾巴區分方向。
- 讓玩家可用 Enter 送出好友私訊，並保留 Shift+Enter 換行與中文輸入法組字安全性。
- 讓目前對話在自己送出、收到訊息、切換好友與歷史載入完成後一律顯示最新一則訊息。

**Non-Goals:**

- 不新增 chat:send 或把訊息送出改成 Socket。
- 不加入未讀數、已讀狀態、typing、分頁、附件、群聊、房間聊天或遊戲內聊天。
- 不重構全站 Socket 驗證與既有房間／遊戲事件。
- 不新增未讀提示、保留舊閱讀位置的條件判斷、平滑捲動動畫，也不重設好友聊天以外的頁面視覺。

## Decisions

### 保留 REST 寫入並只用 Socket 推播

前端繼續呼叫 POST /api/chats/direct/:friendId/messages。chatService 完成授權與 INSERT 後，由 controller 使用回傳的 directMessage 觸發推播。這保留既有錯誤碼、資料格式與測試邊界，也避免同時維護 REST 與 Socket 兩套寫入契約。

Alternative considered: 新增 chat:send 並讓前端改用 Socket ack。此方案需要定義逾時、重送與 REST／Socket 一致性，不屬於第一版即時推播。

### 使用 token 驗證聊天訂閱而不修改全站 Socket 握手

新增 chat:subscribe，payload 只接受 token。handler 使用既有 verifyToken(token) 取得玩家，忽略任何由 client 宣告的 playerId，並把驗證出的玩家 ID 存入 socket.data.chatPlayerId。重新訂閱不同玩家時先離開舊房間。chat:unsubscribe 依 socket.data.chatPlayerId 離開房間並清除聊天身分。

Alternative considered: 在 Socket.IO connection middleware 全域驗證 token。此方案會影響訪客房間與遊戲流程，因此排除。

### 使用每位玩家的個人聊天房間

驗證成功的 socket 加入 chat:player:<playerId>。REST 送出成功後只向 directMessage.receiverPlayerId 的個人房間發送 chat:message。寄件者目前分頁沿用 POST 回應更新，不接收同一事件，避免引入多裝置同步範圍。

Alternative considered: 每組好友建立 conversation room。此方案需要加入／離開選取對話的生命週期，且無法在使用者查看其他好友時接收訊息，因此排除。

### REST 成功後採非阻塞推播

controller 僅在 sendDirectMessage 成功後取得 Socket server 並 emit。Socket server 尚未初始化或 emit 發生例外時記錄錯誤，但仍回傳既有 201 與 directMessage。service 或 REST 驗證失敗時不執行 emit。

Alternative considered: 推播失敗就讓 REST 回應失敗。資料已寫入後回傳失敗會誘發 client 重送與重複訊息，因此排除。

### chatStore 依訊息 ID 合併與去重

chatStore 新增 mergeMessages(friendId, messages)，將既有快取、REST 歷史與 Socket 訊息依 id 合併，再以 createdAt、id 排序。appendMessage 改用相同去重規則。收到 chat:message 時，以 senderPlayerId 作為 conversation key；事件缺少有效 id、senderPlayerId 或 receiverPlayerId 時忽略，不污染狀態。

Alternative considered: Socket 事件直接 push。此方案在重連補載或事件重送時會重複顯示，因此排除。

### 重連後重新訂閱並補載目前對話

chatStore 提供 startRealtime() 與 stopRealtime()。startRealtime() 只綁定一次 chat:message 與 connect listeners，立即執行 chat:subscribe；connect 事件再次訂閱成功後，若 selectedFriendId 存在則呼叫 loadMessages(selectedFriendId)。loadMessages 使用 mergeMessages，避免補載覆蓋重連期間已收到的事件。stopRealtime() 移除 listeners、嘗試 chat:unsubscribe，並重設訂閱旗標。

Alternative considered: 只重新訂閱而不補載。Socket 斷線期間的事件無法補送，因此排除。

### FriendView 管理好友聊天即時生命週期

FriendView 在 canUseFriendSystem 為 true 時啟動即時訂閱，在狀態變為 false 時透過 clearChatData() 停止並清除聊天資料，元件卸載時呼叫 stopRealtime()。這讓好友頁內即使尚未選擇好友或正在查看其他好友，也能把事件存入正確 conversation；離開好友頁後則不保留不必要的 listener。

Alternative considered: 由 FriendChatPanel 啟動訂閱。沒有選取好友時面板不會掛載，無法符合背景接收其他好友訊息的需求，因此排除。

### 限制聊天高度並以訊息區獨立捲動

FriendView 的右側內容區與 FriendChatPanel 都使用可縮小的 column flex 容器，透過 min-h-0、flex-1 與 overflow-hidden 建立有限高度。標題列與輸入區維持 shrink-0，中間 chat-body 保留 min-h-0、flex-1 與 overflow-y-auto，讓訊息超出時只在 chat-body 內捲動，輸入區不會被推到外層固定高度面板之外。

Alternative considered: 在 message-list 外再新增一層捲動 div。父層若仍只有 min-height 而沒有有限高度，新增 wrapper 仍會隨內容長高，因此排除。

### 使用窄版方形泡泡與 CSS 三角尾巴

訊息泡泡維持零圓角與既有品牌色，桌面最大寬度限制為 62%，小螢幕放寬為 82% 以保留可讀性。泡泡使用 CSS 偽元素建立朝所在側外側的方向尾巴，必要時使用雙層偽元素保留邊框。裝飾尾巴不新增 DOM，也不改變訊息語意。

Alternative considered: 新增裝飾性 span 或使用 clip-path。前者增加無語意標記，後者會裁切既有邊框與陰影，因此排除。

### 以訊息擁有者控制視覺方向與身分標示

FriendChatPanel 繼續以 `senderPlayerId === currentPlayerId` 判斷本人訊息，不改動訊息資料結構。每則訊息新增一個包含身分標示與泡泡的垂直容器：本人整組靠左、使用白色泡泡與左向尾巴，泡泡上方顯示小字「我」；對方整組靠右、使用 `--gray-100` 淺灰泡泡與右向尾巴，泡泡上方只顯示 `friend.playerId` 的實際值，不加「玩家 ID」或其他前綴。時間保留在泡泡內右下角。

Alternative considered: 將身分文字放入泡泡內。這不符合身分標示位於訊息框上方的需求，因此排除。使用 CSS `content` 產生身分文字也被排除，因動態玩家 ID 難以維護且無法提供可靠的可存取文字節點。

### 使用鍵盤事件區分送出、換行與輸入法組字

新增 `src/utils/FriendChatKeyboard.js`，由純函式 `isFriendChatSubmitShortcut(event)` 判斷鍵盤事件是否為送出手勢。只有 `key === "Enter"`、沒有 Shift／Ctrl／Alt／Meta 修飾鍵且 `isComposing !== true` 時回傳 true。FriendChatPanel 的 textarea 以 `@keydown="handleMessageKeydown"` 接收事件；送出手勢先呼叫 `event.preventDefault()`，再以既有 `sendDisabled` 阻止空白內容或送出中的重複請求，符合條件時沿用 `submitMessage()`。Shift+Enter 與輸入法組字事件不阻止預設行為，也不呼叫送出。

Alternative considered: 使用 `@keydown.enter.exact.prevent`。雖然較短，但 `prevent` 會在進入 handler 前執行，無法先排除中文輸入法組字事件，因此不採用。表單層級監聽也會擴大到未來其他輸入控制，故排除。

### 讓目前對話永遠跟隨最新訊息

新增 `src/utils/FriendChatScroll.js`，由 `scrollFriendChatToLatest(container)` 將可捲動容器的 `scrollTop` 設為 `scrollHeight`；容器尚未掛載時直接返回。FriendChatPanel 在 `chat-body` 保留 DOM ref，並監聽目前好友 ID、訊息數量與最後一則訊息 ID。任一來源改變後先等待 Vue `nextTick()` 完成 DOM 更新，再捲到最下方。REST 送出回應與目前好友的 `chat:message` 都會經既有 conversation 合併流程改變最新訊息，因此共用同一條捲動路徑；切換好友及歷史載入完成也會觸發相同行為。

此行為採使用者核准的強制跟隨方案：即使玩家手動往上閱讀舊訊息，只要目前對話出現新訊息就會回到最新一則。捲動只作用於目前掛載的 `chat-body`，不修改 conversation、REST、Socket 或 chatStore。

Alternative considered: 只有接近底部時才自動捲動，或顯示「新訊息」按鈕。兩者可保留閱讀位置，但仍可能要求玩家額外操作才能看到最新訊息，不符合本次需求，因此排除。使用平滑捲動也被排除，以避免連續訊息造成動畫堆疊。

### 讓未訂閱狀態自動重試並顯示即時狀態

chatStore 在聊天生命週期仍有效但 `chat:subscribe` 失敗時，使用單一重試計時器自動重試，最多重試 3 次，避免暫時性驗證或網路錯誤讓頁面永久停在「已啟動但未訂閱」狀態。重複呼叫 `startRealtime()` 時，若 listener 已存在但尚未訂閱，應重新嘗試訂閱；不得再次綁定 `chat:message`、`connect`、`disconnect` 或 `connect_error` listener。成功訂閱或停止聊天生命週期時必須清除重試計時器與次數。

Socket 斷線或訂閱失敗時，chatStore 保留 REST 功能並設定可讀的 `realtimeErrorMessage`。FriendChatPanel 顯示 Square UI 的非阻塞狀態列與重新連線按鈕，讓使用者知道即時訊息暫停但仍可送出或載入訊息。重新連線按鈕只呼叫既有 `startRealtime()` 重試，不新增 Socket 訊息送出流程。

Alternative considered: 讓使用者每次刷新頁面重新訂閱。這會保留目前缺陷，且無法處理短暫訂閱失敗，因此不採用。

### 以 raw Pinia store 穩定索引即時生命週期

chatStore 的 generation、Socket handler bundle、重試 timer 與重試次數屬於非響應式生命週期資源，繼續保存在模組層 WeakMap，但所有讀寫與刪除都先以 Vue `toRaw(store)` 取得穩定鍵。這讓 `startRealtime()` 的 Socket callback 與 callback 後呼叫的 `subscribeRealtime()` 即使取得同一 store 的不同 Proxy 包裝，仍能看到相同 generation 與 handlers；`stopRealtime()` 也能清除同一組資源。

Alternative considered: 把 Socket 與 timer 直接放入 Pinia state。這會讓不可序列化物件進入響應式狀態與開發工具快照，增加追蹤成本並可能代理 Socket 物件，因此排除。

## Implementation Contract

#### Observable behavior

- 已登入會員開啟好友頁後會訂閱自己的聊天推播房間。
- 玩家 A 透過既有 REST API 成功傳送訊息給玩家 B 後，玩家 B 在好友頁內不需重新整理即可收到同一個 directMessage。
- 玩家 B 查看其他好友時，訊息仍存入玩家 A 的 conversation；切換回玩家 A 時可看到訊息。
- REST 回應、Socket 事件與歷史補載包含相同訊息時，conversation 只保留一筆。
- Socket 重連後自動恢復訂閱，並補載目前選取好友的歷史。
- 離開好友頁、登出或清除聊天資料後，不再保留重複 listener 或聊天訂閱。
- 同一個 raw Pinia store 經不同 Vue Proxy 包裝呼叫 `startRealtime()`、connect callback、`subscribeRealtime()` 或 `stopRealtime()` 時，必須共用同一個 generation、handlers 與 retry 資源，不得把有效訂閱誤判為過期。
- 訊息數量超過可視高度時，標題與輸入區仍固定可見，使用者可在訊息內容區垂直捲動。
- 本人訊息整組靠左，上方顯示「我」，使用白色方形泡泡與左向三角尾巴；對方訊息整組靠右，上方只顯示實際玩家 ID，使用淺灰色方形泡泡與右向三角尾巴。
- 兩種泡泡在桌面維持最大寬度 62%、小螢幕維持最大寬度 82%，時間保留在泡泡內右下角。
- 玩家在好友私訊輸入框按下無修飾鍵的 Enter 時會送出一次非空白訊息；Shift+Enter 會插入換行，輸入法組字期間按 Enter 只處理選字，不會送出。
- 空白內容或訊息送出處理中按 Enter 時不會呼叫 REST 送出，也不會產生重複訊息。
- 目前對話在自己送出、收到即時訊息、切換好友或歷史載入完成後，訊息內容區會在 DOM 更新後捲到最下方並顯示最新一則；玩家正在閱讀舊訊息時也採相同行為。

#### Interface / data shape

- chat:subscribe payload: { token: string }。
- chat:subscribe success ack: { ok: true, data: { playerId: number } }。
- chat:subscribe failure ack: { ok: false, error: { message: string } }。
- chat:unsubscribe payload: {}。
- chat:unsubscribe success ack: { ok: true, data: { playerId: number | null } }。
- chat:message payload 為 directMessage：
  - id: number
  - senderPlayerId: number
  - receiverPlayerId: number
  - content: string
  - createdAt: string
- 個人房間名稱固定為 chat:player:<playerId>。
- 既有 POST /api/chats/direct/:friendId/messages request 與 response shape 不變。
- chatStore 對外新增 startRealtime()、stopRealtime()、mergeMessages(friendId, messages)，並保留既有 loadMessages、sendMessage、clearChatData。
- generation、handler bundle、retry timer 與 retry count 的內部索引鍵固定為 `toRaw(store)`；這不改變 chatStore 公開 API 或 Pinia state shape。
- `isFriendChatSubmitShortcut(event)` 接受鍵盤事件形狀 `{ key, shiftKey, ctrlKey, altKey, metaKey, isComposing }` 並回傳 boolean；不讀寫 Vue、Pinia、DOM 或聊天狀態。
- FriendChatPanel 的 `handleMessageKeydown(event)` 只在 helper 回傳 true 時阻止預設行為，並沿用既有 `sendDisabled` 與 `submitMessage()`。
- `scrollFriendChatToLatest(container)` 接受可讀寫 `scrollTop` 且具有 `scrollHeight` 的容器；容器存在時設定 `scrollTop = scrollHeight`，容器為 null 或 undefined 時不執行任何操作。
- FriendChatPanel 監聽目前好友 ID、訊息數量與最後一則訊息 ID，等待 `nextTick()` 後將目前 `chat-body` 交給 `scrollFriendChatToLatest(container)`。

#### Failure modes

- token 缺少或 verifyToken 失敗時，socket 不加入任何聊天房間並回傳失敗 ack。
- 同一 socket 重新訂閱不同玩家時，必須先離開原本個人房間。
- 沒有有效聊天身分時呼叫 chat:unsubscribe 仍回傳成功，playerId 為 null。
- REST 授權、內容驗證或資料寫入失敗時不發送 chat:message。
- Socket server 不存在或 emit 失敗時記錄伺服器錯誤，但 REST 仍回傳 201。
- 前端訂閱失敗時保留 REST 歷史與送出能力，並避免重複綁定 listeners。
- 格式不完整的 chat:message 不寫入任何 conversation。
- 等價 Vue Proxy 進入另一個 chatStore action 時不得遺失即時生命週期資源；若 raw store 已停止，舊 callback 仍必須被 generation 檢查拒絕。
- Shift／Ctrl／Alt／Meta+Enter 或 `isComposing === true` 時不得阻止原生輸入，也不得呼叫 `submitMessage()`。
- 純 Enter 事件若 `sendDisabled` 為 true，必須阻止 textarea 新增非預期換行，但不得呼叫 `submitMessage()`。
- `chat-body` 尚未掛載或目前 conversation 沒有訊息時，自動捲動不得丟出例外，也不得改變聊天狀態。

#### Acceptance criteria

- server/tests/chatSocket.test.js 覆蓋有效 token、無效 token、重複訂閱換房與取消訂閱。
- server/tests/chatController.test.js 覆蓋成功 REST 推播、service 失敗不推播，以及 Socket 不可用仍回傳 201。
- tests/friend-chat-realtime.test.mjs 覆蓋訂閱生命週期、非目前好友訊息、訊息去重、重連補載與 listener 清理。
- tests/friend-chat-realtime.test.mjs 覆蓋不同 Vue Proxy 指向同一 raw store 時，connect callback 仍可送出 chat:subscribe，且 stop 可清除同一組生命週期資源。
- tests/friend-chat-layout.test.mjs 覆蓋有限高度、獨立捲動、固定輸入區、窄版泡泡與左右三角尾巴的樣式契約。
- tests/friend-chat-layout.test.mjs 覆蓋本人靠左白色並顯示「我」，以及對方靠右淺灰色並只顯示實際玩家 ID。
- tests/friend-chat-keyboard.test.mjs 覆蓋純 Enter、Shift／Ctrl／Alt／Meta+Enter、中文輸入法組字事件，以及 FriendChatPanel 的 preventDefault、sendDisabled 與 submitMessage 接線。
- tests/friend-chat-scroll.test.mjs 覆蓋捲動 helper、空容器安全性，以及 FriendChatPanel 在好友、訊息數量或最新訊息 ID 改變後等待 DOM 更新並捲到底部的接線。
- npm test 在 server 目錄通過。
- node tests/friend-chat-realtime.test.mjs 通過。
- npm run build 通過。
- 已知的 tests/friend-api-integration.test.mjs 登入彈窗舊斷言不屬於本 change，驗證報告需單獨標示，不得在本 change 修改。

#### Scope boundaries

- In scope: 聊天 Socket handler、Socket server 註冊、REST 成功後推播、chatStore 即時同步、raw Pinia store 生命週期索引、FriendView 生命週期、好友聊天捲動高度、目前對話強制跟隨最新訊息、窄版方形泡泡、依訊息擁有者決定的左右方向、白色／淺灰色來源區分、身分標示、三角尾巴、Enter 送出、Shift+Enter 換行、輸入法組字保護與相關測試。
- Out of scope: Socket 寫入、全站 Socket auth、未讀／已讀／typing、分頁、附件、其他聊天種類、登入彈窗舊斷言、保留舊閱讀位置的條件判斷、平滑捲動動畫、「新訊息」按鈕與其他 UI polish。

## Risks / Trade-offs

- [Risk] REST 已寫入但推播失敗，接收者當下看不到訊息。→ Mitigation: REST 保持成功，接收者重連或再次選取好友時由歷史補載恢復。
- [Risk] 重連與歷史請求競態造成覆蓋或重複。→ Mitigation: 所有寫入 conversation 的路徑共用依 id 合併與排序。
- [Risk] 重複 startRealtime 造成多重事件處理。→ Mitigation: store 使用啟動旗標與穩定 handler reference，stopRealtime 對稱移除。
- [Risk] token 驗證增加 Supabase 查詢。→ Mitigation: 僅在首次訂閱與 Socket 重連時驗證，不在每則 chat:message 上驗證。
- [Risk] 桌面窄版泡泡在小螢幕造成過度換行。→ Mitigation: 小螢幕最大寬度放寬為 82%，並保留 break-words。
- [Risk] 將 Proxy 正規化為 raw store 後，停止流程若漏用相同鍵會殘留 listener 或 timer。→ Mitigation: 所有 WeakMap 存取集中經由同一個 key helper，並以等價 Proxy 的 start／connect／stop 測試覆蓋。
- [Risk] 中文輸入法以 Enter 確認候選字時誤送訊息。→ Mitigation: 純鍵盤 helper 明確排除 `isComposing === true`，handler 在判斷後才呼叫 `preventDefault()`。
- [Risk] 玩家閱讀舊訊息時收到新訊息會被強制帶回最下方。→ Mitigation: 這是使用者核准的方案 A；測試與人工驗收明確確認目前對話永遠跟隨最新訊息。

## Migration Plan

- 不需要資料庫 migration 或新套件。
- 先部署支援 chat events 的後端，再部署啟用訂閱的前端；舊前端可繼續使用 REST。
- 回滾前端即可停止訂閱；回滾後端後前端訂閱會失敗，但 REST 聊天仍可使用。

## Open Questions

- none
