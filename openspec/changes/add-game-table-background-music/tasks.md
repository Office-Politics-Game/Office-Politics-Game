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

## 8. 初始逐張發牌音效

- [x] 8.1 依照 **Initial deal plays a sound for each dealt card** 與 **初始發牌透過注入播放函式提供逐張音效**，先擴充 `tests/game-table-audio.test.mjs`，要求 `game-card-draw.mp3` 資產、`playGameCardDealSound()`、0.35 增益、共享音效設定與從 0 秒重播；執行 `node --test --test-name-pattern="deal sound at reduced gain" tests/game-table-audio.test.mjs`，確認測試因控制器尚未引用該資產而失敗。
- [x] 8.2 實作 **初始發牌透過注入播放函式提供逐張音效** 的控制器部分：在 `UseGameTableAudio` 延遲建立單一發牌 Audio，提供 `playGameCardDealSound()`，使用 bounded `soundVolume × 0.35`、播放前歸零並沿用安全 `playAudio()`；執行 `node --test --test-name-pattern="deal sound at reduced gain" tests/game-table-audio.test.mjs`，確認控制器測試通過。
- [x] 8.3 依照 **Initial deal plays a sound for each dealt card**，先擴充 `tests/game-table-audio.test.mjs`，要求 `GameStage` 將 callback 注入 `useGameStageDrawSequence()`、初始發牌玩家迴圈在每次 `playDrawAnimation()` 前呼叫一次，且通用 `playDrawAnimation()` 內沒有發牌音效；執行 `node --test --test-name-pattern="initial deal plays one sound" tests/game-table-audio.test.mjs`，確認測試因接線尚未存在而失敗。
- [x] 8.4 實作 **初始發牌透過注入播放函式提供逐張音效** 的序列接線：`GameStage` 傳入 `playGameCardDealSound`，`useGameStageDrawSequence()` 提供 no-op 預設並只在初始發牌玩家迴圈、每次 `playDrawAnimation()` 前呼叫；執行 `node tests/game-table-audio.test.mjs`，確認逐張觸發與一般抽牌隔離 assertions 全部通過。
- [x] 8.5 重新驗證發牌音效沒有破壞抽牌動畫、背景音樂與 pre-game 音訊：執行 `node tests/game-table-audio.test.mjs`、`node tests/card-draw-animation.test.mjs`、`node tests/pre-game-audio.test.mjs` 與 `npm run build`，確認測試零失敗、Vite production build 成功且輸出包含 `game-card-draw-*.mp3`。

## 9. 職場老鳥保護啟動音效

- [x] 9.1 依照 **Senior protection activation plays a dedicated sound** 與 **職場老鳥保護啟動時播放語意化音效**，先擴充 `tests/game-table-audio.test.mjs`，要求語意化資產 `game-senior-protection-activate.mp3`、`playSeniorProtectionActivateSound()`、共享 `soundEnabled`／`soundVolume`、0.45 增益與從 0 秒重播，並要求 `useGameStageEffectAnimation()` 只對 `type === "protection" && sourceType === "senior"` 呼叫一次注入 callback；執行 `node --test --test-name-pattern="Senior protection" tests/game-table-audio.test.mjs`，確認測試因資產尚未改名且控制器與動畫接線尚不存在而失敗。
- [x] 9.2 實作 **職場老鳥保護啟動時播放語意化音效**：將來源音效改名為 `game-senior-protection-activate.mp3`，在 `UseGameTableAudio` 延遲建立單一 Audio 並提供 `playSeniorProtectionActivateSound()`，以 bounded `soundVolume × 0.45` 從 0 秒安全播放；`GameStage` 將 callback 注入 `useGameStageEffectAnimation()`，只在 `senior` 保護動畫開始時呼叫，保護解除及 `cleaner`／`intern`／`manager`／`hr` 擋招不觸發；執行 `node --test --test-name-pattern="Senior protection" tests/game-table-audio.test.mjs`，確認專屬觸發、隔離、設定與安全播放 assertions 全部通過。
- [x] 9.3 重新驗證 **Senior protection activation plays a dedicated sound** 沒有破壞既有牌桌與保護動畫：執行 `node tests/game-table-audio.test.mjs`、`node tests/protection-aura-label.test.mjs`、`node tests/pre-game-audio.test.mjs` 與 `npm run build`，確認測試零失敗、Vite production build 成功且輸出包含 `game-senior-protection-activate-*.mp3`。

## 10. 正式牌桌所有玩家抽牌音效

