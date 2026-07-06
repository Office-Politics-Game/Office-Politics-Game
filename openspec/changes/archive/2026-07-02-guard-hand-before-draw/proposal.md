## Why

遊戲規則要求玩家在自己的回合先抽牌，才能出牌。現在手牌互動需要在未抽牌時給出清楚的 hover 文字提示，也需要確保玩家不能拖曳手牌嘗試出牌。

## What Changes

- 在前端遊戲桌互動中新增未抽牌手牌保護行為。
- 當目前玩家輪到自己、仍可抽牌、且尚未完成抽牌時，hover 到任一手牌直接顯示「請先抽下一張牌」文字。
- 同一狀態下，手牌不使用瀏覽器原生 title 或 not-allowed 禁止游標，並禁止 pointerdown 觸發拖曳或出牌流程。
- 保留既有抽牌按鈕行為與出牌後續流程；完成抽牌後才恢復手牌拖曳。

## Non-Goals

- 不新增或修改後端出牌規則檢查。
- 不新增 gameStage 後端狀態欄位，例如 hasDrawnThisTurn。
- 不改變抽牌動畫、出牌動畫、卡牌效果或回合結束規則。

## Capabilities

### New Capabilities

- hand-before-draw-guard: 定義玩家尚未抽牌時，手牌 hover 文字提示與拖曳禁止的前端互動規則。

### Modified Capabilities

(none)

## Impact

- Affected specs: hand-before-draw-guard
- Affected code:
  - Modified: src/views/GameView.vue
  - Modified: src/components/game/GameStage.vue
  - Modified: src/components/game/PlayerHand.vue
  - Modified: tests/player-hand.test.mjs
  - New: none
  - Removed: none
