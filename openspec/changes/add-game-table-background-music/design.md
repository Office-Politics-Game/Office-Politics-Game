## Context

目前 `UsePreGameAudio` 集中處理登入前與登入後大廳音樂，`Loading` 仍在 pre-game 路由清單中，因此 `pre-game-lobby-theme.mp3` 會持續播放到 Loading 結束。`GameView` 進入 `/game` 後會先呈現內部 `LoadingScreen`，只有 `hasLoadedInitialState` 為 true 才掛載 `GameStage`。牌桌音樂必須以這個狀態為啟動條件，不能只依賴路由名稱。

既有 `UseAudioSettings` 提供全域共享的 `musicEnabled` 與 `musicVolume` ref。新控制器不得建立第二份設定狀態，也不得修改後端、Socket.IO 或牌局規則。

既有 `useButtonClickAudio()` 已透過事件委派讓多個登入後頁面與牌桌控制共用 `login-button-click`，並排除 disabled、`aria-disabled="true"` 與非按鈕目標；自訂房間等待室尚未在頁面根節點接上此處理器，因此頁面與子元件按鈕沒有一致的點擊回饋。

## Goals / Non-Goals

**Goals:**

- 進入 Loading 時讓 pre-game 大廳主題以 4000ms 線性淡出，完成後暫停並將播放位置重設為 0。
- 初始牌局資料成功載入且 `GameStage` 顯示後，讓 `game-table-start-theme.mp3` 播放並以 5000ms 線性淡入；該檔案每次自然播完後，下一輪也重新以 5000ms 線性淡入。
- 牌桌音樂使用共享音樂開關與音量，基礎增益固定為 0.2。
- 離開牌桌時清除計時器、停止音樂並重設播放位置。
- 在 Loading 與 Game 期間保留已存在的 pre-game 音樂 activation，從 `Game` 返回大廳時讓 `pre-game-lobby-theme.mp3` 以 900ms 淡入恢復播放。
- 保留其他路由現有的 900ms 大廳淡入淡出行為。
- 洗牌動畫開始時建立兩層短音效：主層 0–1200ms／0.25 增益，第二層 100–1300ms／0.15 增益，並遵守共享 `soundEnabled` 與 `soundVolume`。
- 正式牌桌中每次有效抽牌動畫開始飛牌前播放一次 `game-card-draw.mp3`，使用共享 `soundVolume` 的 0.35 增益；初始發牌與所有玩家的一般抽牌共用同一觸發點。
- 正式牌桌中本地或遠端玩家每次有效出牌動畫開始前播放一次 `game-card-play-rise.mp3`，使用共享 `soundVolume` 的 0.4 增益。
- 裁除 `game-card-play-rise.mp3` 前 0.65 秒靜音，將輸出長度控制在 1.5 秒內並保留完整尾音，使動畫開始後能在 0.06 秒內進入可聽內容。
- 「職場老鳥」保護動畫開始時播放一次 `game-senior-protection-activate.mp3`，使用共享 `soundEnabled`、`soundVolume` 與 0.45 增益。
- 牌桌選單選項、玩家目標頭像、設定齒輪與設定視窗按鈕使用既有 `login-button-click`，並沿用共享音效開關、音量與停用控制規則。
- 自訂房間等待室的頁面與子元件可用按鈕使用既有 `login-button-click`，並沿用共享音效開關、音量與停用控制規則。

**Non-Goals:**

