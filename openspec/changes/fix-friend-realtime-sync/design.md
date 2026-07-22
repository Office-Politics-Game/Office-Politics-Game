## Context

好友 REST controller 在關係異動成功後只回傳 HTTP 回應；發送操作的 friendStore 會重新載入自己的資料，但另一位玩家的 Store 沒有事件、輪詢或其他失效通知。專案已有共用 Socket.IO client、Cookie parser、聊天個人房間及重連生命週期，可沿用其安全與清理模式，但好友同步必須使用獨立命名空間，避免依賴聊天訂閱。

## Goals / Non-Goals

**Goals:**

- 以 HttpOnly Cookie 驗證好友 Socket 訂閱並加入個人好友房間。
- 六種好友關係異動成功後通知另一位玩家重新載入資料。
- 好友頁內即時更新，重連後補載錯過的狀態。
- 保持 REST 為唯一寫入介面，推播失敗不改變已成功的 HTTP 結果。

**Non-Goals:**

- 不把好友寫入改成 Socket command。
- 不做全站常駐訂閱、跨分頁同步、未讀徽章、通知音效或彈窗。
- 不修改資料庫、REST request/response shape、聊天 Socket 或現有 UI 視覺。

## Decisions

### 使用獨立的好友 Cookie 訂閱與個人房間

新增 friend:subscribe 與 friend:unsubscribe。handler 只從 HttpOnly Cookie 取得 token，以 verifyToken 的結果決定 friend:player:<playerId>，忽略 payload 內任何身分欄位。此作法不影響訪客可用的房間與遊戲 Socket，也不把好友同步耦合到 chat:player 房間。

### REST 成功後向另一位玩家發出通用失效事件

controller 從 service 已回傳的 playerId 與 friendId 找出非操作方玩家，向其個人好友房間發出 friend:data-invalidated，payload 固定為空物件。操作方沿用既有 action 的 loadFriendData；另一方只知道好友資料需要重載，不取得封鎖或邀請細節。Socket server 不存在或 emit 例外時記錄錯誤但保留 REST 成功回應。

### friendStore 管理好友頁限定的即時生命週期

friendStore 新增 startRealtime、subscribeRealtime 與 stopRealtime，重複啟動只保留一組 friend:data-invalidated、connect、disconnect 與 connect_error handlers。收到失效事件後呼叫 loadFriendData；重連訂閱成功後同樣重新載入。FriendView 在登入會員掛載時啟動，卸載或登入失效時停止。訂閱失敗只更新非阻塞狀態，不停用 REST action。

## Implementation Contract

#### Observable behavior

- 已登入玩家 A 與 B 同時停留在好友頁時，A 送出邀請後 B 的邀請清單與數量無需重新整理即可更新。
- B 接受或拒絕後，A 的已送邀請或好友清單無需重新整理即可更新。
- 解除好友、封鎖與解除封鎖成功後，另一位玩家的好友資料無需重新整理即可更新。
- Socket 斷線重連後重新訂閱並呼叫 loadFriendData，以 REST 最新狀態補回斷線期間事件。
- 離開好友頁或登出後，好友 listener 與訂閱被清理，其他 Socket 功能不受影響。

#### Interface / data shape

- friend:subscribe payload: {}。
- friend:subscribe success ack: { ok: true, data: { playerId: number } }。
- friend:subscribe failure ack: { ok: false, error: { message: string } }。
- friend:unsubscribe payload: {}；成功 ack 的 data.playerId 為原訂閱玩家 ID 或 null。
- friend:data-invalidated payload: {}。
- 個人房間固定為 friend:player:<playerId>。
- friendStore 公開新增 startRealtime()、subscribeRealtime()、stopRealtime()；既有好友 action 與 REST shape 不變。

#### Failure modes

- Cookie 缺少、無效或驗證結果沒有正整數玩家 ID 時不得加入任何好友房間，並回傳失敗 ack。
- 同一 Socket 若驗證成不同玩家，必須先離開舊好友房間再加入新房間。
- 沒有好友身分時 unsubscribe 仍成功並回傳 playerId null。
- service 或 REST 驗證失敗時不得 emit friend:data-invalidated。
- Socket server 不存在或 emit 失敗時不得把成功的 REST 回應改成錯誤，也不得重做資料庫寫入。
- 訂閱失敗或連線中斷時保留所有 REST 好友功能，重複 startRealtime 不得新增重複 listener。

#### Acceptance criteria

- server/tests/friendSocket.test.js 覆蓋 Cookie 驗證、房間身分、換房、取消訂閱與 Socket 初始化註冊。
- server/tests/friendController.test.js 覆蓋六種成功異動通知另一方、失敗不推播，以及 Socket 不可用或 emit 失敗仍保留 REST 成功。
- tests/friend-realtime-sync.test.mjs 覆蓋訂閱冪等、失效事件重載、重連恢復、停止清理、未登入與訂閱失敗保留 REST。
- server 目錄 npm test、node tests/friend-realtime-sync.test.mjs 與 npm run build 全部通過。

#### Scope boundaries

- In scope: 好友 Socket handler、Socket server 註冊、好友 controller 非阻塞失效推播、friendStore 即時生命週期、FriendView 啟停接線及相關測試。
- Out of scope: 全站常駐、同一玩家其他分頁同步、訊息內容推播、輪詢、通知 UI、資料庫與 REST contract 變更，以及 AddFriendForm.vue 與 InviteFriendModal.vue 的既有未提交修改。

## Risks / Trade-offs

- [Risk] 一次失效事件會觸發四個既有好友 GET 請求。→ Mitigation: 好友異動頻率低且沿用單一 loadFriendData 保持狀態正規化；暫不加入局部 payload 合併。
- [Risk] Socket 斷線期間漏掉事件。→ Mitigation: connect 後重新訂閱並完整載入 REST 最新狀態。
- [Risk] 推播與 REST 寫入的失敗語意混合。→ Mitigation: emit 僅在 service 成功後非阻塞執行，任何 Socket 錯誤只記錄。
