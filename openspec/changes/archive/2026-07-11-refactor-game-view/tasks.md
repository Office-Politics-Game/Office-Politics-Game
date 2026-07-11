## 1. 顯示模型與房間狀態

- [x] 1.1 實作「以三個 focused composables 分離責任」中的 `useGameViewModel.js`：輸出玩家相對座位、正規化手牌／棄牌、牌庫數量、公開手牌張數、turn status 與 draw guard，且四人視角結果與重構前一致；以 `node tests/game-view-refactor.test.mjs` 的 view-model source-contract 與具體座位／guard assertions 驗證。
- [x] 1.2 實作 `useGameRoomState.js` 的 route 識別、metadata、初始載入進度、retry、四人檢查與 Pinia patch，使成功及錯誤狀態維持現有 LoadingScreen 契約；以 `node tests/game-view-refactor.test.mjs` 的 room-state error、patch 與公開 command assertions 驗證。
- [x] 1.3 落實「使用明確依賴注入維持單向資料流」：三個 composable 僅以具名 options 接收 refs、store、commands 與 `gameStage` ref，不自行建立彼此或保存跨頁 singleton；以 `node tests/game-view-refactor.test.mjs` 檢查 imports、options contract 與禁止的反向依賴。

## 2. Socket Action 協調

- [x] 2.1 實作「保留既有 action 時序與降級策略」中的 `useGameSocketActions.js`：保留 action ID 去重、串行動畫、`afterActionId` state 延後套用、ACK state 立即套用及 notice idle 後 computer-turn ready 行為；以 `node tests/socket-game-animation.test.mjs` 驗證 queue、pending map/set、動畫先後與 ACK 契約。
- [x] 2.2 在 `useGameSocketActions.js` 保留 draw/play Socket failure 的 HTTP fallback、動畫錯誤後 refresh 與 idempotent listener cleanup，使失敗不遺留 loading 狀態或重複 handlers；以 `node tests/socket-game-animation.test.mjs` 的 fallback、finally 與 `off('game:action')`／`off('game:state')` assertions 驗證。

## 3. 頁面組裝與契約測試

- [x] 3.1 落實「生命週期由 GameView 統一驅動」：精簡 `GameView.vue` 為三個 composable 組裝、mounted load/subscribe、route query resubscribe、unmount cleanup 及既有 template 綁定，且不改變 `GameStage` props/events；以 `node tests/game-view-refactor.test.mjs` 驗證生命週期、template 契約及頁面不再包含 Socket queue／資料正規化實作。
- [x] 3.2 落實「測試依責任邊界定位契約」並覆蓋 `Game view responsibilities remain modular`：更新 `tests/socket-game-animation.test.mjs` 使 Socket assertions 指向 action composable，新增 `tests/game-view-refactor.test.mjs` 覆蓋三個責任模組與 `GameView` 組裝；執行兩個 Node tests 並確認所有案例通過。
- [x] 3.3 執行完整前端驗收，確認重構沒有破壞 Vue 匯入、`GameStage` 整合或 production bundle；以 `node tests/socket-game-animation.test.mjs`、`node tests/game-view-refactor.test.mjs` 與 `npm run build` 全數成功作為完成條件。
