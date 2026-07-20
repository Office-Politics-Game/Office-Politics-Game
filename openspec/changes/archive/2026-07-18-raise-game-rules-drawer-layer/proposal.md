## Summary

提高遊戲規則右側欄的顯示層級，避免遊戲進行中的卡牌與提示動畫覆蓋已展開的規則介面。

## Motivation

現有遊戲動畫最高使用 z-index 120，而規則遮罩與側欄只使用 43–45，導致規則側欄展開時仍可能被動畫蓋住。

## Proposed Solution

- 將規則遮罩提升至 z-index 200。
- 將側欄整組提升至 z-index 201，保持按鈕在側欄 stacking context 內。

## Non-Goals

- 不修改動畫元件、側欄版面、內容或互動。

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `game-rules-right-drawer`: 規則遮罩與側欄在展開時必須高於所有現有遊戲動畫。

## Impact

- Affected specs: game-rules-right-drawer
- Affected code:
  - Modified: src/components/game/ui/GameRulesModal.vue
  - New: none
  - Removed: none