- 不修改 Loading 畫面長度、進度動畫或遊戲資料載入流程。
- 不做大廳與牌桌音樂交叉混音；Loading 是兩首音樂之間的安靜過渡區。
- 不新增音樂選曲、播放清單、後端同步或個別牌桌音量設定。
- 不改變 `pre-game-lobby-theme.mp3`、登入音樂、腳步聲或洗牌以外其他全域音效的重播行為。
- 不在進入遊戲前從未啟動大廳音樂、共享音樂已停用或音量為 0 時強制播放，也不改變非 `Game` 來源進入大廳的既有行為。
- 不把音樂生命週期放進 `GameStage`，避免展示頁或其他重用場景自動播放。
- 不替角色效果抽牌或動畫展示頁加入抽牌音效，也不修改抽牌動畫速度、順序或視覺效果。
- 不讓 `CardPlayAnimation` 展示頁或無效出牌動畫播放 `game-card-play-rise.mp3`，也不修改出牌確認、Socket.IO 合約、遊戲規則或出牌動畫視覺；除了裁切 `game-card-play-rise.mp3` 前置靜音外，不重新設計音效內容或編輯其他媒體素材。
- 不在保護解除或其他卡牌效果被既有保護擋下時播放保護啟動音效，也不修改保護持續時間與規則。
- 不讓音量滑桿、停用控制或非按鈕區域播放 UI 點擊音效，也不改變既有 UI 樣式、選擇或遊戲操作行為；設定視窗「返回大廳」僅修正為既有事件契約與命名路由，不新增目的地或轉場畫面。
- 不修改自訂房間等待室的版面、按鈕樣式、房間資料流程或既有事件處理，也不為個別等待室按鈕新增不同音效。

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

### Game 返回大廳時保留 activation 並淡入 pre-game-lobby-theme

`App.vue` 已取得目前與前一個路由名稱，並用 `previousRouteName` 處理商城返回大廳的淡入特例。沿用相同模式，來源為 `Game` 時也將 `fadeIn` 設為 true，不再傳遞抑制旗標。`UsePreGameAudio` 在目標為 `Loading` 或 `Game` 時停止並重設 `pre-game-lobby-theme.mp3`，但保留先前由使用者互動建立的 `preGameBackgroundStarted` activation；返回 pre-game 大廳後，既有同步流程因此能用 900ms 淡入恢復播放。

activation 只在 `Mall`、`Loading` 與 `Game` 這些需要返回大廳續播的暫時離場路由保留；前往其他非 pre-game 路由仍清除。此設計不寫入共享 `musicEnabled`／`musicVolume`，不處理牌桌主題的卸載停止，也不接觸登入音樂、腳步聲或音效。替代方案是在返回按鈕元件直接呼叫播放；未採用，因為同一路由可能由不同 UI 入口觸發，且路由音訊生命週期應集中在根 watcher 與 pre-game 控制器。

### 共用音樂設定並動態解析淡入目標

牌桌音樂目標音量為 `clamp(musicVolume / 100) * 0.2`。音樂停用或目標音量為 0 時不播放；牌桌已啟動後將音樂切為啟用時，從 0 開始執行 5000ms 淡入。調整音量時控制器更新目前音量與淡入目標，不修改音效開關或音效音量。

瀏覽器拒絕 `audio.play()` 的 Promise 時維持既有音訊策略：吞掉拒絕，不阻斷畫面載入或顯示錯誤訊息。下一次有效的音樂啟用或 start 呼叫可再次嘗試播放。

### 兩層洗牌音效以短裁切與低增益建立層次

`playGameCardShuffleSound()` 延遲建立兩個使用 `game-card-shuffle.ogg` 的 HTML Audio 實例。主層在洗牌動畫通過輸入驗證後立即播放，第二層延遲 100ms；主層與第二層分別使用共享 `soundVolume` 的 0.25 與 0.15 倍，兩層各在開始 1200ms 後 pause 並將 `currentTime` 重設為 0。

每次開始新一輪洗牌前，控制器先清除上一輪的延遲與停止 timeout，pause 並歸零既有兩層，避免連續觸發形成未受控的殘音。音效停用或共享音效音量為 0 時不建立新排程。替代方案是使用 Web Audio API 或預先輸出疊層音檔；未採用，因為兩個 HTML Audio 實例已能滿足 100ms 排程與 1200ms 裁切，且保留後續調整參數的彈性。

### 正式牌桌共用抽牌路徑提供逐張音效

