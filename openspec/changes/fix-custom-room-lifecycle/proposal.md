## Why

自訂房間目前缺少一致的等待房生命週期：開始遊戲請求送出後仍能操作、前端槽位會因索引式暫存狀態殘留、房主返回大廳只取消 Socket 訂閱而未真正離房，導致無有效房主的房間與仍可接受的過期邀請。這些競態會讓前後端房間狀態分歧，必須由後端權威狀態與明確離房語意共同修正。

## What Changes

- 在等待房開始遊戲送出後立即鎖定返回大廳、移除玩家、加入電腦、邀請好友與主要操作，並在各事件處理器再次阻擋競態請求。
- 以後端 players 與 seatOrder 建立固定四席的顯示模型；邀請不占位，暫存狀態不得覆蓋或殘留在已重排座位。
- 新增明確的等待房離房 API 與 Socket 事件；一般玩家離房後重排座位，房主離房時將房主轉移給 seatOrder 最前的其他真人玩家。
- 當房主離開且沒有其他真人玩家可接任時，在同一交易中移除房間成員並解散房間，使 pending invitations 隨房間刪除而失效。
- 查詢與接受邀請時驗證邀請未過期、房間仍為 waiting、房主仍是房內有效 host 且房間未滿；開始遊戲時使 pending invitations 失效。
- 補上前端行為測試、房間服務 Jest 測試及邀請服務 Jest 測試。

## Capabilities

### New Capabilities

- `custom-room-lifecycle`: 定義等待房操作鎖、明確離房、房主轉移、無真人房主時解散與房間狀態廣播。
- `room-invitation-validity`: 定義房間邀請的可見與可接受條件，以及房間開始或解散後的失效行為。

### Modified Capabilities

- `computer-player-turns`: 等待房槽位必須依後端 players 與 seatOrder 呈現，加入電腦後不得保留錯誤的空位操作狀態。

## Impact

- Affected specs: custom-room-lifecycle、room-invitation-validity、computer-player-turns
- Affected code:
  - Modified:
    - src/views/CustomRoomView.vue
    - src/components/gameRoom/CustomRoomPlayerList.vue
    - src/stores/roomStore.js
    - src/services/roomApi.js
    - server/src/services/roomService.js
    - server/src/controllers/roomController.js
    - server/src/routes/roomRoutes.js
    - server/src/socket/roomHandlers.js
    - server/src/services/roomInvitationService.js
    - server/tests/roomService.test.js
    - server/tests/roomInvitationService.test.js
    - tests/computer-player-room-flow.test.mjs
  - New:
    - tests/custom-room-lifecycle.test.mjs
  - Removed: none
- API and realtime contracts: 新增等待房 leave HTTP endpoint 與 room:leave Socket event；既有 room:start、room:state 與邀請 API 回應形狀維持相容。
- Dependencies and database schema: 不新增套件或資料表；沿用既有 game_rooms、game_room_players 與 room_invitations 關聯。

