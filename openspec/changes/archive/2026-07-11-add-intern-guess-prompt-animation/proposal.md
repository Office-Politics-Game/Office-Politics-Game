## Why

目前正式 `/game` 畫面的實習生卡牌效果只顯示「猜對啦／猜錯啦」，玩家無法在結果揭曉前確認本次猜測的對象與職位。新增短暫且持續到結果結束的猜測提示，可讓正式遊戲動畫敘事與出牌選擇一致。

## What Changes

- 正式 `/game` 的實習生效果在出牌動畫完成後，先顯示「猜 {玩家暱稱} 是 {職位}」。
- 猜測提示停留 1 秒且不消失，再疊加既有「猜對啦／猜錯啦」結果；結果展示完成時兩行文字一起消失。
- 整行猜測提示縮為原字級的 60%，其中玩家暱稱與職位使用既有遊戲黃色 `#facc15`，「猜／是」維持原色。
- intern 動畫結果契約帶回原始猜測職位，讓猜錯情境仍能顯示玩家實際選擇。
- 遊戲舞台依目標玩家 ID 解析暱稱並提供給實習生動畫，找不到玩家時使用穩定備援文字。
- 實習生出牌後先要求選擇目標玩家，只有在目標確定後才顯示職位選擇彈窗。
- 自動化測試覆蓋猜對、猜錯、資料正規化與正式遊戲動畫結構。

## Non-Goals

- 不修改 `src/views/CardPlayTestView.vue` 或其他動畫測試頁。
- 不變更實習生規則、猜測選擇介面或其他卡牌動畫。

## Capabilities

### New Capabilities

- `intern-guess-prompt-animation`: 定義正式遊戲中實習生猜測提示的資料契約、文字內容、顯示順序與共同退場行為。

### Modified Capabilities

(none)

## Impact

- Affected specs: intern-guess-prompt-animation
- Affected code:
  - Modified: server/src/services/cardEffectAnimationService.js
  - Modified: src/composables/useGameSocketActions.js
  - Modified: src/components/game/ui/GameStage.vue
  - Modified: src/composables/useGameStageCardPlay.js
  - Modified: src/components/game/animations/InternAnimation.vue
  - Modified: tests/card-play-interaction.test.mjs
  - New: server/tests/cardEffectAnimationService.test.js
  - Removed: none
