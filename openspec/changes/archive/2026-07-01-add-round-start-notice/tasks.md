## 1. 前端提示流程

- [x] 1.1 在 src/components/game/GameStage.vue 加入 Round start notice 狀態與顯示流程，讓初始發牌動畫完成後先顯示「第 X 回合開始」，再觸發既有「輪到你」提示；以手動進入遊戲桌並觀察提示順序驗證。
- [x] 1.2 在 src/components/game/GameStage.vue 監聽 roundNumber 變化，讓後續新回合在發牌流程完成後顯示 Round start notice，且不新增後端欄位或 socket event；以 source review 確認只使用既有 roundNumber prop 與 FlyInTextModal.vue。
- [x] 1.3 確保 Round start notice 與既有 isTurnNoticeOpen、isRoundWinnerNoticeOpen 不同時覆蓋造成提示競態；以手動測試第一回合開始與下一回合開始兩個場景驗證。

## 2. 測試與驗證

- [x] 2.1 新增 tests/round-start-notice.test.mjs，驗證 GameStage.vue 使用 FlyInTextModal.vue 顯示 Round start notice，且提示文字由 roundNumber 組成；以 node tests\round-start-notice.test.mjs 驗證。
- [x] 2.2 更新或新增 source-level assertion，驗證 Round start notice 的觸發順序早於 playTurnNotice；以 node tests\round-start-notice.test.mjs 驗證。
- [x] 2.3 執行 npm.cmd run build，驗證 Vue production build 通過且沒有新增後端依賴。
