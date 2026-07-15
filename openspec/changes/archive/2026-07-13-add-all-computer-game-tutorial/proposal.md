## Why

目前 /game 缺少能直接指出牌桌區域與勝利規則的操作引導，玩家即使在一名真人與三名電腦的練習情境中，也必須自行摸索抽牌、手牌與棄牌的位置。導覽若與第一回合廣播同時出現，或在對局已出牌後重新進入仍重複顯示，也會干擾實際遊玩，因此教學必須限定在首次出牌前並與開局時序整合。

## What Changes

- 在 /game 牌桌完成渲染後，判斷玩家組合是否恰好為一名真人與三名電腦，且目前遊戲 session 尚未成功出牌。
- 符合全電腦對手條件時，整場第一回合固定由唯一真人玩家先手；後續回合維持既有隨機先手。
- 遊戲 session 以 `hasAnyCardBeenPlayed` 記錄是否曾成功出牌；首次成功出牌後，即使重新進入 /game 或進入後續回合也不再啟動導覽。
- 現有「第 1 回合開始」廣播等待導覽完成、略過、關閉或確認無需顯示後才播放；不新增獨立「遊戲開始」廣播。
- 導覽依序聚焦抽牌區、真人玩家手牌區、棄牌區，最後同時框選其餘三位玩家座位。
- 最後一個步驟說明淘汰其他玩家的回合目標，以及率先累積 3 次回合勝利即贏得整場遊戲的規則。
- 條件不成立、必要目標尚未存在或元件已卸載時，不啟動或安全結束導覽，不阻斷遊戲操作。
- 導覽樣式配合 Square UI 的兩檔橫向固定尺寸規範；略過控制維持橫向文字，深色遮罩加深，透明目標區與三位對手使用藍色邊框及光暈。

## Capabilities

### New Capabilities

- all-computer-game-tutorial: 定義全電腦對手遊戲情境的觸發條件、固定導覽順序、規則內容與安全生命週期。

### Modified Capabilities

(none)

## Impact

- Affected specs: all-computer-game-tutorial
- Affected code:
  - New: src/composables/UseGameTutorial.js, src/assets/styles/game-tutorial.css, tests/game-tutorial.test.mjs
  - Modified: src/main.js, src/views/GameView.vue, src/components/game/ui/GameStage.vue, src/components/game/ui/TableCardPiles.vue, src/components/game/ui/PlayerHand.vue, src/components/game/ui/PlayerSeats.vue, src/composables/useGameStageDrawSequence.js, server/src/game/initialState.js, server/src/services/gameActionService.js, server/src/services/gameStateService.js, server/src/services/roundService.js, server/tests/roundService.test.js, server/tests/roundFlowService.test.js, tests/round-start-notice.test.mjs
  - Removed: none
- Dependencies: 使用 intro.js；公開遊戲狀態增加 `hasAnyCardBeenPlayed`，但不新增 endpoint、資料庫欄位或 Socket.IO 事件。

