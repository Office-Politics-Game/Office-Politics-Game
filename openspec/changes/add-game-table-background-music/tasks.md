## 1. Loading 大廳音樂過渡

- [x] 1.1 依照 **Loading fades out the pre-game lobby theme**，先修改 `tests/pre-game-audio.test.mjs`，要求 `Loading` 不再屬於持續播放 pre-game 音樂的路由、進入 Loading 使用 4000ms 淡出、其他離場仍為 900ms；執行 `node tests/pre-game-audio.test.mjs`，確認測試因目前 `Loading` 仍在路由清單且沒有 4000ms 常數而失敗。
- [x] 1.2 實作 **Loading 使用現有 pre-game 控制器執行 4000ms 淡出**：讓 `UsePreGameAudio` 支援指定淡出時長，進入 `Loading` 時線性淡出 4000ms 後 pause 並重設 `currentTime`，同時保留其他路由 900ms 與商城 activation 行為；執行 `node tests/pre-game-audio.test.mjs`，確認所有 pre-game 音訊測試通過。

## 2. 正式牌桌背景音樂

- [x] 2.1 依照 **Game table theme starts only when the table is ready**、**Game table theme follows shared music settings and lifecycle** 與 **Audio playback failures do not block the game**，先建立 `tests/game-table-audio.test.mjs`，覆蓋語意化資產、控制器介面、loop、0.2 增益、5000ms 淡入、冪等 start、設定同步、Audio API no-op、play rejection、`hasLoadedInitialState` 啟動條件及卸載清理；執行 `node tests/game-table-audio.test.mjs`，確認測試因 `UseGameTableAudio.js` 尚不存在且 `GameView` 尚未接線而失敗。
- [x] 2.2 實作 **獨立 UseGameTableAudio 管理牌桌背景音樂** 與 **共用音樂設定並動態解析淡入目標**：新增 `useGameTableAudio()` 的 `startGameTableBackground()`、`stopGameTableBackground()`，延遲建立 loop Audio，使用共享 `musicEnabled`／`musicVolume`、0.2 增益與 5000ms 線性淡入，確保重複 start 不重啟、stop 清除 interval 並重設，且 Audio 不可用或 play Promise 拒絕時不拋錯；執行 `node tests/game-table-audio.test.mjs`，確認控制器相關 assertions 通過，剩餘失敗僅限尚未完成的 `GameView` 接線。
- [x] 2.3 實作 **GameView 以正式 GameStage 顯示狀態啟動音樂**：監看 `hasLoadedInitialState`，只有狀態為 true、畫面切為 `GameStage` 時呼叫 `startGameTableBackground()`，並在 `onBeforeUnmount` 呼叫 `stopGameTableBackground()`；執行 `node tests/game-table-audio.test.mjs`，確認 Loading 期間不啟動、正式牌桌啟動及離場清理 assertions 全部通過。

## 3. 整合驗證

- [x] 3.1 驗證完整背景音樂契約沒有破壞既有流程：依序執行 `node tests/pre-game-audio.test.mjs`、`node tests/game-table-audio.test.mjs` 與 `npm run build`，確認兩個測試檔零失敗且 Vite production build 成功。

## 4. game-table-start-theme 每輪重播淡入

- [x] 4.1 依照 **Game table theme starts only when the table is ready** 與 **game-table-start-theme 每輪結束後手動重播並重新淡入**，先擴充 `tests/game-table-audio.test.mjs`，要求 `game-table-start-theme.mp3` 關閉原生 loop、只註冊一次 `ended` listener，並在牌桌 active 且音樂可播放時重設同一實例、從零音量重新執行 5000ms 淡入，同時確認測試沒有要求變更其他音訊控制器；執行 `node tests/game-table-audio.test.mjs`，確認測試因目前仍使用 `loop = true` 且沒有 ended handler 而失敗。
- [x] 4.2 實作 **game-table-start-theme 每輪結束後手動重播並重新淡入**：只修改 `src/composables/UseGameTableAudio.js`，將牌桌主題改為手動 ended 重播，重用 `fadeInGameTableMusic()`，並在牌桌 inactive、`musicEnabled === false` 或 `musicVolume === 0` 時不重播；執行 `node tests/game-table-audio.test.mjs`，確認每輪淡入、單一 listener、禁止重播條件與既有首次淡入 assertions 全部通過。
- [x] 4.3 重新驗證追加需求未影響其他音訊與牌桌流程：依序執行 `node tests/pre-game-audio.test.mjs`、`node tests/game-table-audio.test.mjs`、`node tests/game-view-refactor.test.mjs` 與 `npm run build`，確認測試零失敗且 Vite production build 成功。

