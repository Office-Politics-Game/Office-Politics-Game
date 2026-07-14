## Context

目前 `UsePreGameAudio` 集中處理登入前與登入後大廳音樂，`Loading` 仍在 pre-game 路由清單中，因此 `pre-game-lobby-theme.mp3` 會持續播放到 Loading 結束。`GameView` 進入 `/game` 後會先呈現內部 `LoadingScreen`，只有 `hasLoadedInitialState` 為 true 才掛載 `GameStage`。牌桌音樂必須以這個狀態為啟動條件，不能只依賴路由名稱。

既有 `UseAudioSettings` 提供全域共享的 `musicEnabled` 與 `musicVolume` ref。新控制器不得建立第二份設定狀態，也不得修改後端、Socket.IO 或牌局規則。

## Goals / Non-Goals

**Goals:**

- 進入 Loading 時讓 pre-game 大廳主題以 4000ms 線性淡出，完成後暫停並將播放位置重設為 0。
- 初始牌局資料成功載入且 `GameStage` 顯示後，讓 `game-table-start-theme.mp3` 播放並以 5000ms 線性淡入；該檔案每次自然播完後，下一輪也重新以 5000ms 線性淡入。
- 牌桌音樂使用共享音樂開關與音量，基礎增益固定為 0.2。
- 離開牌桌時清除計時器、停止音樂並重設播放位置。
- 從 `Game` 返回大廳時，讓 `pre-game-lobby-theme.mp3` 保持停止並重設，不因目標屬於 pre-game 路由而恢復播放。
- 保留其他路由現有的 900ms 大廳淡入淡出行為。

**Non-Goals:**

- 不修改 Loading 畫面長度、進度動畫或遊戲資料載入流程。
- 不做大廳與牌桌音樂交叉混音；Loading 是兩首音樂之間的安靜過渡區。
- 不新增音樂選曲、播放清單、後端同步或個別牌桌音量設定。
- 不改變 `pre-game-lobby-theme.mp3`、登入音樂、腳步聲或其他全域音效的重播行為。
- 不禁止使用者之後透過正常的大廳音樂啟動流程重新播放，也不改變非 `Game` 來源進入大廳的既有行為。
- 不把音樂生命週期放進 `GameStage`，避免展示頁或其他重用場景自動播放。

## Decisions

### Loading 使用現有 pre-game 控制器執行 4000ms 淡出

將 `Loading` 從一般 pre-game 持續播放路由中排除，並讓 `syncPreGameRouteAudio` 在路由為 `Loading` 時把 4000ms 傳入可設定時長的淡出流程。其他離開 pre-game 的路由仍使用 900ms，商城保留既有 activation 行為。

替代方案是在 `LoadingView` 的 `onMounted` 直接停止音樂；未採用，因為路由音訊同步已集中在 `App.vue` 與 `UsePreGameAudio`，把相同責任放入畫面元件會形成兩個入口。

### 獨立 UseGameTableAudio 管理牌桌背景音樂

新增 `useGameTableAudio()`，對外提供 `startGameTableBackground()` 與 `stopGameTableBackground()`。控制器延遲建立單一 `Audio` 實例，設定 `loop = false`、`preload = "auto"`，並以模組層狀態避免同一頁建立多個播放器或 watcher。重播由同一實例的 `ended` 事件處理，以便每輪重新套用淡入。

替代方案是擴充 `UsePreGameAudio`；未採用，因為牌桌音樂的啟動條件是遊戲資料狀態而非 pre-game 路由，混在同一控制器會模糊責任。也不採路由為 `Game` 就播放的方式，因為此時 `GameView` 可能仍顯示 `LoadingScreen`。

### GameView 以正式 GameStage 顯示狀態啟動音樂

`GameView` 監看 `hasLoadedInitialState`。狀態第一次或重新變為 true 時呼叫 `startGameTableBackground()`；狀態為 false 時不啟動。元件卸載時一律呼叫 `stopGameTableBackground()`，與 Socket 清理並列但互不依賴。

控制器的 start 必須具備冪等性：已播放或正在淡入時重複呼叫不得重設 `currentTime`、不得建立第二個 interval，也不得重新從零淡入。

### game-table-start-theme 每輪結束後手動重播並重新淡入

`game-table-start-theme.mp3` 不使用原生 loop。控制器在建立唯一 Audio 實例時只註冊一次 `ended` listener；當牌桌仍為 active、`musicEnabled` 為 true 且目標音量大於 0，listener 將 `currentTime` 重設為 0，並重用既有 `fadeInGameTableMusic()` 執行 5000ms 淡入。牌桌已離開、音樂已關閉或音量為 0 時不得重播。

此 listener 僅綁定牌桌主題的 Audio 實例，不接觸 `UsePreGameAudio` 或任何音效播放器。替代方案是保留 `loop = true`；未採用，因為瀏覽器原生循環不會在每輪開始時自動重跑淡入邏輯。

### Game 返回大廳時明確抑制 pre-game-lobby-theme

`App.vue` 已取得目前與前一個路由名稱，並用 `previousRouteName` 處理商城返回大廳的淡入特例。沿用相同轉場判斷，在來源為 `Game` 時把 `suppressBackground` 傳給 `syncPreGameRouteAudio`。目標是 pre-game 路由且此旗標為 true 時，控制器必須清除既有淡出、pause 並重設 `pre-game-lobby-theme.mp3`，同時清除既有的自動啟動狀態，避免返回大廳後又由 watcher 恢復播放。

