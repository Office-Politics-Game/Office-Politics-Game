## Why

`src/views/GameView.vue` 同時承擔顯示模型轉換、房間資料載入、Pinia 同步、Socket 動畫佇列與 HTTP fallback，已成長至約 695 行，使個別流程難以隔離理解、測試與維護。這次重構將頁面收斂為薄協調層，同時維持現有玩家可見行為與整合契約。

## What Changes

- 將玩家座位、卡牌資料與操作條件等衍生狀態抽至專用 view-model composable。
- 將 route 參數、初始載入、重試進度、房間 metadata 與 Pinia state patch 抽至 room-state composable。
- 將 Socket 訂閱、action 去重、動畫佇列、延後 state 套用、抽牌／出牌命令及 HTTP fallback 抽至 socket-action composable。
- 將 `GameView.vue` 精簡為 composable 組裝、`GameStage` ref、生命週期與 route 變更協調層。
- 更新來源契約測試，使測試跟隨新的責任邊界，並新增顯示模型與 action 流程的聚焦驗證。
- 不變更 `GameStage` props、events、exposed methods、後端 API、Socket event 或 payload。

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `game-stage-refactor`: 擴充既有 runtime contract，要求 `GameView` 在保留整合行為的前提下，將顯示模型、房間狀態與 Socket action 流程分離為 focused composables。

## Impact

- Affected specs: `game-stage-refactor`
- Affected code:
  - New: `src/composables/useGameViewModel.js`, `src/composables/useGameRoomState.js`, `src/composables/useGameSocketActions.js`, `tests/game-view-refactor.test.mjs`
  - Modified: `src/views/GameView.vue`, `tests/socket-game-animation.test.mjs`
  - Removed: none
- Public APIs and dependencies: no changes
