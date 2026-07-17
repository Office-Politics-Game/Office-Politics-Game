## 1. 迴歸測試

- [x] 1.1 在 `server/tests/computerPlayerService.test.js` 先建立會失敗的迴歸測試，證明「Computer turns are decided by the backend」時可透過注入亂數選到第一位以外的合法真人或電腦玩家，且淘汰玩家、非 PM 自己與 PM 自己的資格符合規格；以 `npm test -- --runInBand --forceExit tests/computerPlayerService.test.js` 出現預期目標不符失敗作為 RED 驗證。

## 2. 目標選擇實作

- [x] 2.1 在 `server/src/services/computerPlayerService.js` 讓需指定目標的卡牌從 `getAliveTargets()` 候選者中使用可注入的 `random` 等機率選擇，並保持無候選者回傳 `undefined` 與現有卡牌自我指定規則；以 `npm test -- --runInBand --forceExit tests/computerPlayerService.test.js` 全數通過驗證。

## 3. 整體驗證

- [x] 3.1 確認電腦玩家目標隨機化符合規格，並以 `npm test -- --runInBand --forceExit tests/computerPlayerService.test.js` 全數通過及 `spectra analyze randomize-computer-player-target --json` 無 Critical 或 Warning 驗證；完整後端測試套件目前 282 個測試中有 24 個與本 change 無關的既有失敗，記錄為 baseline 且不納入本任務修復範圍。