`UseGameTableAudio` 延遲建立單一使用 `game-card-draw.mp3` 的 Audio 實例，並提供 `playGameCardDealSound()`。每次播放前將 `currentTime` 重設為 0，音量使用共享 `soundVolume` 的 0.35 倍，再沿用 `playAudio()` 的 Promise rejection 保護。

`GameStage` 取得此播放函式並注入 `useGameStageDrawSequence()`。正式牌桌的共用 `playDrawAnimation()` 先完成重入、卡牌資料、DOM 更新及來源／目標矩形檢查，只有在兩個矩形有效、即將呼叫 self 或 opponent draw animation 時才觸發一次。`playInitialRoundDrawSequence()` 移除玩家迴圈中的直接播放，改由共用路徑自然觸發，因此初始發牌不會重複播放；socket 驅動的自己或對手一般抽牌也會各播放一次。替代方案是在初始發牌與 socket handler 分別播放；未採用，因為觸發點分散且新增抽牌入口時容易漏接。也不把音效放入 `CardDrawAnimation`，避免角色效果與展示頁被一併套用。

### 職場老鳥保護啟動時播放語意化音效

將原始素材改名為 `game-senior-protection-activate.mp3`，由 `UseGameTableAudio` 延遲建立單一 Audio 實例並提供 `playSeniorProtectionActivateSound()`。每次播放前將 `currentTime` 重設為 0，音量使用 bounded 共享 `soundVolume` 的 0.45 倍，並沿用 `playAudio()` 的安全 rejection 處理。

`GameStage` 將此 callback 注入 `useGameStageEffectAnimation()`；`playEffectAnimation()` 只有在正規化結果同時符合 `type === "protection"` 與 `sourceType === "senior"` 時才呼叫一次，而且在設定 `activeEffectResult` 前觸發，使聲音與保護啟動動畫同步。既有保護擋招也使用 `type === "protection"`，因此不能僅依 type 播放；保護 aura 卸載沒有音效入口。替代方案是在 `ProtectionAura` 掛載時播放；未採用，因為該元件同時呈現持續 aura 與擋招效果，會造成重複或錯誤觸發。

### 牌桌與 Teleport 設定視窗共用點擊事件代理

沿用 `useButtonClickAudio()` 回傳的 `handleButtonClick(event)`，在 `GameStage` 根節點使用 capture click 事件代理，讓其 DOM 子樹內的選單選項、玩家目標按鈕、設定齒輪與確認／取消按鈕統一播放 `login-button-click`。共用 handler 只接受 `button` 或 `[role="button"]`，並排除原生 disabled 與 `aria-disabled="true"` 控制，因此不需要在每個子元件重複接線。

`GameSettingsModal` 透過 `Teleport` 掛到 `body`，不是 `GameStage` 的 DOM 後代，因此在 modal overlay 根節點另掛同一個 capture handler。兩個事件代理的 DOM 範圍互斥，單次按鈕點擊只會處理一次。替代方案是逐一修改每個按鈕或在 `App.vue` 建立全域監聽；未採用，因為逐一接線容易漏掉未來新增控制，全域監聽則會把牌桌需求擴散到其他頁面。

### 自訂房間等待室共用點擊事件代理

`CustomRoomView` 在根 `<main>` 使用 `useButtonClickAudio().handleButtonClick` 的 capture click 事件代理。複製房號、玩家槽操作、邀請好友視窗、返回大廳與開始遊戲都位於該 DOM 子樹，因此共用處理器可在不逐一修改子元件的情況下播放 `login-button-click`；原生 disabled、`aria-disabled="true"`、輸入框與一般內容仍由既有 handler 維持靜音。

替代方案是逐一在 `CustomRoomView`、`CustomRoomPlayerList` 與 `InviteFriendModal` 加入播放呼叫；未採用，因為會重複音訊接線並增加漏掉日後新增按鈕的風險。也不在 `App.vue` 增加全域監聽，避免影響等待室以外的頁面。