- [x] 10.1 依照 **Formal game table draws play a sound** 與 **正式牌桌共用抽牌路徑提供逐張音效**，先更新 `tests/game-table-audio.test.mjs`，要求正式牌桌共用 `playDrawAnimation()` 在來源與目標矩形驗證後、self 或 opponent 動畫開始前呼叫一次 `playGameCardDealSound()`，初始發牌迴圈不得直接重複呼叫，且 `CardPlayTestView.vue` 不接線；執行 `node --test --test-name-pattern="formal table plays one deal sound" tests/game-table-audio.test.mjs`，確認測試因觸發仍只位於初始發牌迴圈而失敗。
- [x] 10.2 實作 **正式牌桌共用抽牌路徑提供逐張音效**：將 `playGameCardDealSound()` 從 `playInitialRoundDrawSequence()` 的玩家迴圈移至共用 `playDrawAnimation()` 通過來源／目標矩形驗證後、實際動畫前的位置，讓初始發牌與所有玩家一般抽牌各播放一次，無效矩形、角色效果與展示頁不播放；執行 `node tests/game-table-audio.test.mjs`，確認共用觸發、無效矩形隔離、初始發牌不重複與展示頁隔離 assertions 全部通過。
- [x] 10.3 重新驗證 **Formal game table draws play a sound** 沒有破壞抽牌、socket 與其他音訊流程：執行 `node --test tests/game-table-audio.test.mjs tests/card-draw-animation.test.mjs tests/socket-game-animation.test.mjs tests/pre-game-audio.test.mjs tests/game-view-refactor.test.mjs` 與 `npm run build`，確認測試零失敗、Vite production build 成功且輸出包含 `game-card-draw-*.mp3`。

## 11. 牌桌 UI 共用點擊音效

- [x] 11.1 依照 **Game table UI controls play the shared click sound**，先擴充 `tests/pre-game-audio.test.mjs`，要求 `GameStage` 與 Teleport 的 `GameSettingsModal` 都使用 `useButtonClickAudio()` 並在各自根節點掛載 `@click.capture="handleButtonClick"`；執行 `node --test --test-name-pattern="game table selection and settings buttons" tests/pre-game-audio.test.mjs`，確認測試因兩個元件尚未接線而失敗。
- [x] 11.2 實作 **牌桌與 Teleport 設定視窗共用點擊事件代理**：在 `GameStage` 根節點與 `GameSettingsModal` overlay 各接上 `useButtonClickAudio().handleButtonClick`，讓可用選單、玩家目標頭像、齒輪與設定視窗按鈕各播放一次 `login-button-click`，同時沿用非按鈕、disabled、`aria-disabled="true"`、`soundEnabled === false` 與 `soundVolume === 0` 的靜音行為；執行 `node --test --test-name-pattern="game table selection and settings buttons" tests/pre-game-audio.test.mjs`，確認聚焦測試通過。
- [x] 11.3 重新驗證 **Game table UI controls play the shared click sound** 沒有改變既有牌桌與設定操作：執行 `node tests/pre-game-audio.test.mjs`、`node tests/game-table-audio.test.mjs` 與 `npm run build`，確認測試零失敗且 Vite production build 成功。

## 12. 設定返回大廳恢復 pre-game 音樂

- [x] 12.1 依照 **Returning from Game resumes the pre-game lobby theme** 與 **設定返回大廳沿用元件事件鏈並由 GameView 導頁**，先擴充 `tests/pre-game-audio.test.mjs`，要求 `GameSettingsModal` 的返回按鈕開啟 `return-lobby` 確認、`GameStage` 轉送同名事件、`GameView` 接收後導向命名路由 `LobbyHome`，且 modal 不再直接呼叫 `$router.push('/Lobby')`；執行 `node --test --test-name-pattern="game settings return-lobby" tests/pre-game-audio.test.mjs`，確認測試因目前 modal 仍直接導頁且 `GameView` 未接線而失敗。
- [x] 12.2 實作 **設定返回大廳沿用元件事件鏈並由 GameView 導頁**：讓 `GameSettingsModal` 的返回按鈕呼叫 `openConfirmation('return-lobby')`，確認後沿用既有 emit；`GameStage` 維持轉送，`GameView` 使用 `useRouter()` 的 `router.push({ name: 'LobbyHome' })` 處理 `return-lobby`，使 `App.vue` 既有 `Game → LobbyHome` watcher 恢復 `pre-game-lobby-theme.mp3`，不新增第二個音樂播放入口；執行同一聚焦測試，確認完整事件與命名路由接線通過。
- [x] 12.3 重新驗證 **Return through the game settings modal** 沒有破壞牌桌音訊、設定互動與建置：執行 `node tests/pre-game-audio.test.mjs`、`node tests/game-table-audio.test.mjs`、`node tests/game-view-refactor.test.mjs` 與 `npm run build`，確認測試零失敗且 Vite production build 成功。

