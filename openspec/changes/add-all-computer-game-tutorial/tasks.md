## 1. 導覽判斷與生命週期

- [x] 1.1 依「以 composable 集中判斷與 Intro.js 生命週期」實作 src/composables/UseGameTutorial.js，使 Tutorial eligibility for an all-computer-opponent game 僅在目前玩家為真人、至少有一名對手且所有對手皆為電腦時成立，並由 tests/game-tutorial.test.mjs 覆蓋全電腦、混合真人、電腦目前玩家、缺少目前玩家與零對手案例。
- [x] 1.2 依「每次符合條件的 GameStage 掛載只啟動一次」實作 startTutorial、hasStarted 與可重複呼叫的 disposeTutorial，使 Tutorial starts once per game-page visit 與 Tutorial fails safely when UI targets are unavailable 在同次掛載不重複啟動、缺少目標可稍後重試、卸載安全清理，並由 tests/game-tutorial.test.mjs 的 instance 計數、缺少目標及 dispose 案例驗證。

## 2. 元件目標與牌桌整合

- [x] 2.1 依「由子元件公開穩定的導覽目標元素」在 TableCardPiles、PlayerHand 與 PlayerSeats 增加不移除既有 API 的 defineExpose getter，使 GameStage 可取得 deck、hand、discard、opponents 四個 HTMLElement；以 npm run build 驗證介面可解析，並人工確認 getter 指向可見的抽牌區、真人手牌區、棄牌區與其他玩家座位配置。
- [ ] 2.2 在 GameStage 以 nextTick、players 與 currentPlayerId 串接 UseGameTutorial，落實 Tutorial follows the gameplay-area sequence 的前三個單一錨點與第四步浮動 tooltip；PlayerSeats 應公開並同時高亮三個對手座位、維持目前玩家及其他牌桌區域深色，且完成、略過、切步及卸載皆清除暫時 class。第四步同時落實 Tutorial explains elimination and match victory 的繁體中文淘汰目標與率先累積 3 次回合勝利文案；由 tests/game-tutorial.test.mjs 驗證三元素 opponents、步驟順序、切步 class 與清理，並以人工操作確認三位對手同步框選、下一步、上一步、略過、完成及離開頁面清理。

## 3. Square UI 與響應式呈現

- [x] 3.1 依「以全域樣式整合 Intro.js 與 Square UI」在 src/main.js 依序載入官方 Intro.js CSS 與 src/assets/styles/game-tutorial.css，使 Tutorial presentation follows Square UI and responsive rules 呈現 0px 圓角、品牌衍生色、default、hover、active、focus-visible、disabled 狀態及受 viewport 限制的 tooltip；以 npm run build 驗證樣式 import，並在手機、平板、桌面斷點人工確認無水平溢出。
- [ ] 3.2 依「以固定橫向樣式整合深色遮罩與多對手高亮」更新 src/assets/styles/game-tutorial.css 與 Intro.js options，使 Tutorial presentation follows Square UI and responsive rules 僅使用 `< 1024px`／`≥ 1024px` 固定 px 尺寸、略過文字單行橫排且與標題同字級、overlayOpacity 0.72，前三步透明區及第四步三個對手皆有品牌藍 border 與 glow，並停用自動捲動以保留手牌及第二步框選部分超出 viewport 的原始位置；`< 1024px` 預設保留 autoPosition，僅透過 onBeforeChange 在棄牌步驟關閉並於離開時恢復，抽牌、手牌、棄牌定位分別為 right、未指定、left，對手 tooltip 以專用 class 固定位移至螢幕下半部，且使用緊湊固定 padding、gap 與 helper padding。由 tests/game-tutorial.test.mjs 驗證選擇器、固定值、唯一 breakpoint、四步定位、逐步 autoPosition 切換、scrollToElement false 與 options，並以兩個橫向 viewport 人工確認無溢出及手牌不被移動。

## 4. 整體驗收

- [ ] 4.1 依 Implementation Contract 完成 node tests/game-tutorial.test.mjs 與 npm run build，並人工驗證 Goals / Non-Goals 範圍：全電腦對手每次重新進入 /game 都顯示一次導覽、同次停留的 socket 更新不重複顯示、真人對手情境不顯示、導覽關閉後遊戲可操作；同時在兩個橫向 breakpoint 檢查略過橫排、0.72 深色遮罩、前三步藍框光暈、第四步只框選三位對手，以及 Risks / Trade-offs 中的 stacking context、非同步目標時序與 Intro.js CSS 衝突均有對應驗證結果。
