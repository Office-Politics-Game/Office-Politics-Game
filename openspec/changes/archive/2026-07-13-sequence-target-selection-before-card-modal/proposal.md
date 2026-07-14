## Summary

統一需要指定玩家的出牌互動：Manager、HR、PM、Cleaner 與 Intern 都先進入桌面玩家選取模式，選定有效目標後才顯示出牌確認 Modal。

## Motivation

目前 Intern 會先提示「請選擇玩家」，但 Manager、HR、PM、Cleaner 在尚未選定玩家時就同時顯示確認 Modal，造成流程與視覺焦點不一致。統一順序可讓玩家先完成目標選擇，再處理確認或額外選項。

## Proposed Solution

- 所有 `targetMode` 為 `opponent` 或 `anyPlayer` 的待出牌卡，在未選定有效目標前只顯示「請選擇玩家」標語與既有玩家座位選取狀態。
- 選定玩家後關閉目標選取狀態，再顯示既有 `CardPlayConfirmPanel` Modal。
- Intern 選定玩家後仍在同一 Modal 內選擇猜測職位；Manager、HR、PM、Cleaner 則顯示目標摘要並可確認出牌。
- 取消 Modal 後沿用既有取消待出牌行為，不改變卡牌規則、可選目標或送出的出牌 payload。

## Non-Goals

- 不變更後端卡牌效果、Socket/API 合約或電腦玩家決策。
- 不重做玩家座位、確認 Modal 或卡牌效果動畫的視覺樣式。
- 不改變 Senior、Advisor、CEO 等不需指定玩家的出牌流程。

## Capabilities

### New Capabilities

- `targeted-card-play-selection`: 定義所有需指定玩家的卡牌，必須先完成玩家選取，才顯示後續確認 Modal。

### Modified Capabilities

- `intern-guess-prompt-animation`: 移除「只有 Intern 採序列式選人」的限定，使 Intern 流程與共用的目標卡出牌順序一致。

## Impact

- Affected specs: `targeted-card-play-selection`, `intern-guess-prompt-animation`
- Affected code:
  - Modified: `src/composables/useGameStageCardPlay.js`
  - Modified: `src/components/game/ui/GameStage.vue`
  - Modified: `tests/card-play-interaction.test.mjs`
  - Modified: `tests/cardplay-target-selection.test.mjs`
  - New: `openspec/specs/targeted-card-play-selection/spec.md`（封存 change 後建立）
  - Removed: 無
