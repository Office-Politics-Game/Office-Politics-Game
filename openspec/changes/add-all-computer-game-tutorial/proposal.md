## Why

目前 /game 缺少能直接指出牌桌區域與勝利規則的操作引導，玩家即使在全電腦對手的練習情境中，也必須自行摸索抽牌、手牌與棄牌的位置。當真人玩家的其餘對手全為電腦時，每次進入遊戲自動顯示短導覽，可把這個情境明確定位為可重複學習的遊戲介紹。

## What Changes

- 在 /game 牌桌完成渲染後，判斷目前真人玩家以外的所有玩家是否皆為電腦玩家。
- 條件成立時，每次進入遊戲皆啟動 Intro.js 導覽，不記錄已讀狀態。
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
  - Modified: src/main.js, src/components/game/ui/GameStage.vue, src/components/game/ui/TableCardPiles.vue, src/components/game/ui/PlayerHand.vue, src/components/game/ui/PlayerSeats.vue
  - Removed: none
- Dependencies: 使用已安裝的 intro.js，不新增後端 API、資料庫欄位或 Socket.IO 事件。