## 13. 自訂房間等待室共用點擊音效

- [x] 13.1 依照 **Custom room waiting controls play the shared click sound**，先擴充 `tests/pre-game-audio.test.mjs`，要求 `CustomRoomView` 使用 `useButtonClickAudio()` 並在根 `<main>` 掛載 `@click.capture="handleButtonClick"`；執行 `node --test --test-name-pattern="custom room waiting controls use the shared click sound" tests/pre-game-audio.test.mjs`，確認測試因等待室尚未接線而失敗。
- [x] 13.2 實作 **自訂房間等待室共用點擊事件代理**：在 `CustomRoomView` 根 `<main>` 接上 `useButtonClickAudio().handleButtonClick`，讓複製房號、玩家槽操作、邀請好友視窗、返回大廳與開始遊戲等可用按鈕各播放一次 `login-button-click`，同時沿用輸入框、非按鈕、disabled、`aria-disabled="true"`、`soundEnabled === false` 與 `soundVolume === 0` 的靜音行為；執行同一聚焦測試，確認接線 assertions 全部通過。
- [x] 13.3 重新驗證 **Custom room waiting controls play the shared click sound** 沒有改變等待室、其他 pre-game 音訊與建置：執行 `node tests/pre-game-audio.test.mjs` 與 `npm run build`，確認測試零失敗且 Vite production build 成功。

## 14. 正式牌桌所有玩家出牌 rise 音效

- [x] 14.1 依照 **Formal game table card plays use the rise sound** 與 **正式牌桌共用出牌協調層播放 rise 音效**，先擴充 `tests/game-table-audio.test.mjs`，要求非空的 `game-card-play-rise.mp3` 資產、`playGameCardPlaySound()` 單一 Audio、共享 `soundEnabled`／`soundVolume`、0.4 增益與從 0 秒重播，並要求 `GameStage` 將 no-op 預設 callback 注入 `useGameStageCardPlay()`；本地與遠端流程必須在各自矩形 guard 後、`cardPlayAnimation.play()` 前各呼叫一次，展示頁不得接線；執行 `node --test --test-name-pattern="card-play rise sound" tests/game-table-audio.test.mjs`，確認測試因控制器與出牌協調層尚未接線而失敗。
- [x] 14.2 實作 **Formal game table card plays use the rise sound**：`UseGameTableAudio` 延遲建立 `game-card-play-rise.mp3` Audio 並提供 `playGameCardPlaySound()`，以 bounded `soundVolume × 0.4` 從 0 秒安全播放；`GameStage` 將 callback 注入 `useGameStageCardPlay()`，本地 `playActiveCard()` 與遠端 `playRemoteCardPlayAnimation()` 只在卡牌與來源／目標矩形有效、實際動畫開始前各呼叫一次，保留遠端 self-player guard，且 Audio 不可用或 play Promise 拒絕時維持安靜 no-op；執行聚焦測試，確認資產、增益、設定、有效觸發與重複／無效路徑隔離 assertions 全部通過。
- [x] 14.3 重新驗證 **Formal game table card plays use the rise sound** 沒有破壞既有出牌、socket 與其他音訊流程：執行 `node --test tests/game-table-audio.test.mjs tests/card-play-interaction.test.mjs tests/socket-game-animation.test.mjs tests/pre-game-audio.test.mjs` 與 `npm run build`，確認測試零失敗、Vite production build 成功且輸出包含 `game-card-play-rise-*.mp3`。

## 15. 實習生猜牌結果揭露音效