此旗標只控制 pre-game 大廳主題，不寫入共享 `musicEnabled`／`musicVolume`，不處理牌桌主題的卸載停止，也不接觸登入音樂、腳步聲或音效。替代方案是在返回按鈕元件直接控制 Audio；未採用，因為同一路由可能由不同 UI 入口觸發，轉場音訊契約應集中在根路由 watcher 與 pre-game 控制器。

### 共用音樂設定並動態解析淡入目標

牌桌音樂目標音量為 `clamp(musicVolume / 100) * 0.2`。音樂停用或目標音量為 0 時不播放；牌桌已啟動後將音樂切為啟用時，從 0 開始執行 5000ms 淡入。調整音量時控制器更新目前音量與淡入目標，不修改音效開關或音效音量。

瀏覽器拒絕 `audio.play()` 的 Promise 時維持既有音訊策略：吞掉拒絕，不阻斷畫面載入或顯示錯誤訊息。下一次有效的音樂啟用或 start 呼叫可再次嘗試播放。

## Implementation Contract

- **Observable behavior:** 由任何 pre-game 頁面進入 `Loading` 後，`pre-game-lobby-theme.mp3` 在 4000ms 內從目前音量線性降至 0，接著 pause 並將 `currentTime` 設為 0。Loading 期間不播放 `game-table-start-theme.mp3`。
- **Observable behavior:** `GameView` 尚未完成初始資料載入時只顯示 `LoadingScreen` 且不啟動牌桌音樂；`hasLoadedInitialState` 變為 true、`GameStage` 成為主畫面時，牌桌音樂以 5000ms 從 0 線性淡入到共享音量乘以 0.2。
- **Observable behavior:** 僅當 `game-table-start-theme.mp3` 自然播放完畢且牌桌仍為 active 時，同一 Audio 實例從 0 秒重播，音量歸零後再次用 5000ms 淡入；其他背景音樂與音效不受影響。
- **Observable behavior:** 當來源路由為 `Game` 且目標為 pre-game 大廳時，`pre-game-lobby-theme.mp3` 保持暫停、`currentTime` 重設為 0，且不執行淡入或自動恢復；從其他來源進入大廳時維持既有同步行為。
- **Interface:** `useGameTableAudio()` 回傳 `startGameTableBackground(): void` 與 `stopGameTableBackground(): void`。start 是冪等操作；stop 清除淡入 interval、pause 並將 `currentTime` 重設為 0。
- **Interface:** `syncPreGameRouteAudio(routeName, { fadeIn, suppressBackground })` 接受可選的 `suppressBackground` 布林值；省略時為 false，保留既有呼叫行為。
- **Settings behavior:** `musicEnabled === false` 或 `musicVolume === 0` 時牌桌音樂不得播放。正式牌桌已啟動後重新開啟音樂時執行完整 5000ms 淡入；音量變更套用 0.2 增益並保持在 0 到 1 範圍。
- **Failure mode:** 不支援 Audio 的環境直接 no-op。play Promise 被瀏覽器拒絕時安靜失敗，不得造成未處理 rejection、路由中斷或牌桌載入失敗。
- **Acceptance criteria:** `node tests/pre-game-audio.test.mjs` 驗證 Loading 路由不再持續 pre-game 音樂、4000ms 淡出契約及 `Game` 返回大廳時的明確抑制；`node tests/game-table-audio.test.mjs` 驗證資產、控制器介面、5000ms 淡入、循環播放、設定同步、GameView 啟動條件及卸載清理；`npm run build` 成功。
- **In scope:** 前端背景音樂控制器、Loading 路由音訊切換、GameView 生命週期、`game-table-start-theme.mp3` 的每輪重播淡入、聚焦測試與既有 MP3 資產。
- **Out of scope:** 後端、Socket.IO 事件、遊戲規則、Loading 視覺時間、其他背景音樂與遊戲音效、音訊格式轉換與媒體檔內容編輯。

## Risks / Trade-offs

- [瀏覽器自動播放政策可能拒絕延後的 play 呼叫] → 捕捉 Promise rejection，保證 UI 不受影響；後續音樂設定互動可再次嘗試。
- [兩個獨立控制器可能短暫同時存在] → Loading 的 5200ms 視覺流程長於 4000ms 淡出，且牌桌音樂只在 GameStage 顯示後啟動，不做重疊交叉淡入。
- [元件重載或狀態重複通知造成多個淡入計時器] → start 採冪等檢查，建立新 interval 前先清除既有牌桌淡入 interval。
- [共享音量在淡入中改變] → 每次 tick 依目前共享設定重新解析目標音量，完成時寫入最新目標值。
- [原生 loop 無法保證每輪重新淡入] → 關閉原生 loop，只在牌桌主題的 `ended` listener 中手動重播並重用相同淡入函式。
- [只靠目標路由無法區分一般進入大廳與牌桌返回] → 根路由 watcher 明確傳遞 `previousRouteName === "Game"` 的轉場旗標，pre-game 控制器只在該旗標下抑制主題。
