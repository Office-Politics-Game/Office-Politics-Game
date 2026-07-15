## Why

目前進入遊戲牌桌的 Loading 與正式牌桌階段缺少能配合場景轉換的牌桌主題音樂；此外，從進行中的牌桌返回大廳時，pre-game 大廳主題沒有恢復，現有洗牌效果音長達約 3 秒、單層且增益過高，正式牌桌的初始發牌與一般抽牌動畫、「職場老鳥」保護啟動，以及牌桌選擇、設定操作與自訂房間等待室按鈕也缺少一致的聲音回饋。需要讓 Loading 成為明確的音樂過渡區、在牌桌真正可互動時以較長淡入建立開場氛圍、讓牌桌返回大廳後重新淡入 pre-game 主題，並讓牌桌動畫與遊戲前後的 UI 操作各自取得一致且受共享設定控制的音效。

## What Changes

- 進入 Loading 路由時，讓 `pre-game-lobby-theme.mp3` 以 4000ms 淡出後停止並重設。
- 新增獨立牌桌背景音樂控制器，播放 `game-table-start-theme.mp3`；每次該檔案自然播放完畢後，從 0 秒手動重播並重新執行 5000ms 淡入。
- 僅在 `GameView` 完成初始資料載入並顯示 `GameStage` 時，以 5000ms 淡入牌桌主題。
- 牌桌主題共用現有音樂啟用狀態與音量設定，使用與大廳背景音樂一致的 0.2 基礎增益。
- 離開 `GameView` 時停止並重設牌桌主題，避免音樂外溢到其他頁面。
- 在進入遊戲前已啟動大廳音樂的前提下，Loading 與 Game 期間保留 pre-game 音樂 activation；從 `Game` 返回大廳時，讓 `pre-game-lobby-theme.mp3` 以既有 900ms 淡入恢復播放。
- 設定視窗的「返回大廳」改由既有 `return-lobby` 元件事件鏈交給 `GameView` 導向 `LobbyHome`，不再由 Teleport 子元件直接寫死路徑，確保 `Game → LobbyHome` 路由轉場會觸發既有 pre-game 音樂恢復流程。
- 重播淡入只套用於 `game-table-start-theme.mp3`，不改變其他背景音樂或全域音效。
- 洗牌動畫開始時使用兩個 `game-card-shuffle.ogg` Audio 實例：主層立即播放、第二層延遲 100ms，兩層各播放 1200ms，並分別套用共享音效音量的 0.25 與 0.15 增益。
- 新一輪洗牌開始前清除舊計時器、停止並歸零兩層洗牌音效，避免短時間重播留下殘音。
- 正式牌桌每次確認抽牌來源與目標位置有效、即將開始飛牌時播放一次 `game-card-draw.mp3`，使用共享音效音量乘以 0.35；初始發牌與所有玩家的一般抽牌共用此觸發點，角色效果抽牌與動畫展示頁不觸發。
- 將來源檔 `Cheesy force field on and off Sound effect.mp3` 改為語意化的 `game-senior-protection-activate.mp3`，並僅在「職場老鳥」的保護啟動動畫開始時播放一次，使用共享音效設定與 0.45 增益；保護解除及其他卡牌被保護擋下時不播放。
- 牌桌可用的選單選項、玩家目標頭像、右上角設定齒輪，以及 Teleport 設定視窗內的按鈕統一播放既有 `login-button-click`；音量滑桿、停用控制與音效關閉狀態不播放。
- 自訂房間等待室的複製房號、玩家槽操作、邀請好友視窗、返回大廳與開始遊戲等可用按鈕統一播放既有 `login-button-click`；非按鈕區域與停用控制不播放。
- 以聚焦的 Node 測試覆蓋 Loading 淡出、正式牌桌淡入、循環播放、設定同步及離場清理契約。
- 以回歸測試覆蓋設定視窗返回事件從 `GameSettingsModal` 經 `GameStage` 傳到 `GameView`，並由命名路由進入 `LobbyHome` 的完整接線。

## Capabilities

### New Capabilities

- `game-table-background-music`: 定義從大廳經 Loading 進入正式牌桌時的背景音樂切換，以及牌桌洗牌、正式牌桌抽牌、「職場老鳥」保護啟動、牌桌與自訂房間等待室 UI 點擊音效的觸發、音量設定與清理行為。

### Modified Capabilities

（無）

## Impact

- Affected specs: game-table-background-music
- Affected code:
  - New:
    - src/assets/audio/game-table-start-theme.mp3
    - src/assets/audio/game-card-shuffle.ogg
    - src/assets/audio/game-card-draw.mp3
    - src/assets/audio/game-senior-protection-activate.mp3
    - src/composables/UseGameTableAudio.js
    - tests/game-table-audio.test.mjs
  - Modified:
    - src/App.vue
    - src/components/game/animations/CardShuffleAnimation.vue
    - src/components/game/ui/GameStage.vue
    - src/components/game/ui/GameSettingsModal.vue
    - src/composables/useGameStageEffectAnimation.js
    - src/composables/useGameStageDrawSequence.js
    - src/composables/UsePreGameAudio.js
    - src/views/CustomRoomView.vue
    - src/views/GameView.vue
    - tests/pre-game-audio.test.mjs
  - Removed: none
- APIs and dependencies: no backend API, Socket.IO contract, package dependency, or database change
