## 1. 回歸契約測試

- [x] 1.1 依「使用既有 Node source-contract 測試形式」在 `tests/lobby-flip-transition.test.mjs` 建立可先重現問題的測試，完整涵蓋 `Stable top-level route component identity`、`Bidirectional Lobby flip transition` 與 `Existing result page transition remains supported`：斷言 RouterView key 不得使用 `route.fullPath` 且須包含頂層 matched record 與 name/path fallback，開始遊玩導向 `LobbyGameMenu`、返回導向 `LobbyHome`，Lobby 維持 700ms 與 reduced-motion `transition: none`，以及 `result-page-slide` 判斷仍存在；以修正前執行 `node tests/lobby-flip-transition.test.mjs` 時 key 契約測試失敗、其餘既有契約斷言可讀為驗證目標。

## 2. RouterView identity 修復

- [x] 2.1 依「使用頂層 matched route 建立穩定 RouterView key」與「提供 route name 與 path 的確定性 fallback」修改 `src/App.vue`：key 優先使用第一個 matched record 的 name、其次該 record path，再退回目前 route name 與 route path，且不得使用 fullPath；完成後 `/lobby` 與 `/lobby/game-menu` 共用 Lobby 實例、不同頂層 route 使用不同 key，並以 `node tests/lobby-flip-transition.test.mjs` 全數通過驗證。
- [x] 2.2 依「保留既有 Transition name 判斷」確認 `route.query.transition === "game-end"` 仍唯一控制 `result-page-slide` 名稱，且不修改 Lobby 的 700ms、緩動曲線、路由名稱、按鈕事件或 reduced-motion CSS；以 `node tests/lobby-flip-transition.test.mjs` 中結算轉場、雙向路由與動態效果契約斷言通過驗證。

## 3. 整體驗證

- [x] 3.1 執行 `node tests/lobby-flip-transition.test.mjs` 與 `npm run build`，確認新增回歸測試全部通過、正式環境建置成功，且 `git diff -- src/App.vue tests/lobby-flip-transition.test.mjs` 顯示變更僅限頂層 RouterView identity 與對應測試，沒有路由重構、載入效能、音效或其他頁面轉場修改。
