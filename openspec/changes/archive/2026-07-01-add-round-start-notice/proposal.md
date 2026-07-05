## Why

玩家在新回合開始前需要明確知道目前進入第幾回合，避免只從左上角狀態列推測遊戲節奏。現有遊戲畫面已使用 FlyInTextModal 呈現重要提示，因此可用一致的提示方式補足回合開始訊息。

## What Changes

- 遊戲桌畫面在回合開始時顯示「第 X 回合開始」文字提示。
- 提示採用既有 src/components/game/FlyInTextModal.vue，不新增另一套提示元件。
- 提示應在初始發牌或新回合發牌流程完成後出現，並且早於既有「輪到你」提示。
- 只使用目前前端已接收到的 roundNumber prop；若後端沒有提供遞增回合數，前端仍依現有 fallback 顯示目前可得的回合數。

## Non-Goals

- 不修改後端 game state schema、roundService.js 或 initialState.js。
- 不新增 socket event、REST API 或資料庫欄位。
- 不重新設計 FlyInTextModal.vue 的視覺樣式。
- 不改變現有抽牌、出牌、卡牌效果動畫流程。

## Capabilities

### New Capabilities

- `round-start-notice`: 遊戲桌在回合開始時以飛入文字提示目前回合數。

### Modified Capabilities

(none)

## Impact

- Affected specs: round-start-notice
- Affected code:
  - New: tests/round-start-notice.test.mjs
  - Modified: src/components/game/GameStage.vue
  - Removed: (none)
