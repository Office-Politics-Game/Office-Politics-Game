## Context

/game 由 GameView 載入公開遊戲狀態，再由 GameStage 組合 TableCardPiles、PlayerHand 與 PlayerSeats。後端 initialState 目前隨機選擇第一回合先手，roundService 也會在後續回合隨機選擇先手；公開狀態尚未記錄整個 game session 是否曾成功出牌。前端初始發牌流程會在發牌動畫後立即等待「第 N 回合開始」廣播關閉，再播放目前玩家回合提示。

這項變更同時涉及 Vue 元件公開介面、導覽狀態判斷、第三方 overlay 生命週期與全域樣式，因此建立設計文件。介面必須沿用 Square UI 的方形輪廓、品牌色 token、僅橫向遊玩、`< 1024px`／`≥ 1024px` 兩檔固定尺寸與無溢出的限制。

## Goals / Non-Goals

**Goals:**

- 當玩家組合恰好為一名真人與三名電腦，且 game session 尚未成功出牌時，在 /game 牌桌就緒後啟動導覽。
- 全電腦對手對局的第一回合固定由唯一真人先手，後續回合仍維持隨機先手。
- 首次成功出牌後在 game session 狀態永久抑制導覽，包含重新進入 /game 與後續回合。
- 現有第一回合開始廣播必須等待導覽完成、略過、關閉或安全失敗後才播放。
- 以固定順序說明抽牌區、手牌區、棄牌區與其他玩家位置。
- 在其他玩家步驟中準確說明淘汰與率先取得 3 次回合勝利的整場勝利條件。
- 在非符合情境、DOM 目標缺失、重複狀態更新及元件卸載時維持安全且不阻斷遊戲。
- 導覽在兩個橫向 breakpoint 維持固定尺寸、可讀、可關閉且不產生溢出。
- 深色遮罩需明確壓暗非目標區，前三步透明目標區需有藍色邊框與光暈，第四步需同時框選其餘三位玩家並保持其他區域深色。
- 「略過」控制的繁體中文文字必須維持單行橫排，且字級與所屬 breakpoint 的 tooltip 標題相同。
- 導覽不得捲動遊戲畫面以完整露出目標；手牌區原本超出 viewport 的部分與第二步框選範圍都必須維持原始構圖。
- `< 1024px` 小型橫向預設保留 Intro.js autoPosition，使抽牌與手牌步驟維持既有行為；透過 onBeforeChange 僅在進入棄牌步驟前暫時關閉 autoPosition，以保留目標左側定位，離開該步驟即恢復。三對手步驟使用專用 tooltip class 與固定垂直位移，將說明移到螢幕下半部；小型橫向的 tooltip padding、按鈕區 gap 與 helper padding 使用較緊湊的固定值。

**Non-Goals:**

- 不新增跨 game session 的永久已讀偏好、手動重播入口或設定開關。
- 不修改電腦玩家決策、淘汰判定、回合勝利或整場勝利規則。
- 不新增獨立「遊戲開始」廣播、API endpoint、Socket.IO 事件、資料庫欄位或分析追蹤。
- 不重新設計牌桌、卡牌、玩家座位與既有動畫。
- 不把導覽擴展到真人多人對局或 demo 路由。

## Decisions

### 以 composable 集中判斷與 Intro.js 生命週期

新增 UseGameTutorial composable，接收 players、currentPlayerId 與解析導覽目標的 callback。它負責純函式觸發判斷、建立固定步驟、啟動單一 Intro.js instance，以及在完成、跳過或元件卸載時清理 instance。GameStage 僅負責提供反映實際畫面的資料和 DOM 目標。

替代方案是在 GameView 直接操作 DOM selector；未採用，因為 GameView 不擁有子元件 DOM，且 selector 會把行為耦合到樣式 class。

### 由子元件公開穩定的導覽目標元素

TableCardPiles 公開抽牌與棄牌 DOM 元素，PlayerHand 公開手牌容器元素，PlayerSeats 公開三個非目前玩家的座位元素。GameStage 在 nextTick 後組合前三個單一目標與 opponents 陣列並傳給 composable，避免依賴易變的 CSS class 或全域查詢。

第四步使用浮動 tooltip，不建立涵蓋整張牌桌的 Intro.js cutout；進入第四步時暫時將 PlayerSeats 容器提升至遮罩上方，只對三個對手座位加上 highlight class，並將目前玩家座位維持暗化。離開第四步、完成、略過、失敗或卸載時必須移除全部暫時 class。這維持四段順序，同時讓三位對手各自被框選且其餘牌桌保持深色。

