## Why

電腦玩家目前會固定選擇合法目標清單中的第一位玩家。在一位真人房主與三位電腦玩家的常見座位順序中，這會讓所有電腦玩家持續針對真人房主，造成不自然且可預測的遊戲體驗。

## What Changes

- 電腦玩家使用需要指定目標的卡牌時，改為從所有合法存活目標中等機率隨機選擇。
- 保留既有目標限制：已淘汰玩家不可選、非 PM 卡牌不可選自己、PM 仍可選自己。
- 目標選擇接受可注入的亂數來源，讓測試能穩定驗證不同候選目標。
- 更新電腦玩家決策單元測試，覆蓋隨機目標、淘汰玩家與自我指定規則。
- 驗收以電腦玩家決策目標測試與 Spectra analyzer 為準；完整後端測試套件的既有失敗記錄為 baseline。

## Non-Goals

- 不調整電腦玩家的出牌優先順序。
- 不調整 Intern 固定猜測 CEO 的策略。
- 不加入權重式、記憶式或難度分級 AI。
- 不改變受保護玩家目前的效果處理規則。
- 不修復與本 change 無關的既有後端測試失敗。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `computer-player-turns`: 電腦玩家執行需指定目標的卡牌時，必須從符合既有卡牌規則的候選玩家中隨機選擇，而不是固定選擇座位排序第一位。

## Impact

- Affected specs: `computer-player-turns`
- Affected code:
  - Modified:
    - `server/src/services/computerPlayerService.js`
    - `server/tests/computerPlayerService.test.js`
  - New: none
  - Removed: none
