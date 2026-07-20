## Why

電腦玩家目前打出實習生時固定猜測 `CEO`，使行為完全可預測。電腦應從合法職位中隨機猜測，同時利用自己確定掌握的唯一牌資訊，避免猜測不可能出現在目標手上的職位。

## What Changes

- 電腦玩家打出實習生時，從點數 2～8 的職位中等機率隨機選擇猜測。
- 從後端正式牌組統計每個職位的牌數；若電腦自己持有牌組中只有一張的職位，該職位不得進入猜測候選清單。
- 電腦自己持有牌組中有多張的職位時，該職位仍保留為合法猜測，因為其他玩家仍可能持有另一張。
- 猜測方法接受可注入亂數來源，讓測試能穩定驗證候選清單前後位置與排除規則。
- 更新電腦玩家決策測試，移除固定猜 `CEO` 的舊預期並覆蓋新的隨機策略。
- 為電腦回合 readiness 使用較長的專用 Socket ACK timeout，避免後端完成抽牌、出牌與資料庫寫入接近共用 5 秒上限時被前端誤判失敗。

## Non-Goals

- 不根據目標玩家、棄牌堆、已公開資訊或剩餘牌堆進行機率加權。
- 不讓電腦玩家讀取正常遊戲規則下不可見的其他玩家手牌。
- 不修改電腦玩家的出牌優先順序、目標玩家選擇或其他卡牌策略。
- 不修改真人玩家的實習生猜牌流程、前端選項、動畫或 Socket payload 格式。
- 不調整既有動畫內容、速度或後端電腦出牌規則。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `computer-player-turns`: 電腦玩家打出實習生時，必須從合法職位中等機率隨機猜測並排除自己持有的唯一牌職位；前端等待後端完成電腦回合時不得沿用不足以涵蓋完整操作的共用 ACK timeout。

## Impact

- Affected specs: `computer-player-turns`
- Affected code:
  - Modified:
    - `server/src/services/computerPlayerService.js`
    - `server/tests/computerPlayerService.test.js`
    - `src/composables/useGameSocketActions.js`
    - `tests/computer-player-animation-ack.test.mjs`
  - New: none
  - Removed: none