替代方案是 data attribute selector；未採用，因為公開元素 getter 可沿用現有 expose 模式，且能在目標缺失時回傳 null。

### 以 game session 出牌旗標限制教學

在 state_json 新增 `hasAnyCardBeenPlayed`，初始為 false，僅在 playCardAction 成功將牌移入棄牌堆後設為 true，並由 getPublicState 正規化為 Boolean。roundService 重設後續回合時不得清除此值。每個 GameStage instance 仍以 hasStarted 防止同次掛載重複啟動，但只在公開旗標為 false 時允許啟動；舊 state_json 缺少欄位時相容地視為 false。

替代方案是檢查 discardPile；未採用，因為後續回合會清空棄牌堆，重新進入時會錯誤恢復教學。也不使用 localStorage，避免同一玩家跨房間或跨 session 被錯誤抑制。

### 第一回合由唯一真人先手

createInitialState 僅在玩家組合恰好為一名真人與三名電腦時，將 currentTurnPlayerId 指定為真人 playerId；其他組合沿用既有隨機選擇。startNextRound 不套用此特例，使第二回合起仍保持既有隨機規則。

替代方案是每回合都指定真人先手；未採用，因為產品決策只要求第一回合，且永久先手會改變後續回合平衡。

### 以可等待的教學 settlement 串接第一回合廣播

UseGameTutorial 提供可等待的 settlement promise。Intro.js 完成、略過、關閉、啟動失敗、資格不符或 dispose 時皆必須且只需解除一次等待。useGameStageDrawSequence 在初始發牌完成後、呼叫 playRoundStartNotice 前請求 settlement；若此時 tour 尚未 active 或 starting，composable 將本次掛載標記為已略過並立即解除等待，使之後的 DOM 或 socket 更新不得在廣播後補開教學。這保留既有發牌動畫與「第 N 回合開始 → 目前玩家回合提示」順序，只在第一回合符合教學資格且及時啟動時插入等待。

替代方案是延後整段發牌動畫；未採用，因為需求只限制廣播，且改變發牌時機會擴大動畫與電腦回合 acknowledgment 的風險。

### 以固定橫向樣式整合深色遮罩與多對手高亮

src/main.js 載入 intro.js 的官方 CSS，並載入新的 game-tutorial 全域覆寫樣式。覆寫只使用既有品牌及 surface token 的值或衍生透明色，將 tooltip、按鈕與進度標記維持 0px 圓角，提供 hover、active、focus-visible 與 disabled 狀態。樣式僅使用 `< 1024px` 與 `≥ 1024px` 兩檔固定 px 尺寸；略過控制使用足夠固定寬度與 `white-space: nowrap`。Intro.js overlay opacity 設為 0.72，helper layer 與三個對手座位使用品牌藍邊框及藍色光暈。

替代方案是在 GameStage 使用 scoped CSS；未採用，因為 Intro.js tooltip 掛載於元件 scoped 範圍之外，選擇器無法可靠套用。

## Implementation Contract

**Observable behavior**

- 觸發條件為 players 恰好包含 currentPlayerId 對應的一名真人與三名電腦，且 hasAnyCardBeenPlayed 為 false。
- 每個 /game 的 GameStage 掛載週期最多自動啟動一次；首次成功出牌前重新進入可再次啟動，成功出牌後重新進入或換回合皆不得啟動。
- 符合玩家組合的第一回合 currentTurnPlayerId 必須是真人；後續回合仍隨機。
- 現有第一回合廣播在教學 settlement 前保持關閉，不新增另一段遊戲開始廣播。
- 步驟順序固定為抽牌區、手牌區、棄牌區、其他玩家位置；第四步同時高亮三個對手座位，其他牌桌區域維持深色遮罩。
- 第四步文案包含淘汰其他仍存活玩家的目標，以及率先累積 3 次回合勝利即贏得整場遊戲。
- `< 1024px` 的步驟位置依序為 right、自動、left、bottom；`≥ 1024px` 保留 Intro.js 自動定位。
- 使用者可透過 Intro.js 的下一步、上一步、略過與完成控制操作導覽；切換步驟時不得自動捲動遊戲畫面，導覽結束後牌桌恢復正常互動。

**Interface and data shape**

