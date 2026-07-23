## Context

後端已以 game_rooms、game_room_players 與 room_invitations 保存權威狀態，並透過 HTTP 與 Socket.IO 提供房間流程。前端目前將 players 陣列索引視為座位，並以索引保存暫存 UI；返回大廳只切換路由，onBeforeUnmount 只送 room:unsubscribe。邀請查詢及接受也未完整驗證有效房主與容量。

此修正橫跨 Vue、Pinia/API、Socket handler、房間交易與邀請查詢。現有資料表已足夠，room_invitations 對 game_rooms 使用 ON DELETE CASCADE，因此不需要 migration。UI 只補既有控制項 disabled 狀態，沿用 Square UI token 與兩檔橫向 breakpoint。

## Goals / Non-Goals

**Goals:**

- 讓可操作性由本地開始狀態與 room.status 共同決定。
- 讓四席只由 players 與 seatOrder 決定，暫存 UI 不得取代已占用座位。
- 提供交易式離房，包含一般離房、房主轉移、座位重排及必要時解散。
- 讓邀請查詢與接受共用可加入條件，開始或解散後不再可接受。

**Non-Goals:**

- 不將 Socket disconnect、重新整理或取消訂閱視為主動離房。
- 不處理 playing room 中途離場、斷線重連、手動指定房主或投降。
- 不改變四人開局規則，不新增 schema、套件、動畫或版面重設計。
- 不修正本次範圍以外的既有 Square UI 違規。

## Decisions

### 以本地開始旗標與後端狀態共同鎖定等待房操作

CustomRoomView 新增 isStartingRoom，handleStartRoom 在任何 await 前設為 true。isWaitingRoomInteractive 必須同時滿足 room.status 為 waiting、未載入、未還原且未開始；所有等待房按鈕使用原生 disabled，handler 入口也檢查。開始失敗時解除旗標，成功或收到 playing 後維持鎖定至 Loading。統一衍生狀態可避免逐個按鈕漏掉 guard；只靠共用 isLoading 無法涵蓋請求完成到路由切換的間隙。

### 以 seatOrder 建立固定槽位並以穩定識別管理暫存狀態

playerSlots 先建立 1 至 4 席，再將合法 seatOrder 玩家放入對應位置，不以 players[index] 推定座位。後端玩家永遠優先於 pending UI。移除狀態以 playerId 保存；加入電腦 pending 只顯示於目前最前空位，收到權威 state 或失敗後清除；邀請只開 modal，不建立槽位狀態。不讓前端指定座位，因後端 getNextSeatOrder 已負責決定最前空位。

### 新增明確的交易式 leaveRoom 契約

roomService 新增 leaveRoom({ roomCode, playerId })，以 BEGIN 鎖定 game_rooms 與依 seat_order 排序的成員。無效輸入回傳 400，房間或成員不存在回傳 404，非 waiting 回傳 409。

HTTP 新增 POST /api/rooms/:roomCode/leave，body 為 { playerId }；Socket 新增 room:leave，payload 為 { roomCode, playerId }。房間保留時回傳 { dissolved: false, roomState } 並廣播 room:state；解散時回傳 { dissolved: true, roomCode } 並送出 room:dissolved。roomStore.leaveRoom 優先 Socket ack，失敗才 fallback HTTP，成功後清除房間與 sessionStorage。返回大廳必須 await 成功才導航；失敗保留原頁與錯誤。onBeforeUnmount 仍只 unsubscribe。

### 房主依真人 seatOrder 轉移，無接班人時解散

一般成員離房後依原 seat_order 重排為 1..N。房主離房時，只從其他 is_computer = false 成員選舊 seat_order 最小者；交易內刪除舊房主、更新 host_player_id、將候選人設為唯一 host，再重排座位。若沒有真人候選人，先刪 game_room_players 再刪 game_rooms，讓邀請由 cascade 清除。此選擇不保留沒有房主的 closed row，也不需新增 status。

### 邀請可加入條件在查詢與接受時重新驗證

有效邀請必須同時為 pending、未過期、房間 waiting、房內存在等於 host_player_id 且 role=host、is_computer=false 的成員，並且總人數小於 4。查詢 SQL 套用全部條件；接受時鎖定 invitation 與 room 後再驗證。過期回傳 410，其餘競態回傳 409且不得插入。startGame 交易將該房所有 pending invitation 更新為 expired 並填 responded_at；解散由 cascade 刪除。

## Implementation Contract

**Behavior:**

- 房主送出 start 的同步事件循環內，所有等待房操作立即不可點擊，重複 click 不得再送 mutation。
- 玩家依 seatOrder 1 至 4 顯示；後端只有 1、2、3 席時，第 4 席依目前權限重算，不繼承暫存狀態。
- 一般玩家返回後移除並廣播連續座位；房主返回後最前真人接任，電腦不得接任；無真人時解散。
- 房間開始或解散後，pending invitations 不再顯示或可接受。

**Interfaces and data shapes:**

- leaveRoom({ roomCode, playerId }) 回傳 { dissolved: false, roomState } 或 { dissolved: true, roomCode }。
- POST /api/rooms/:roomCode/leave 接受 { playerId }。
- room:leave 接受 { roomCode, playerId }，ack 沿用 { ok: true, data } 或 { ok: false, error: { message } }。
- room:dissolved payload 為 { roomCode }；room:state 維持既有結構。
- CustomRoomPlayerList 接收 controlsDisabled Boolean，add、invite、remove 的 disabled 同時考慮此值與 slot 權限。

**Failure modes:**

- 無效 playerId 為 400；查無房間或成員為 404；非 waiting 與邀請競態為 409；過期邀請為 410。
- leave transaction 失敗必須 rollback，不得部分更新房主、角色、成員、座位或邀請。
- leave 失敗不得 resetRoom 或導航；start 失敗解除開始鎖並顯示錯誤。

**Acceptance criteria:**

- node tests/custom-room-lifecycle.test.mjs 驗證操作鎖、disabled、handler guard、explicit leave 與 seatOrder。
- node tests/computer-player-room-flow.test.mjs 保持通過。
- server 的 npm test 覆蓋一般離房、房主轉移、解散、rollback 與邀請有效性。
- npm run build 成功。

**Scope boundaries:**

- In scope：等待房操作、前端 leave 接線、後端 waiting leave、邀請有效性及相關測試。
- Out of scope：disconnect 自動離房、playing 離場、migration、邀請 UI 重設計、其他頁面與 ProfileView。

## Risks / Trade-offs

- [HTTP fallback 成功後 Socket ack 晚到] → leave action 使用單次 promise，reset 後忽略不符合目前 roomCode 的 payload。
- [玩家與電腦 pending 同時占位] → 權威 state 優先，後端在 room lock 下決定 seatOrder。
- [刪房受成員外鍵限制] → 先刪 game_room_players，再刪 game_rooms。
- [start 與 leave 同時發生] → 兩者鎖同一 room row 並重新驗證 status 與 membership。
- [邀請測試 mock 順序改變] → 測試明確斷言 host membership 與 player count 查詢。

