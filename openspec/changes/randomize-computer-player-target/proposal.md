## Why

電腦玩家目前會固定選擇合法目標清單中的第一位玩家。在一位真人房主與三位電腦玩家的常見座位順序中，這會讓所有電腦玩家持續針對真人房主，造成不自然且可預測的遊戲體驗。此外，前端提交七號牌名稱 `Advisor`，後端牌組則使用 `Adviser`，目前以字串完全相等判定，導致實習生猜七號牌時效果與動畫都固定判定為猜錯。

## What Changes

- 電腦玩家使用需要指定目標的卡牌時，改為從所有合法存活目標中等機率隨機選擇。
- 保留既有目標限制：已淘汰玩家不可選、非 PM 卡牌不可選自己、PM 仍可選自己。
- 目標選擇接受可注入的亂數來源，讓測試能穩定驗證不同候選目標。
- 更新電腦玩家決策單元測試，覆蓋隨機目標、淘汰玩家與自我指定規則。
- 後端將七號牌的 `Advisor` 與 `Adviser` 視為同一職位，並讓實習生淘汰效果與動畫 outcome 共用一致的牌名比對規則。
- 新增實習生效果與動畫回歸測試，證明提交 `Advisor` 時能猜中後端保存為 `Adviser` 的七號牌。
- 驗收以電腦玩家決策目標測試與 Spectra analyzer 為準；完整後端測試套件的既有失敗記錄為 baseline。

## Non-Goals

- 不調整電腦玩家的出牌優先順序。
- 不調整 Intern 固定猜測 CEO 的策略。
- 不修改前端七號牌顯示名稱、Socket 出牌 payload 或牌組資料的既有 `Adviser` 名稱。
- 不建立一般化的職位別名系統，也不改變七號牌以外的牌名比對規則。
- 不加入權重式、記憶式或難度分級 AI。
- 不改變受保護玩家目前的效果處理規則。
- 不修復與本 change 無關的既有後端測試失敗。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `computer-player-turns`: 電腦玩家執行需指定目標的卡牌時，必須從符合既有卡牌規則的候選玩家中隨機選擇，而不是固定選擇座位排序第一位。
- `intern-guess-prompt-animation`: 實習生猜測七號牌時，後端必須將 `Advisor` 與 `Adviser` 視為相同職位，並以相同結果驅動淘汰效果與動畫 outcome。

## Impact

- Affected specs: `computer-player-turns`, `intern-guess-prompt-animation`
- Affected code:
  - Modified:
    - `server/src/services/computerPlayerService.js`
    - `server/src/services/cardEffectService.js`
    - `server/src/services/cardEffectAnimationService.js`
    - `server/tests/computerPlayerService.test.js`
    - `server/tests/cardEffectService.test.js`
    - `server/tests/cardEffectAnimationService.test.js`
  - New:
    - `server/src/game/cardNames.js`
  - Removed: none
