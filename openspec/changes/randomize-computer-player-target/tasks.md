## 1. 迴歸測試

- [x] 1.1 在 `server/tests/computerPlayerService.test.js` 先建立會失敗的迴歸測試，證明「Computer turns are decided by the backend」時可透過注入亂數選到第一位以外的合法真人或電腦玩家，且淘汰玩家、非 PM 自己與 PM 自己的資格符合規格；以 `npm test -- --runInBand --forceExit tests/computerPlayerService.test.js` 出現預期目標不符失敗作為 RED 驗證。

## 2. 目標選擇實作

- [x] 2.1 在 `server/src/services/computerPlayerService.js` 讓需指定目標的卡牌從 `getAliveTargets()` 候選者中使用可注入的 `random` 等機率選擇，並保持無候選者回傳 `undefined` 與現有卡牌自我指定規則；以 `npm test -- --runInBand --forceExit tests/computerPlayerService.test.js` 全數通過驗證。

## 3. 整體驗證

- [x] 3.1 確認電腦玩家目標隨機化符合規格，並以 `npm test -- --runInBand --forceExit tests/computerPlayerService.test.js` 全數通過及 `spectra analyze randomize-computer-player-target --json` 無 Critical 或 Warning 驗證；完整後端測試套件目前 282 個測試中有 24 個與本 change 無關的既有失敗，記錄為 baseline 且不納入本任務修復範圍。

## 4. 實習生七號牌迴歸測試

- [x] 4.1 先為「Intern guess treats Advisor and Adviser as equivalent」建立 RED 測試：在 `server/tests/cardEffectService.test.js` 驗證目標持有 `{ id: 7, name: "Adviser" }` 且猜測 `Advisor` 時會被淘汰，在 `server/tests/cardEffectAnimationService.test.js` 驗證相同輸入保留原始猜測並產生 `outcome: "correct"`；以 `npm test -- --runInBand --forceExit tests/cardEffectService.test.js tests/cardEffectAnimationService.test.js` 出現預期的猜錯失敗驗證測試能重現問題。

## 5. 共用牌名比對實作

- [x] 5.1 實作「Intern guess treats Advisor and Adviser as equivalent」：在 `server/src/game/cardNames.js` 新增後端共用牌名比對 helper，僅將七號牌別名 `Advisor` 與 `Adviser` 正規化為同一值，並讓 `useIntern` 與 `buildCardEffectAnimationResult` 共用該 helper；其他職位仍維持既有完全相等語意，前端與 Socket payload 不變；以 `npm test -- --runInBand --forceExit tests/cardEffectService.test.js tests/cardEffectAnimationService.test.js -t "猜 Advisor|treats an Advisor"` 驗證兩個新增回歸案例全數通過。

## 6. 實習生修正整體驗證

- [x] 6.1 確認七號牌猜測的淘汰狀態與動畫 outcome 一致：執行 `npm test -- --runInBand --forceExit tests/cardEffectService.test.js tests/cardEffectAnimationService.test.js -t "猜 Advisor|treats an Advisor"` 與 `npm test -- --runInBand --forceExit tests/computerPlayerService.test.js` 必須全數通過，並以 `spectra analyze randomize-computer-player-target --json` 無 Critical 或 Warning 驗證；另執行兩個完整卡牌效果測試檔確認失敗數由 RED 的 9 個降回既有 7 個 `ownerPlayerId` baseline，完整後端測試套件的既有 24 個無關失敗不擴大本次修正範圍。