### 設定返回大廳沿用元件事件鏈並由 GameView 導頁

`GameSettingsModal` 已宣告 `return-lobby` emit 與確認內容，`GameStage` 也已將該事件向上轉送；返回按鈕應開啟 `return-lobby` 確認狀態，確認後沿用這條事件鏈。`GameView` 作為頁面級協調層接收事件，使用 Vue Router 的命名路由 `{ name: "LobbyHome" }` 導頁。這會產生可辨識的 `Game → LobbyHome` 轉場，交由 `App.vue` 與 `UsePreGameAudio` 的既有路由音訊同步恢復 `pre-game-lobby-theme.mp3`。

替代方案是在 Teleport 子元件內直接呼叫 `$router.push('/Lobby')`；未採用，因為它繞過已宣告的元件事件契約，使頁面層無法測試或協調離場行為。也不在返回按鈕直接呼叫 `startPreGameBackground()`，避免導頁與音訊生命週期出現兩個控制入口。

### 正式牌桌共用出牌協調層播放 rise 音效

`UseGameTableAudio` 延遲建立單一使用 `game-card-play-rise.mp3` 的 Audio 實例，並提供 `playGameCardPlaySound()`。每次播放前將 `currentTime` 重設為 0，音量使用 bounded 共享 `soundVolume` 的 0.4 倍，再沿用 `playAudio()` 的 Promise rejection 保護。

`GameStage` 將此 callback 注入 `useGameStageCardPlay()`。本地 `playActiveCard()` 與遠端 `playRemoteCardPlayAnimation()` 都先驗證卡牌、來源矩形與棄牌目標矩形，只有在即將呼叫正式牌桌的 `cardPlayAnimation.play()` 前才各觸發一次。遠端流程既有的 self-player guard 保留，因此本地玩家不會因自己的 socket 回傳重複播放。替代方案是直接放入 `CardPlayAnimation`；未採用，因為動畫展示頁也會被套用。也不在 socket handler 播放，避免本地音效延遲到伺服器回應才出現。

### 裁除 game-card-play-rise 前置靜音

診斷顯示原始 `game-card-play-rise.mp3` 容器長度約 2.04 秒，在 -45 dB 門檻下從 0 到約 0.688 秒皆為靜音；程式已在動畫開始前立即呼叫播放，因此延遲來源是素材本身。將音檔從 0.65 秒開始裁切，保留約 0.038 秒的低音量緩衝與完整尾音，重新輸出為 192 kbps MP3。完成後容器長度必須低於 1.5 秒，-45 dB 前置靜音必須低於 0.06 秒。

替代方案是在 `playGameCardPlaySound()` 將 `currentTime` 設為 0.65；未採用，因為首次播放的 seek 精度與解碼器行為不一致，也會讓素材延遲繼續存在於其他重用入口。另一方案是同時截短尾音；未採用，因為使用者感受到的是起音延遲，完整尾音不需要犧牲。

### 實習生動畫在結果文字揭露時送出語意事件

`InternAnimation` 將 `outcome-reveal` 加入 emit 契約。猜對與猜錯時間軸都先保留既有 1 秒猜測提示停留，接著在結果文字設為可見前送出一次 `outcome-reveal`，payload 為 `correct` 或 `incorrect`。因此聲音的觸發點與「猜對啦／猜錯啦」文字揭露一致，不提前到出牌或猜測提示階段。

`GameStage` 監聽正式牌桌的 `InternAnimation` 事件，交給 `UseGameTableAudio.playInternGuessResultSound(outcome)`。控制器依 outcome 選擇 `intern-guess-correct.mp3` 或 `intern-guess-incorrect.mp3`，延遲建立兩個 Audio 實例，每次從 0 秒以 bounded `soundVolume × 0.45` 安全播放。未知 outcome、音效停用、音量為 0、Audio API 不可用或播放 Promise 被拒絕時皆安靜 no-op，動畫仍繼續。展示頁不接此事件，避免 demo 自動播放正式牌桌音效。

