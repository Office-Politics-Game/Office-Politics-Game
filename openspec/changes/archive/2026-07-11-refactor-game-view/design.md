## Context

`GameView.vue` 目前約 695 行，除了路由頁面組裝，還包含玩家與卡牌正規化、相對座位計算、房間初始載入、Pinia patch、Socket 訂閱與去重、動畫序列協調、抽牌／出牌命令及 HTTP fallback。`GameStage` 已完成內部 composable 化，但上層 route view 尚未建立同等清楚的責任邊界。既有 `game-stage-refactor` 規格要求 `GameView` 與 `GameStage` 的 runtime contract 保持穩定。

## Goals / Non-Goals

**Goals:**

- 將 `GameView` 收斂為組裝、生命週期及 template 綁定的薄協調層。
- 讓顯示模型、房間狀態及 Socket action 流程可分別理解與測試。
- 保持玩家可見行為、動畫順序、fallback 策略與 `GameStage` 公開契約不變。
- 以現有 Vue Composition API 與 JavaScript 慣例完成拆分，不新增依賴。

**Non-Goals:**

- 不修改遊戲規則、後端 API、Socket event 名稱或 payload。
- 不修改 `GameStage` props、emits、exposed methods、動畫時間或 UI 樣式。
- 不將 route-view 專用流程移入全域 Pinia store 或 service。
- 不重構 `GameStage.vue`、後端 handler 或既有無關 composable。

## Decisions

### 以三個 focused composables 分離責任

新增 `useGameViewModel.js`、`useGameRoomState.js` 與 `useGameSocketActions.js`。三個模組分別擁有顯示資料、載入／store 同步、即時 action 協調；`GameView` 只連接輸入輸出。相較只抽純函式或只拆 Socket，大幅拆分能消除主要耦合，而三個邊界仍足夠粗，不會產生大量細碎模組。

### 使用明確依賴注入維持單向資料流

composable 接收 refs、store 與命令函式，不直接取得 route 或建立另一個 composable。`useGameRoomState` 擁有正規化後的房間／玩家識別與 state patch；`useGameViewModel` 消費 store refs 與 metadata；`useGameSocketActions` 消費房間識別、view-model 操作條件、room-state commands 與 `gameStage` ref。這比 module singleton 更容易隔離測試，也避免生命週期與 Socket 狀態跨頁面殘留。

### 生命週期由 GameView 統一驅動

`GameView` 的 mounted 流程呼叫初始載入與 Socket 訂閱，unmount 呼叫明確 cleanup，route query 變更時重新載入並重新訂閱。composable 不自行註冊 component lifecycle hook，讓資源建立與釋放在頁面入口清楚可見。

### 保留既有 action 時序與降級策略

Socket action 按收到順序串行播放；帶 `afterActionId` 的 state 等待相同 action 完成後才套用；Socket ACK 成功的抽牌／出牌 state 立即套用。Socket 命令失敗時維持現有 HTTP fallback、動畫與 refresh 流程，動畫失敗只記錄 warning，不中止後續 state 同步。

### 測試依責任邊界定位契約

既有 `socket-game-animation.test.mjs` 改為讀取 socket-action composable，避免測試綁死 route view 的檔案位置。新增 `game-view-refactor.test.mjs` 驗證三個 composable 的組裝邊界、相對座位與操作 guard，以及 `GameView` 對 `GameStage` 的既有綁定。來源契約測試保留目前專案的 Node test 形式，不引入新的 test framework。

## Implementation Contract

- `GameView` SHALL 在初始資料尚未完成時呈現相同 `LoadingScreen` 狀態，載入完成後以相同 props 與 events 呈現 `GameStage`。
- `useGameViewModel` SHALL 回傳 `turnStatus`、`players`、`handCards`、`discardCards`、`deckCount`、`canDraw`、`playerHandCardCounts` 與目前玩家識別所需狀態；四人相對座位順序維持 top、left、right、bottom，觀看者位於 bottom。
- `useGameRoomState` SHALL 回傳 `normalizedRoomCode`、`requestedPlayerId`、`resolvedCurrentPlayerId`、metadata 與載入狀態，以及 `applyGameStatePayload`、`refreshRoomState`、`loadInitialRoomState`；缺少 route 識別、回應無 state 或玩家數不是四人時，維持現有錯誤結果與 retry 畫面。
- `useGameSocketActions` SHALL 回傳 `isDrawing`、`isSocketActionSubmitting`、`isPlayingSocketAction` 與 draw/play/subscribe/cleanup/round-complete commands。它 MUST 維持 action ID 去重上限、序列動畫、延後 state、computer-turn ready ACK 及 HTTP fallback 行為。
- Socket 與 HTTP error 仍以 warning 記錄；可恢復的動畫錯誤不得阻止 refresh；cleanup 後不得保留 `game:action` 或 `game:state` listener。
- 驗收時 `node tests/socket-game-animation.test.mjs`、`node tests/game-view-refactor.test.mjs` 與 `npm run build` MUST 通過。
- 範圍僅包含前端 route view 與新 composables／相關測試；不得改動後端、資料庫、視覺樣式或公開網路契約。

## Risks / Trade-offs

- [Risk] composable 間傳入參數過多，降低可讀性 → 使用具名 options object，並按識別、狀態、commands、animation refs 分組。
- [Risk] 拆分時改變 Socket action 與 state 的競態順序 → 原樣搬移 queue、pending map/set 與 completion 流程，使用現有及新增契約測試鎖定先後關係。
- [Risk] route 切換後重複 listener → 訂閱前對既有 socket 執行 cleanup，再綁定新 listener；unmount 再執行一次 idempotent cleanup。
- [Trade-off] 仍保留來源文字契約測試 → 本次不引入測試框架；測試改為跟隨責任模組，降低對 `GameView` 內部排列的耦合。
