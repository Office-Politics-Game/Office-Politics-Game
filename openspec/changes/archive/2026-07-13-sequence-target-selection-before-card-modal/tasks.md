## 1. 目標卡序列式互動

- [x] 1.1 在 `src/composables/useGameStageCardPlay.js` 與 `src/components/game/ui/GameStage.vue` 實作「Target selection precedes the card confirmation modal」及「Sequential intern target and position selection」：Manager、HR、PM、Cleaner、Intern 未選定有效玩家前顯示「請選擇玩家」且不顯示 Modal，選定後才關閉選人狀態並開啟既有確認 Modal；以 `node tests/card-play-interaction.test.mjs` 與 `node tests/cardplay-target-selection.test.mjs` 驗證。
- [x] 1.2 確認「Cards without player targets retain their play flow」：補強上述測試，驗證 `targetMode: "none"` 卡牌不會被共用目標選取流程攔截，並以 `npm run build` 驗證 Vue 編譯與整合契約。
