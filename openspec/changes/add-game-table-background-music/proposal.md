## Why

目前進入遊戲牌桌的 Loading 與正式牌桌階段缺少能配合場景轉換的牌桌主題音樂；此外，從進行中的牌桌返回大廳時，pre-game 大廳主題沒有恢復，而現有洗牌效果音長達約 3 秒、單層且增益過高。需要讓 Loading 成為明確的音樂過渡區、在牌桌真正可互動時以較長淡入建立開場氛圍、讓牌桌返回大廳後重新淡入 pre-game 主題，並讓洗牌聲與動畫時長及層次一致。

## What Changes

- 進入 Loading 路由時，讓 `pre-game-lobby-theme.mp3` 以 4000ms 淡出後停止並重設。
- 新增獨立牌桌背景音樂控制器，播放 `game-table-start-theme.mp3`；每次該檔案自然播放完畢後，從 0 秒手動重播並重新執行 5000ms 淡入。
- 僅在 `GameView` 完成初始資料載入並顯示 `GameStage` 時，以 5000ms 淡入牌桌主題。
- 牌桌主題共用現有音樂啟用狀態與音量設定，使用與大廳背景音樂一致的 0.2 基礎增益。
- 離開 `GameView` 時停止並重設牌桌主題，避免音樂外溢到其他頁面。
- 在進入遊戲前已啟動大廳音樂的前提下，Loading 與 Game 期間保留 pre-game 音樂 activation；從 `Game` 返回大廳時，讓 `pre-game-lobby-theme.mp3` 以既有 900ms 淡入恢復播放。
- 重播淡入只套用於 `game-table-start-theme.mp3`，不改變其他背景音樂或全域音效。
- 洗牌動畫開始時使用兩個 `game-card-shuffle.ogg` Audio 實例：主層立即播放、第二層延遲 100ms，兩層各播放 1200ms，並分別套用共享音效音量的 0.25 與 0.15 增益。
- 新一輪洗牌開始前清除舊計時器、停止並歸零兩層洗牌音效，避免短時間重播留下殘音。
- 以聚焦的 Node 測試覆蓋 Loading 淡出、正式牌桌淡入、循環播放、設定同步及離場清理契約。

## Capabilities

### New Capabilities

- `game-table-background-music`: 定義從大廳經 Loading 進入正式牌桌時的背景音樂切換，以及牌桌洗牌音效的分層、裁切、音量設定與清理行為。

### Modified Capabilities

（無）

## Impact

- Affected specs: game-table-background-music
- Affected code:
  - New:
    - src/assets/audio/game-table-start-theme.mp3
    - src/assets/audio/game-card-shuffle.ogg
    - src/composables/UseGameTableAudio.js
    - tests/game-table-audio.test.mjs
  - Modified:
    - src/App.vue
    - src/components/game/animations/CardShuffleAnimation.vue
    - src/composables/UsePreGameAudio.js
    - src/views/GameView.vue
    - tests/pre-game-audio.test.mjs
  - Removed: none
- APIs and dependencies: no backend API, Socket.IO contract, package dependency, or database change