- 公開遊戲狀態增加 `hasAnyCardBeenPlayed: boolean`；舊狀態缺值輸出 false，後續回合保留 true。
- UseGameTutorial 對外提供包含 hasAnyCardBeenPlayed 的純資格判斷、startTutorial、等待 settlement 的介面及 disposeTutorial。
- GameStage 接收 hasAnyCardBeenPlayed prop，GameView 從 gameState 傳入；draw sequence 接收等待教學 settlement 的 callback。
- GameStage 傳入的目標 resolver 回傳 deck、hand、discard 三個 HTMLElement 與 opponents 三個 HTMLElement 的陣列；任一必要元素無效或 opponents 不是三個元素時不得啟動。
- TableCardPiles、PlayerHand 與 PlayerSeats 透過 defineExpose 提供命名明確的 DOM element getter；PlayerSeats getter 依 currentPlayerId 排除目前玩家且不移除既有公開方法。
- Intro.js instance 僅存在於 composable 內，GameStage 卸載時必須呼叫清理。

**Failure modes**

- 玩家資料尚未完成、玩家數量不是四人、目前玩家不存在、目前玩家是電腦、存在真人對手或 hasAnyCardBeenPlayed 為 true 時，導覽保持未啟動且 settlement 立即解除，不顯示錯誤。
- 任一導覽目標缺失時，本次更新不啟動；若同一掛載週期稍後目標就緒，可再次評估。
- 元件卸載、路由離開或 Intro.js 已結束時，清理操作必須可重複呼叫且不拋出錯誤。
- 導覽已啟動後的玩家或回合狀態更新不得建立第二個 instance。
- 第四步的暫時高亮 class 在任何結束路徑都必須清除；清除失敗不得讓座位永久停留在 overlay 上方。
- 出牌驗證失敗或尚未成功移入棄牌堆時不得把 hasAnyCardBeenPlayed 設為 true；公開舊狀態缺值不得造成載入失敗。
- 教學 createTour、start 或清理失敗時仍須解除 settlement；初始發牌流程請求 settlement 時若 tour 尚未 active 或 starting，須將本次掛載定案為略過，避免第一回合廣播永久等待或廣播後才補開教學。

**Acceptance criteria**

- node tests/game-tutorial.test.mjs 驗證一真人三電腦、混合真人、玩家數量錯誤、已出牌、目標缺失、固定步驟順序及 settlement 各結束路徑。
- server Jest 測試驗證第一回合真人先手、其他組合與後續回合維持隨機、成功出牌旗標及跨回合保留；tests/round-start-notice.test.mjs 驗證廣播在 settlement 後才播放。
- npm run build 成功解析 Intro.js import、Vue expose 介面與新增樣式。
- 人工在 `< 1024px` 與 `≥ 1024px` 橫向 viewport 檢查固定尺寸、四步順序、略過橫排、較深遮罩、藍框光暈、三位對手同步高亮、關閉後互動及無溢出。
- 人工在首次出牌前離開再進入時確認導覽再次顯示；成功出牌後離開再進入及後續回合皆不顯示，並確認第一回合廣播只在教學結束後出現。

**Scope boundaries**

- In scope: 前端觸發與廣播等待、四個 DOM 錨點、Intro.js 生命週期、game session JSON 出牌旗標、第一回合先手選擇、公開狀態契約及聚焦測試。
- Out of scope: 後續回合固定先手、資料庫 schema、房間建立與配對、跨 session 已讀偏好、獨立遊戲開始廣播、教學分析事件及其他路由。

## Risks / Trade-offs

- [Risk] PlayerSeats 的 stacking context 可能讓子座位無法個別越過 Intro.js overlay。 → Mitigation: 第四步只提升透明的 PlayerSeats 容器，明確暗化目前玩家並只替三個對手加藍框光暈，結束時集中清理 class。
- [Risk] 非同步遊戲狀態與 DOM 掛載時序可能使第一次評估找不到目標。 → Mitigation: 監看必要狀態並在 nextTick 後解析元素，只有成功啟動才設定 hasStarted。
- [Risk] Intro.js 全域 CSS 與現有樣式衝突。 → Mitigation: 自訂覆寫限定在 introjs 與 game-tutorial class，載入順序置於官方 CSS 之後，並以 npm run build 與兩個橫向 breakpoint 人工檢查。
- [Risk] 廣播流程可能在教學啟動失敗或元件卸載時永久等待。 → Mitigation: 將所有完成、退出、失敗與 dispose 路徑集中到可重複呼叫的 settlement，測試每條解除路徑。
- [Risk] 舊 game session 不含 hasAnyCardBeenPlayed。 → Mitigation: getPublicState 將缺值正規化為 false，不執行資料庫 migration。
- [Trade-off] 首次出牌前重新進入仍會再次顯示教學。 → Mitigation: 這符合 session 尚未開始操作的界線，並保留略過與關閉控制。