## Implementation Contract

- **Observable behavior:** 由任何 pre-game 頁面進入 `Loading` 後，`pre-game-lobby-theme.mp3` 在 4000ms 內從目前音量線性降至 0，接著 pause 並將 `currentTime` 設為 0。Loading 期間不播放 `game-table-start-theme.mp3`。
- **Observable behavior:** `GameView` 尚未完成初始資料載入時只顯示 `LoadingScreen` 且不啟動牌桌音樂；`hasLoadedInitialState` 變為 true、`GameStage` 成為主畫面時，牌桌音樂以 5000ms 從 0 線性淡入到共享音量乘以 0.2。
- **Observable behavior:** 僅當 `game-table-start-theme.mp3` 自然播放完畢且牌桌仍為 active 時，同一 Audio 實例從 0 秒重播，音量歸零後再次用 5000ms 淡入；其他背景音樂與音效不受影響。
- **Observable behavior:** 若 `pre-game-lobby-theme.mp3` 在進入遊戲前已由使用者互動啟動，Loading 與 Game 期間保留其 activation 但維持暫停；當來源路由為 `Game` 且目標為 pre-game 大廳時，音樂從 0 音量播放並在 900ms 內淡入共享音量乘以 0.2。
- **Observable behavior:** 若共享音樂已停用、音量為 0 或進入遊戲前從未啟動 pre-game 主題，Game 返回大廳不得強制播放；從其他來源進入大廳時維持既有同步行為。
- **Observable behavior:** 玩家在牌桌設定視窗選擇「返回大廳」並確認後，設定視窗送出 `return-lobby`，`GameStage` 向上轉送，`GameView` 導向命名路由 `LobbyHome`；路由從 `Game` 離開後由既有根 watcher 觸發 900ms pre-game 主題淡入。
- **Observable behavior:** 每次有效洗牌動畫開始時，主層洗牌音效立即以 `soundVolume × 0.25` 播放並在 1200ms 停止；第二層在 100ms 後以 `soundVolume × 0.15` 播放並在自身播放 1200ms 後停止。兩層停止時一律 pause 並把 `currentTime` 重設為 0。
- **Observable behavior:** 新一輪洗牌在上一輪聲音結束前開始時，舊的三個 timeout 全部被清除，兩層舊聲音停止並歸零，再建立新一輪排程；不得累積第三層或殘留停止計時器。
- **Observable behavior:** 正式牌桌的共用 `playDrawAnimation()` 在來源與目標矩形有效時，於 self 或 opponent draw animation 開始前播放一次 `game-card-draw.mp3`，音量為 bounded `soundVolume × 0.35`；初始發牌與一般回合中任何玩家的抽牌都各自從 0 秒播放一次。
- **Observable behavior:** 正式牌桌本地玩家的 `playActiveCard()` 與遠端玩家的 `playRemoteCardPlayAnimation()` 在卡牌、來源矩形與棄牌目標矩形有效時，於 `cardPlayAnimation.play()` 開始前播放一次 `game-card-play-rise.mp3`，音量為 bounded `soundVolume × 0.4` 且每次從 0 秒播放。
- **Observable behavior:** `game-card-play-rise.mp3` 的前 0.65 秒已裁除，輸出容器長度低於 1.5 秒，使用 -45 dB／0.01 秒靜音偵測時的前置靜音低於 0.06 秒，且原本 0.65 秒之後的尾音完整保留。
- **Media contract:** `game-card-play-rise.mp3` 維持 MP3、44.1 kHz stereo 與 192 kbps；不以程式 seek 取代素材裁切。
- **Observable behavior:** 遠端出牌流程收到目前玩家自己的事件、卡牌或矩形無效、僅在 `CardPlayAnimation` 展示頁播放動畫，或共享音效停用／音量為 0 時，不得播放 `game-card-play-rise.mp3`。
- **Observable behavior:** 實習生猜牌動畫完成既有 1 秒提示停留後、結果文字設為可見前，送出一次 `outcome-reveal`；`correct` 播放 `intern-guess-correct.mp3`，`incorrect` 播放 `intern-guess-incorrect.mp3`，兩者皆從 0 秒以 bounded `soundVolume × 0.45` 播放。
- **Observable behavior:** 未知結果、共享音效停用／音量為 0、Audio API 不可用、播放 Promise 被拒絕或僅在動畫展示頁執行時，不得產生未處理錯誤或中斷實習生動畫。
- **Observable behavior:** 來源或目標矩形無效時不得播放；角色效果直接使用 `CardDrawAnimation` 或展示頁播放動畫時也不得觸發 `playGameCardDealSound()`。
- **Observable behavior:** `playEffectAnimation()` 收到 `{ type: "protection", sourceType: "senior" }` 時，在保護啟動動畫開始時播放一次 `game-senior-protection-activate.mp3`，從 0 秒開始且音量為 bounded `soundVolume × 0.45`。
- **Observable behavior:** `sourceType` 為 `cleaner`、`intern`、`manager`、`hr` 或缺少 `senior` 的保護擋招動畫，以及 aura 離場／保護解除，都不得播放 `playSeniorProtectionActivateSound()`。
- **Observable behavior:** 牌桌中可用的選單選項、玩家目標頭像、右上角設定齒輪與確認／取消按鈕，以及設定視窗的關閉、音樂／音效切換、返回大廳、重新開始與確認／取消按鈕，每次啟用點擊各播放一次 `login-button-click`。
- **Observable behavior:** 音量滑桿、非按鈕區域、原生 disabled 與 `aria-disabled="true"` 控制不得播放 UI 點擊音效；`soundEnabled === false` 或 `soundVolume === 0` 時維持靜音，點擊「開啟音效」當下不播放，後續符合條件的點擊才播放。
- **Observable behavior:** 自訂房間等待室中的複製房號、玩家槽操作、邀請好友視窗、返回大廳與開始遊戲等可用按鈕，每次點擊播放一次 `login-button-click`，且原本的複製、房間操作、邀請、導頁與開始遊戲行為保持不變。
- **Observable behavior:** 自訂房間等待室中的輸入框、一般非按鈕內容、原生 disabled 與 `aria-disabled="true"` 控制不得播放 UI 點擊音效；共享音效停用或音量為 0 時維持靜音。
- **Interface:** `useGameTableAudio()` 回傳 `startGameTableBackground(): void` 與 `stopGameTableBackground(): void`。start 是冪等操作；stop 清除淡入 interval、pause 並將 `currentTime` 重設為 0。
- **Interface:** `useGameTableAudio()` 同時回傳 `playGameCardShuffleSound(): void`。此命令讀取共享 `soundEnabled`／`soundVolume`，但不讀寫音樂設定。
- **Interface:** `useGameTableAudio()` 同時回傳 `playGameCardDealSound(): void`；`useGameStageDrawSequence()` 接受同名 callback，預設為 no-op，並只在正式牌桌的 `playDrawAnimation()` 通過矩形驗證後、實際動畫開始前呼叫。
- **Interface:** `useGameTableAudio()` 同時回傳 `playGameCardPlaySound(): void`；`useGameStageCardPlay()` 接受同名 callback，預設為 no-op，並只在本地或遠端正式出牌流程通過 guard 與矩形驗證後、實際動畫開始前呼叫。
- **Interface:** `useGameTableAudio()` 同時回傳 `playInternGuessResultSound(outcome): void`；只接受 `correct` 與 `incorrect`。`InternAnimation` emit `outcome-reveal(outcome)`，`GameStage` 在正式牌桌接線，展示頁不接線。
- **Interface:** `useGameTableAudio()` 同時回傳 `playSeniorProtectionActivateSound(): void`；`useGameStageEffectAnimation()` 接受同名 callback，預設為 no-op，並只在 `type === "protection" && sourceType === "senior"` 的動畫開始路徑呼叫。
- **Interface:** `syncPreGameRouteAudio(routeName, { fadeIn })` 沿用既有可選淡入旗標；根路由 watcher 對 `previousRouteName === "Mall"` 或 `previousRouteName === "Game"` 傳入 true。
- **Interface:** `GameStage` 根節點與 `GameSettingsModal` overlay 分別將 capture click 事件傳給 `useButtonClickAudio().handleButtonClick(event)`；兩個 DOM 範圍互斥且不得逐一新增第二個播放呼叫。
- **Interface:** `CustomRoomView` 根 `<main>` 將 capture click 事件傳給 `useButtonClickAudio().handleButtonClick(event)`；等待室頁面與子元件不得再逐一新增第二個播放呼叫。
- **Interface:** `GameSettingsModal` 的返回按鈕呼叫 `openConfirmation("return-lobby")`，確認後 emit `return-lobby`；`GameStage` 維持同名事件轉送；`GameView` 的返回 handler 呼叫 `router.push({ name: "LobbyHome" })`，子元件不得直接寫死 `/Lobby` 路徑。
- **Settings behavior:** `musicEnabled === false` 或 `musicVolume === 0` 時牌桌音樂不得播放。正式牌桌已啟動後重新開啟音樂時執行完整 5000ms 淡入；音量變更套用 0.2 增益並保持在 0 到 1 範圍。
- **Failure mode:** 不支援 Audio 的環境直接 no-op。play Promise 被瀏覽器拒絕時安靜失敗，不得造成未處理 rejection、路由中斷或牌桌載入失敗。
- **Acceptance criteria:** `node tests/pre-game-audio.test.mjs` 驗證 Loading 路由不再持續 pre-game 音樂、4000ms 淡出、Loading／Game activation 保留、`Game` 返回大廳時的 900ms 淡入、`GameStage`、Teleport 設定視窗與 `CustomRoomView` 都接上共用 click handler，以及設定返回事件完整傳到 `GameView` 並導向 `LobbyHome`；`node tests/game-table-audio.test.mjs` 驗證資產、控制器介面、5000ms 淡入、循環播放、設定同步、GameView 啟動條件、卸載清理、兩層洗牌音效、正式牌桌每次有效抽牌的 0.35 增益音效、所有玩家有效出牌的 0.4 增益音效、裁切後 `game-card-play-rise.mp3` 小於 40 KiB、展示頁隔離，以及 `senior` 專屬保護啟動音效與其他保護事件隔離；FFmpeg 靜音偵測驗證容器長度低於 1.5 秒且 -45 dB 前置靜音低於 0.06 秒；`node tests/card-draw-animation.test.mjs`、`node tests/card-play-interaction.test.mjs` 與 `node tests/socket-game-animation.test.mjs` 驗證抽牌、出牌互動與 socket 動畫契約保持不變；`npm run build` 成功且輸出包含 `game-card-draw-*.mp3`、`game-card-play-rise-*.mp3` 與 `game-senior-protection-activate-*.mp3`。
- **In scope:** 前端背景音樂控制器、Loading 路由音訊切換、GameView 生命週期與設定返回大廳導頁協調、`game-table-start-theme.mp3` 的每輪重播淡入、`game-card-shuffle.ogg` 的兩層播放控制、`game-card-draw.mp3` 的正式牌桌抽牌控制、`game-card-play-rise.mp3` 的正式牌桌所有玩家出牌控制與前置靜音裁切、`intern-guess-correct.mp3`／`intern-guess-incorrect.mp3` 的實習生結果揭露控制、`game-senior-protection-activate.mp3` 的職場老鳥保護啟動控制、牌桌、Teleport 設定視窗與自訂房間等待室的按鈕點擊音效及返回事件接線、聚焦測試與既有音訊資產。
- **Out of scope:** 後端、Socket.IO 合約、遊戲規則、Loading 視覺時間、角色效果抽牌、動畫展示頁音效、無效出牌音效、保護解除音效、被保護擋招音效、音量滑桿音效、等待室與牌桌 UI 樣式變更、房間資料流程、`game-card-play-rise.mp3` 以外的音訊格式轉換或媒體內容編輯。