## 5. Game 返回大廳音訊抑制

- [x] 5.1 依照 **Returning from Game keeps the pre-game lobby theme stopped**，先擴充 `tests/pre-game-audio.test.mjs`，要求根路由同步能辨識 `previousRouteName === "Game"` 並傳遞抑制旗標，且 pre-game 控制器在該轉場 pause、重設並停止自動啟動；執行 `node tests/pre-game-audio.test.mjs`，確認測試因目前尚未提供此轉場契約而失敗。
- [x] 5.2 實作 **Game 返回大廳時明確抑制 pre-game-lobby-theme**：讓根路由 watcher 對 `Game` 來源傳遞 `suppressBackground`，並讓 `syncPreGameRouteAudio` 只對 `pre-game-lobby-theme.mp3` 執行停止、重設與清除 activation，不改變共享音樂設定或其他音訊；執行 `node tests/pre-game-audio.test.mjs`，確認牌桌返回大廳不播放此主題，且其他 pre-game 音訊 assertions 全部通過。
- [x] 5.3 重新驗證修正沒有破壞牌桌音樂與畫面流程：依序執行 `node tests/pre-game-audio.test.mjs`、`node tests/game-table-audio.test.mjs`、`node tests/game-view-refactor.test.mjs` 與 `npm run build`，確認測試零失敗且 Vite production build 成功。

## 6. Game 返回大廳恢復音樂

- [x] 6.1 依照 **Returning from Game resumes the pre-game lobby theme**，先把 `tests/pre-game-audio.test.mjs` 中相反的停止測試改為要求 Loading／Game 保留 activation、`previousRouteName === "Game"` 使用 900ms 淡入且不再傳遞 `suppressBackground`；執行 `node tests/pre-game-audio.test.mjs`，確認測試因目前程式仍明確抑制並清除 activation 而失敗。
- [x] 6.2 實作 **Game 返回大廳時保留 activation 並淡入 pre-game-lobby-theme**：根路由 watcher 對 Mall 或 Game 來源傳遞 `fadeIn: true`，移除 `suppressBackground` 介面與停止分支，並讓 `UsePreGameAudio` 只在 `Mall`、`Loading`、`Game` 保留已存在的 activation；執行 `node tests/pre-game-audio.test.mjs`，確認返回大廳以 900ms 恢復主題、Loading／Game 不播放大廳主題、未啟用或音量為 0 時不強制播放，且其他 pre-game assertions 全部通過。
- [x] 6.3 重新驗證恢復播放沒有破壞牌桌主題與畫面生命週期：依序執行 `node tests/pre-game-audio.test.mjs`、`node tests/game-table-audio.test.mjs`、`node tests/game-view-refactor.test.mjs` 與 `npm run build`，確認測試零失敗且 Vite production build 成功。

## 7. 兩層短洗牌音效

- [x] 7.1 依照 **Game card shuffle sound uses two short low-gain layers** 與 **兩層洗牌音效以短裁切與低增益建立層次**，先擴充 `tests/game-table-audio.test.mjs`，要求兩個 `game-card-shuffle.ogg` Audio 實例、1200ms 單層裁切、100ms 第二層延遲、0.25／0.15 增益、三個 timeout 與新一輪播放前的清理；執行 `node --test --test-name-pattern="two short low-gain layers" tests/game-table-audio.test.mjs`，確認測試因目前仍為單層完整播放而失敗。
- [x] 7.2 實作 **兩層洗牌音效以短裁切與低增益建立層次**：只調整 `playGameCardShuffleSound()` 的內部音效管理，主層立即播放、第二層延遲 100ms，兩層各播放 1200ms 並套用共享 `soundVolume` 的 0.25／0.15 增益；每輪開始先清除舊 timeout、pause 並歸零兩層，且 `soundEnabled === false`、`soundVolume === 0`、Audio 不可用或 play Promise 拒絕時維持安靜 no-op；執行 `node tests/game-table-audio.test.mjs`，確認兩層參數、排程、清理、設定與動畫觸發 assertions 全部通過。
- [x] 7.3 重新驗證兩層洗牌音效沒有破壞背景音樂與 pre-game 音訊：執行 `node tests/game-table-audio.test.mjs`、`node tests/pre-game-audio.test.mjs` 與 `npm run build`，確認測試零失敗、Vite production build 成功且輸出包含 `game-card-shuffle-*.ogg`。
