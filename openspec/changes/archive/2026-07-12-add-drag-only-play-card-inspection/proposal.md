## Why

目前手牌在 pointer down 時立即進入拖曳，無法以點擊安全檢視卡面，也無法清楚區分點擊與出牌手勢。需要讓出牌只發生於拖曳至指定區域，同時提供不會誤出牌的中央放大檢視。

## What Changes

- 將手牌 pointer 操作分流為短點擊檢視與超過門檻的拖曳。
- 只有拖曳放開於既有 play zone 內才啟動出牌動畫與既有出牌流程。
- 新增中央卡牌檢視，可再次點牌、點擊遮罩或按 Esc 關閉，並可由中央繼續拖曳出牌。
- 中央卡牌加入依游標座標計算的傾斜、CSS 變數與背景／框架雙層景深；reduced-motion 停用即時視差。
- 禁止出牌的狀態仍可檢視卡牌，但不得開始拖曳。
- 尚未抽牌而禁止出牌時，手牌仍顯示較大的 pointer 游標；可拖曳及按下狀態使用較大的 grab／grabbing 自訂游標。

## Capabilities

### New Capabilities

- `card-inspection-gesture`: 定義手牌點擊檢視、中央互動、視差效果與拖曳出牌邊界。

### Modified Capabilities

- `game-stage-refactor`: 將既有卡牌出牌互動契約更新為明確的點擊與拖曳分流，同時維持 GameStage 對外整合契約。

## Impact

- Affected specs: card-inspection-gesture, game-stage-refactor
- Affected code:
  - New: src/components/game/ui/CardInspectionOverlay.vue
  - New: src/assets/icons/cursor-pointer.svg, src/assets/icons/cursor-grab.svg, src/assets/icons/cursor-grabbing.svg
  - Modified: src/components/game/ui/GameCard.vue, src/components/game/ui/PlayerHand.vue, src/components/game/ui/GameStage.vue, src/composables/useGameStageCardPlay.js, tests/player-hand.test.mjs, tests/card-play-interaction.test.mjs
  - Removed: none