## Risks / Trade-offs

- [直接從可聽起點裁切可能產生爆音或切掉起音] → 從偵測到的 0.688 秒起音前 0.038 秒開始裁切，保留短緩衝並驗證前置靜音低於 0.06 秒。
- [MP3 重新編碼可能降低品質] → 維持來源 44.1 kHz stereo 與 192 kbps，只進行一次裁切重編碼，並保留完整尾音。

- [瀏覽器自動播放政策可能拒絕延後的 play 呼叫] → 捕捉 Promise rejection，保證 UI 不受影響；後續音樂設定互動可再次嘗試。
- [兩個獨立控制器可能短暫同時存在] → Loading 的 5200ms 視覺流程長於 4000ms 淡出，且牌桌音樂只在 GameStage 顯示後啟動，不做重疊交叉淡入。
- [元件重載或狀態重複通知造成多個淡入計時器] → start 採冪等檢查，建立新 interval 前先清除既有牌桌淡入 interval。
- [共享音量在淡入中改變] → 每次 tick 依目前共享設定重新解析目標音量，完成時寫入最新目標值。
- [原生 loop 無法保證每輪重新淡入] → 關閉原生 loop，只在牌桌主題的 `ended` listener 中手動重播並重用相同淡入函式。
- [Loading 與 Game 都會經過非 pre-game 停止流程而清除 activation] → 僅對 `Mall`、`Loading`、`Game` 保留 activation，其他非 pre-game 路由照常清除；Game 返回大廳再由 `previousRouteName` 觸發 900ms 淡入。
- [第二層延遲播放可能與下一輪洗牌重疊] → 每次播放前清除上一輪全部 timeout，pause 並歸零兩個 Audio 實例，再建立本輪固定三個 timeout。
- [把抽牌音效放入最底層動畫會污染角色效果與展示頁] → 只由正式牌桌的 `useGameStageDrawSequence().playDrawAnimation()` 在矩形驗證後呼叫注入 callback，`CardDrawAnimation` 與展示頁自有抽牌函式保持無音訊依賴。
- [保護啟動與擋招共用 `protection` animation type，容易誤播] → 同時檢查 `sourceType === "senior"`，並由 effect animation orchestration 注入 callback，不讓 `ProtectionAura` 自行播放。
- [設定視窗使用 Teleport，牌桌根節點無法捕捉其點擊] → 在 modal overlay 獨立使用同一 capture handler，並以互斥 DOM 範圍避免單次點擊重複播放。
- [等待室按鈕分散在頁面與兩個子元件，逐一接線容易遺漏或重複播放] → 僅在 `CustomRoomView` 根節點使用共用 capture handler，依 DOM 事件委派涵蓋整個等待室。
- [設定視窗直接導頁會繞過頁面級離場協調，使音訊回歸測試只驗證控制器而未驗證實際入口] → 返回按鈕沿用 `return-lobby` emit 鏈，統一由 `GameView` 導向 `LobbyHome`，測試同時驗證 modal、stage 與 view 三層接線。
- [把出牌音效放入底層動畫會污染展示頁，放入 socket handler 則會讓本地聲音延遲或重複] → 由正式牌桌的 `useGameStageCardPlay()` 在本地與遠端有效動畫開始前各呼叫一次注入 callback，並保留遠端 self-player guard。
- [把實習生結果音效直接放進動畫元件會讓展示頁也播放，或在結果資料到達時播放會早於文字揭露] → 動畫元件只送出精準的 `outcome-reveal` 語意事件，由正式牌桌 `GameStage` 接到音效控制器。
