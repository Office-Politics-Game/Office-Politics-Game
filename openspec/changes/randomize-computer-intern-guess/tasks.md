## 1. 實習生猜牌迴歸測試

- [x] 1.1 先為「Computer turns are decided by the backend」建立 RED 測試：在 `server/tests/computerPlayerService.test.js` 透過多個可注入亂數值呼叫 `buildPlayPayload()`，驗證電腦持有唯一牌 `CEO` 時所有猜測都排除 `CEO` 且可產生不同合法職位，並驗證持有重複牌 `Manager` 時候選結果仍包含 `Manager`；以 `npm test -- --runInBand --forceExit tests/computerPlayerService.test.js` 出現固定回傳 `CEO` 的預期失敗證明問題可重現。

## 2. 隨機猜牌策略實作

- [x] 2.1 實作「Computer turns are decided by the backend」的實習生猜牌策略：在 `server/src/services/computerPlayerService.js` 從 `createDeck()` 統計點數 2～8 的正式牌名與總張數，建立排除電腦手上唯一牌後的候選清單，並使用既有 `options.random` 等機率選出 `guessedCardName`；不得讀取目標手牌或改變目標選擇、其他卡牌 payload 與真人流程；以 `npm test -- --runInBand --forceExit tests/computerPlayerService.test.js` 全數通過驗證。

## 3. 整體驗證

- [x] 3.1 確認電腦實習生猜測只使用後端牌組中的點數 2～8、排除自己持有的唯一牌且保留重複牌職位，執行 `npm test -- --runInBand --forceExit tests/computerPlayerService.test.js` 與 `spectra analyze randomize-computer-intern-guess --json`，要求目標測試全數通過且 analyzer 無 Critical 或 Warning；另執行完整後端 `npm test -- --runInBand --forceExit`，確認既有 24 個 baseline 失敗不因本變更增加。

## 4. 電腦回合 ACK 迴歸測試

- [x] 4.1 為「Computer turns are decided by the backend」補上 RED 測試：更新 `tests/computer-player-animation-ack.test.mjs`，讓既有 action queue 斷言讀取實際程式所在的 `src/composables/useGameSocketActions.js`，並驗證 `game:ready-for-computer-turn` 使用專用 `15000` 毫秒 timeout、其他 Socket 請求不受影響；以 `node tests/computer-player-animation-ack.test.mjs` 對目前沿用共用 5 秒 timeout 產生預期失敗。

## 5. 電腦回合 ACK timeout 修正

- [x] 5.1 實作「Computer turns are decided by the backend」的專用等待時間：在 `src/composables/useGameSocketActions.js` 為 `game:ready-for-computer-turn` 呼叫傳入 `15000` 毫秒 timeout，保留 `emitWithAck` 的共用預設值與其他事件行為；以 `node tests/computer-player-animation-ack.test.mjs` 全數通過驗證。

## 6. 修正後驗證

- [x] 6.1 執行 `node tests/computer-player-animation-ack.test.mjs`、`npm run build`、`spectra analyze randomize-computer-intern-guess --json` 與 `spectra validate randomize-computer-intern-guess`，確認電腦回合專用 timeout 契約通過、前端可建置且 analyzer 無 Critical 或 Warning；另重跑 `npm test -- --runInBand --forceExit tests/computerPlayerService.test.js`，確認實習生隨機猜牌 13 個測試仍全數通過。