- [x] 15.1 依照 **Intern guess result reveal plays a semantic sound**，先擴充 `tests/game-table-audio.test.mjs`，要求非空的 `intern-guess-correct.mp3` 與 `intern-guess-incorrect.mp3` 資產、`playInternGuessResultSound(outcome)`、只接受 `correct`／`incorrect`、共享 `soundEnabled`／`soundVolume`、0.45 增益、從 0 秒重播與安全 no-op；執行聚焦測試，確認測試因控制器尚未引用兩個資產與提供命令而失敗。
- [x] 15.2 實作控制器：在 `UseGameTableAudio` 延遲建立正確／錯誤兩個 Audio，提供 `playInternGuessResultSound(outcome)`，以 bounded `soundVolume × 0.45` 從 0 秒安全播放；未知 outcome、Audio 不可用或 play Promise 拒絕時維持安靜 no-op，並執行聚焦測試確認通過。
- [x] 15.3 依照 **Intern guess result reveal plays a semantic sound** 與 **實習生動畫在結果文字揭露時送出語意事件**，先擴充 `tests/card-play-interaction.test.mjs` 與 `tests/game-table-audio.test.mjs`，要求 `InternAnimation` 在猜對與猜錯時間軸都於 1 秒提示停留後、結果文字可見前 emit 一次 `outcome-reveal`，`GameStage` 將事件接到 `playInternGuessResultSound`，展示頁不接線；執行聚焦測試，確認測試因事件與接線尚不存在而失敗。
- [x] 15.4 實作 **實習生動畫在結果文字揭露時送出語意事件** 的事件與接線：`InternAnimation` 宣告並在兩條時間軸的精準揭露點 emit `outcome-reveal`，`GameStage` 接到 `playInternGuessResultSound`，展示頁保持無音效；執行聚焦測試，確認猜對／猜錯各一次、順序與展示頁隔離 assertions 全部通過。
- [x] 15.5 重新驗證實習生結果音效沒有破壞既有出牌與牌桌音訊：執行 `node --test tests/game-table-audio.test.mjs tests/card-play-interaction.test.mjs`、`npm run build` 與 `git diff --check`，確認測試零失敗、Vite production build 成功且輸出包含 `intern-guess-correct-*.mp3` 與 `intern-guess-incorrect-*.mp3`。

## 16. game-card-play-rise 前置靜音裁切

- [x] 16.1 依照 **Formal game table card plays use the rise sound** 與 **裁除 game-card-play-rise 前置靜音**，先擴充 `tests/game-table-audio.test.mjs`，要求 `game-card-play-rise.mp3` 保持非空且裁切後檔案大小低於 40 KiB、仍高於 25 KiB，以鎖定原始約 2.04 秒素材已縮短但未被截成空殼；執行 `node --test --test-name-pattern="card-play rise sound asset is trimmed" tests/game-table-audio.test.mjs`，確認測試因目前素材約 49.57 KiB 而失敗。
- [x] 16.2 實作 **裁除 game-card-play-rise 前置靜音**：將 `game-card-play-rise.mp3` 從 0.65 秒起重新輸出為 44.1 kHz stereo、192 kbps MP3，保留完整尾音且不修改播放程式；執行聚焦測試並用 FFmpeg `silencedetect=n=-45dB:d=0.01` 驗證容器長度低於 1.5 秒、前置靜音低於 0.06 秒，確認素材起音延遲已移除。
- [x] 16.3 重新驗證裁切沒有破壞 **Formal game table card plays use the rise sound**：執行 `node --test tests/game-table-audio.test.mjs tests/card-play-interaction.test.mjs tests/socket-game-animation.test.mjs`、`npm run build` 與 `git diff --check`，確認測試零失敗、Vite production build 成功且輸出包含裁切後 `game-card-play-rise-*.mp3`。

## 17. 玩家淘汰提示音效

- [x] 17.1 依照 **Player elimination notice plays a dedicated sound** 與 **玩家淘汰提示開啟時播放語意化音效**，先擴充 `tests/game-table-audio.test.mjs`，要求非空的 `game-player-eliminated.mp3`、`playPlayerEliminatedSound()` 單一 Audio、共享 `soundEnabled`／`soundVolume`、0.45 增益、從 0 秒安全播放，以及 `GameStage` 將 callback 注入 `useGameStageNotices()`、notice 只在 `isPlayerEliminatedNoticeOpen` 實際開啟時呼叫一次；執行 `node --test --test-name-pattern="player elimination notice" tests/game-table-audio.test.mjs`，確認測試因來源檔仍為非語意化名稱且控制器與 notice 尚未接線而失敗。
- [x] 17.2 實作 **玩家淘汰提示開啟時播放語意化音效**：將來源素材改名為 `game-player-eliminated.mp3`，在 `UseGameTableAudio` 延遲建立單一 Audio 並提供 `playPlayerEliminatedSound()`，以 bounded `soundVolume × 0.45` 從 0 秒安全播放；`GameStage` 將 callback 注入 `useGameStageNotices()`，由 `playPlayerEliminatedNotice()` 排定的開啟 callback 在提示設為 open 時呼叫一次，保留 false-to-true 快照判定與 no-op 預設，且音效停用、音量為 0、Audio 不可用或 play Promise 拒絕時不中斷提示；執行聚焦測試確認資產、設定、單次觸發、同步時機與安全 no-op assertions 全部通過。
- [x] 17.3 重新驗證 **Player elimination notice plays a dedicated sound** 沒有破壞既有淘汰提示與牌桌音訊：執行 `node --test tests/game-table-audio.test.mjs tests/round-start-notice.test.mjs`、`npm run build` 與 `git diff --check`，確認測試零失敗、Vite production build 成功且輸出包含 `game-player-eliminated-*.mp3`。

