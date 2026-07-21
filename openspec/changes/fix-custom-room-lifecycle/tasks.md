## 1. 先建立失敗測試與契約護欄

- [x] 1.1 在 tests/custom-room-lifecycle.test.mjs 建立「Waiting-room operations lock during game start」與「Waiting-room slots follow backend seat order」測試，斷言 isStartingRoom 在 await 前設定、mutation handler 有 guard、PlayerList 使用 disabled、四席由 seatOrder 產生；執行 node tests/custom-room-lifecycle.test.mjs，確認只因新契約尚未實作而失敗。
- [x] 1.2 擴充 server/tests/roomService.test.js，覆蓋「Players explicitly leave waiting rooms」、「Host ownership transfers to the next human member」與「Waiting room dissolves without a human successor」的離房、真人接任、略過電腦、解散、409 與 rollback；執行 npm test -- --runInBand roomService.test.js，確認只因 leaveRoom 尚未實作而失敗。
- [x] 1.3 擴充 server/tests/roomInvitationService.test.js，覆蓋「Pending invitation queries expose only joinable rooms」、「Invitation acceptance revalidates room joinability」與「Starting or dissolving a room invalidates pending invitations」的狀態矩陣、接受重驗與批次失效；執行 npm test -- --runInBand roomInvitationService.test.js，確認只因新條件尚未實作而失敗。

## 2. 後端等待房生命週期

- [x] 2.1 依「新增明確的交易式 leaveRoom 契約」在 server/src/services/roomService.js 實作 leaveRoom({ roomCode, playerId })：鎖定 room 與成員、提供 400/404/409、一般離房後重排 seat_order 並回傳 { dissolved: false, roomState }；執行 npm test -- --runInBand roomService.test.js，確認一般離房與 rollback 通過。
- [x] 2.2 依「房主依真人 seatOrder 轉移，無接班人時解散」完成房主分支：最低舊 seatOrder 真人成為唯一 host，電腦不得接任；無真人時依序刪除成員與房間並回傳 { dissolved: true, roomCode }；執行 npm test -- --runInBand roomService.test.js，確認轉移、角色唯一性、解散與原子性通過。
- [x] 2.3 在 server/src/controllers/roomController.js、server/src/routes/roomRoutes.js 與 server/src/socket/roomHandlers.js 暴露 POST /api/rooms/:roomCode/leave 與 room:leave；保留時廣播 room:state，解散時送 room:dissolved { roomCode }，ack 維持 { ok, data/error }；執行 server 的 npm test -- --runInBand，確認 HTTP 與 Socket 使用同一契約。

## 3. 邀請有效性與開始交易

- [x] 3.1 依「邀請可加入條件在查詢與接受時重新驗證」修改 server/src/services/roomInvitationService.js：查詢只回傳未過期 pending、waiting、未滿且有有效真人 host 的邀請，接受時交易內重驗並以 409/410 拒絕；執行 npm test -- --runInBand roomInvitationService.test.js，確認矩陣、有效接受與拒絕案例通過。
- [x] 3.2 在 startGame 交易內將該房 pending invitations 更新為 expired 並設定 responded_at，解散沿用 ON DELETE CASCADE；執行 npm test -- --runInBand roomService.test.js roomInvitationService.test.js，確認開始與解散後邀請不可接受且失敗 rollback。

## 4. 前端離房、操作鎖與座位同步

- [x] 4.1 在 src/services/roomApi.js 與 src/stores/roomStore.js 接上 leaveRoom：優先 room:leave ack、失敗時 fallback POST leave、成功後 resetRoom、失敗時保留房間與 errorMessage；執行 node tests/custom-room-lifecycle.test.mjs，確認 explicit leave 與失敗不清狀態。
- [x] 4.2 依「以本地開始旗標與後端狀態共同鎖定等待房操作」修改 CustomRoomView.vue 與 CustomRoomPlayerList.vue：統一 isWaitingRoomInteractive、所有 handler 二次 guard、原生 disabled 沿用 Square UI token 與既有兩檔 breakpoint；執行 node tests/custom-room-lifecycle.test.mjs 與 npm run build，確認雙擊不重送且可編譯。
- [x] 4.3 依「以 seatOrder 建立固定槽位並以穩定識別管理暫存狀態」重構四席：occupied 優先、移除以 playerId 追蹤、電腦 pending 使用最前空位並在權威 state 或失敗後清除、邀請不建槽位狀態；執行 node tests/custom-room-lifecycle.test.mjs 與 node tests/computer-player-room-flow.test.mjs，確認重排與競態不殘留。
- [x] 4.4 將返回大廳改為 await leaveRoom 成功後才導航，onBeforeUnmount 維持僅 unsubscribe，並處理 room:dissolved；執行 node tests/custom-room-lifecycle.test.mjs，確認返回會離房、進 Loading 不離房、失敗停留原頁。

## 5. 整合驗證

- [x] 5.1 執行 node tests/custom-room-lifecycle.test.mjs、node tests/computer-player-room-flow.test.mjs、node tests/room-invitation-integration.test.mjs 與 npm run build，確認前端契約全部通過，且未新增圓角、第三組 breakpoint、clamp()、vw 或 vh 尺寸。
- [ ] 5.2 在 server 執行 npm test，再執行 spectra validate fix-custom-room-lifecycle，確認所有後端流程與三份 capability specs 一致。

