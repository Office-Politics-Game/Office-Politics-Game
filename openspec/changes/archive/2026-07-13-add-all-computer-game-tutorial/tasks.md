## 1. 導覽判斷與生命週期

- [x] 1.1 依「以 composable 集中判斷與 Intro.js 生命週期」實作 src/composables/UseGameTutorial.js，使 Tutorial eligibility for an all-computer-opponent game 僅在目前玩家為真人、至少有一名對手且所有對手皆為電腦時成立，並由 tests/game-tutorial.test.mjs 覆蓋全電腦、混合真人、電腦目前玩家、缺少目前玩家與零對手案例。
- [x] 1.2 依「每次符合條件的 GameStage 掛載只啟動一次」實作 startTutorial、hasStarted 與可重複呼叫的 disposeTutorial，使 Tutorial starts once per game-page visit 與 Tutorial fails safely when UI targets are unavailable 在同次掛載不重複啟動、缺少目標可稍後重試、卸載安全清理，並由 tests/game-tutorial.test.mjs 的 instance 計數、缺少目標及 dispose 案例驗證。

## 2. 元件目標與牌桌整合

- [x] 2.1 依「由子元件公開穩定的導覽目標元素」在 TableCardPiles、PlayerHand 與 PlayerSeats 增加不移除既有 API 的 defineExpose getter，使 GameStage 可取得 deck、hand、discard、opponents 四個 HTMLElement；以 npm run build 驗證介面可解析，並人工確認 getter 指向可見的抽牌區、真人手牌區、棄牌區與其他玩家座位配置。
- [x] 2.2 在 GameStage 以 nextTick、players 與 currentPlayerId 串接 UseGameTutorial，落實 Tutorial follows the gameplay-area sequence 的前三個單一錨點與第四步浮動 tooltip；PlayerSeats 應公開並同時高亮三個對手座位、維持目前玩家及其他牌桌區域深色，且完成、略過、切步及卸載皆清除暫時 class。第四步同時落實 Tutorial explains elimination and match victory 的繁體中文淘汰目標與率先累積 3 次回合勝利文案；由 tests/game-tutorial.test.mjs 驗證三元素 opponents、步驟順序、切步 class 與清理，並以人工操作確認三位對手同步框選、下一步、上一步、略過、完成及離開頁面清理。

## 3. Square UI 與響應式呈現

- [x] 3.1 依「以全域樣式整合 Intro.js 與 Square UI」在 src/main.js 依序載入官方 Intro.js CSS 與 src/assets/styles/game-tutorial.css，使 Tutorial presentation follows Square UI and responsive rules 呈現 0px 圓角、品牌衍生色、default、hover、active、focus-visible、disabled 狀態及受 viewport 限制的 tooltip；以 npm run build 驗證樣式 import，並在手機、平板、桌面斷點人工確認無水平溢出。
- [x] 3.2 依「以固定橫向樣式整合深色遮罩與多對手高亮」更新 src/assets/styles/game-tutorial.css 與 Intro.js options，使 Tutorial presentation follows Square UI and responsive rules 僅使用 `< 1024px`／`≥ 1024px` 固定 px 尺寸、略過文字單行橫排且與標題同字級、overlayOpacity 0.72，前三步透明區及第四步三個對手皆有品牌藍 border 與 glow，並停用自動捲動以保留手牌及第二步框選部分超出 viewport 的原始位置；`< 1024px` 預設保留 autoPosition，僅透過 onBeforeChange 在棄牌步驟關閉並於離開時恢復，抽牌、手牌、棄牌定位分別為 right、未指定、left，對手 tooltip 以專用 class 固定位移至螢幕下半部，且使用緊湊固定 padding、gap 與 helper padding。由 tests/game-tutorial.test.mjs 驗證選擇器、固定值、唯一 breakpoint、四步定位、逐步 autoPosition 切換、scrollToElement false 與 options，並以兩個橫向 viewport 人工確認無溢出及手牌不被移動。

## 4. 開局規則、出牌狀態與廣播時序

- [x] 4.1 依「第一回合由唯一真人先手」實作 Human player starts the first all-computer round：server/src/game/initialState.js 在恰好一名真人與三名電腦時指定真人 currentTurnPlayerId，其他初始組合及 server/src/services/roundService.js 的後續回合維持隨機；以新增或更新的 server Jest 測試固定 Math.random 驗證三種分支。
- [x] 4.2 依「以 game session 出牌旗標限制教學」實作 Successful card play permanently suppresses the session tutorial：初始 state_json 建立 hasAnyCardBeenPlayed=false，server/src/services/gameActionService.js 僅在成功棄牌後設為 true，server/src/services/gameStateService.js 對舊狀態缺值輸出 false，後續回合保留 true；GameView 與 GameStage 將欄位納入 Tutorial eligibility for an all-computer-opponent game 及 Tutorial starts once per game-page visit，並以 server Jest 與 tests/game-tutorial.test.mjs 驗證成功、失敗、舊狀態、跨回合與重新進入案例。
- [x] 4.3 依「以可等待的教學 settlement 串接第一回合廣播」實作 First-round notice waits for tutorial settlement：UseGameTutorial 在完成、略過、關閉、資格不符、啟動失敗及 dispose 時解除等待；useGameStageDrawSequence 在 playRoundStartNotice 前請求 settlement，若 tour 尚未 active 或 starting 則將本次掛載定案為略過，禁止廣播後因 DOM 或 socket 更新補開教學；以 tests/game-tutorial.test.mjs 與 tests/round-start-notice.test.mjs 驗證廣播不早播、不永久阻塞、略過定案及不新增獨立遊戲開始廣播。

## 5. 整體驗收

- [ ] 5.1 依 Implementation Contract 執行 node tests/game-tutorial.test.mjs、node tests/round-start-notice.test.mjs、server 目錄 npm test 與根目錄 npm run build，並人工驗證 Goals / Non-Goals：一真人三電腦第一回合由真人先手、教學結束前不出現第一回合廣播、首次成功出牌後重新進入及後續回合不再顯示、首次出牌前重新進入仍可顯示；同時在兩個橫向 breakpoint 檢查略過橫排、0.72 深色遮罩、前三步藍框光暈、第四步只框選三位對手，並確認 Risks / Trade-offs 中的 stacking context、非同步目標、settlement 與舊狀態相容均有驗證結果。