## 18. 人資主管換牌動作 whoosh 音效

- [x] 18.1 依照 **HR card swap motion plays whoosh 04**，先擴充 `tests/game-table-audio.test.mjs`，要求非空且精確 import 的 `game-card-swap-whoosh-04.mp3`、單一 Audio、`playHrCardSwapSound()` 公開命令、共享 `soundEnabled`／`soundVolume`、0.45 增益、從 0 秒重播與既有安全 no-op；執行 `node --test --test-name-pattern="HR card swap sound" tests/game-table-audio.test.mjs`，確認測試因控制器尚未引用資產與提供命令而失敗。
- [x] 18.2 實作控制器：在 `UseGameTableAudio` 延遲建立 `game-card-swap-whoosh-04.mp3` Audio 並提供 `playHrCardSwapSound()`，以 bounded `soundVolume × 0.45` 從 0 秒安全播放；Audio 不可用、音效停用、音量為 0、同步例外或 Promise rejection 時安靜 no-op，執行同一聚焦測試與完整 `tests/game-table-audio.test.mjs` 確認通過。
- [x] 18.3 依照 **HR card swap motion plays whoosh 04** 與 **人資主管換牌動畫在動作起點送出語意事件**，先擴充 `tests/card-effect-result.test.mjs` 與 `tests/game-table-audio.test.mjs`，要求一般及 reduced-motion 時間軸皆為 `1 秒 hold → swap-motion-start → 第一個翻牌／位置交換操作`，全檔恰有兩個 emit 位置，`GameStage` 正式接線且 `CardPlayTestView` 不接線；執行 `node --test --test-name-pattern="HR swap emits|formal table wires HR swap" tests/card-effect-result.test.mjs tests/game-table-audio.test.mjs`，確認兩個新測試因事件與接線不存在而失敗。
- [x] 18.4 實作 **人資主管換牌動畫在動作起點送出語意事件**：`CardSwapAnimation` 在兩條時間軸的 1 秒提示後各 emit `swap-motion-start`，`GameStage` 接到 `playHrCardSwapSound`，展示頁保持靜音；執行相同聚焦測試確認 2/2 通過，並確認 `tests/card-effect-result.test.mjs` 的既有單／雙引號基線失敗數未增加。
- [x] 18.5 重新驗證人資主管換牌音效沒有破壞既有牌桌流程：執行 `node --test tests/game-table-audio.test.mjs tests/card-play-interaction.test.mjs tests/socket-game-animation.test.mjs`、人資主管聚焦測試、`npm run build`、`git diff --check` 與 `spectra validate add-game-table-background-music --strict`，確認新增測試零失敗、Vite 輸出包含非空的 `game-card-swap-whoosh-04-*.mp3`，並記錄 `tests/card-effect-result.test.mjs` 既有 7 個單／雙引號 regex 基線失敗而不擴大修正範圍。
- [x] 18.6 依照 **HR card swap motion plays whoosh 04 followed by whoosh 05**，先擴充 `tests/game-table-audio.test.mjs`，要求非空且精確 import 的 `game-card-swap-whoosh-05.mp3`、04 與 05 各一個 Audio、04 的單一 `ended` listener、04 結束後以共享 `soundEnabled`／`soundVolume × 0.45` 從 0 秒播放 05，以及新序列開始前 pause 並歸零兩段；執行 `node --test --test-name-pattern="HR card swap sound" tests/game-table-audio.test.mjs`，確認測試因 05 尚未接入序列而失敗。
- [x] 18.7 實作 **HR card swap motion plays whoosh 04 followed by whoosh 05**：在 `UseGameTableAudio` 延遲建立 04／05 兩個 Audio，讓 `playHrCardSwapSound()` 清理舊序列並播放 04，再由 04 的 `ended` listener 重新讀取共享音效設定後立即播放 05；音效停用、音量為 0、Audio 不可用、同步例外或 Promise rejection 時安靜 no-op，執行同一聚焦測試與完整 `tests/game-table-audio.test.mjs` 確認通過。
- [x] 18.8 重新驗證 04 → 05 換牌音效序列沒有破壞動畫觸發與牌桌流程：執行 `node --test tests/game-table-audio.test.mjs tests/card-play-interaction.test.mjs tests/socket-game-animation.test.mjs`、`npm run build`、`git diff --check` 與 `spectra validate --changes add-game-table-background-music --strict`，確認新增測試零失敗，Vite 輸出同時包含非空的 `game-card-swap-whoosh-04-*.mp3` 與 `game-card-swap-whoosh-05-*.mp3`，並維持 `tests/card-effect-result.test.mjs` 已知的 7 個基線失敗而不擴大修正範圍。

## 19. 任何玩家小局勝利歡呼音效

- [x] 19.1 依照 **Round winner notice plays a three-second cheer** 與 **小局勝利提示開啟時播放三秒歡呼音效**，先擴充 `tests/game-table-audio.test.mjs`，要求語意化資產 `game-round-win-cheer.mp3` 存在、`kids_cheering.mp3` 不存在、`playRoundWinSound()` 使用單一 Audio、共享 `soundEnabled`／`soundVolume`、0.45 增益與從 0 秒安全播放，並要求 `GameStage` 在任何玩家 `roundWins` 增加的既有 watcher 分支中先播放一次再呼叫 `playRoundWinnerNotice(winner)`，而 `CardPlayTestView` 不接線；執行 `node --test --test-name-pattern="round winner notice plays" tests/game-table-audio.test.mjs`，確認測試因資產尚未改名裁切且控制器與正式牌桌尚未接線而失敗。
- [x] 19.2 實作 **小局勝利提示開啟時播放三秒歡呼音效**：將 `kids_cheering.mp3` 的 0 至 3 秒重新輸出為 `game-round-win-cheer.mp3`，在 2.82 至 3.00 秒套用線性淡出；`UseGameTableAudio` 延遲建立單一 Audio 並提供 `playRoundWinSound()`，以 bounded `soundVolume × 0.45` 從 0 秒安全播放；`GameStage` 只在任何玩家 `roundWins` 相對快照增加時呼叫一次並接續既有勝利提示，展示頁保持靜音；執行聚焦測試及 FFmpeg duration 檢查，確認輸出長度不超過 3.05 秒、所有玩家共用單次觸發、未變更快照不重播，且停用音效、零音量、Audio 不可用或 Promise rejection 時不中斷提示。
- [x] 19.3 重新驗證 **Round winner notice plays a three-second cheer** 沒有破壞既有提示與牌桌音訊：執行 `node --test tests/game-table-audio.test.mjs tests/round-start-notice.test.mjs`、`npm run build`、`git diff --check` 與 `spectra validate add-game-table-background-music --strict`，確認測試零失敗、Vite production build 成功且輸出包含 `game-round-win-cheer-*.mp3`，並確認原始 `kids_cheering.mp3` 未保留。

## 20. 設定返回大廳恢復 pre-game 主題回歸測試

- [x] 20.1 依照 **Return through the game settings modal**，先擴充 `tests/pre-game-audio.test.mjs`，以真實執行 `UsePreGameAudio` 的 Audio mock 要求已確認的設定返回動作能在記憶體 activation 不存在時登記恢復意圖，且 `GameView` 必須在導頁前呼叫該介面；執行聚焦測試，確認因控制器尚未提供恢復介面而失敗。
- [x] 20.2 實作 **確認返回時登記恢復意圖，播放仍由路由 watcher 統一執行**：`UsePreGameAudio` 新增 `requestPreGameBackgroundResume()`，只恢復 activation 與 audio unlock 狀態；`GameView.handleReturnLobby()` 在命名路由導頁前呼叫該方法，不在 `Game` 直接播放，並維持音樂關閉與零音量時靜音。
- [x] 20.3 重新驗證設定返回大廳、牌桌音樂與建置：執行 `node tests/pre-game-audio.test.mjs`、`node tests/game-table-audio.test.mjs`、`npm run build`、`git diff --check` 與 `spectra validate add-game-table-background-music --strict`。
