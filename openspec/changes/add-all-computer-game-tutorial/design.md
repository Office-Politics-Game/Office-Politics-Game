## Context

/game 由 GameView 載入遊戲狀態，再由 GameStage 組合 TableCardPiles、PlayerHand 與 PlayerSeats。玩家資料已包含 isComputer，且各子元件已有定位矩形或元件 ref 的公開介面。Intro.js 已存在於前端依賴中，但尚未有集中管理導覽觸發、步驟與卸載清理的程式。

這項變更同時涉及 Vue 元件公開介面、導覽狀態判斷、第三方 overlay 生命週期與全域樣式，因此建立設計文件。介面必須沿用 Square UI 的方形輪廓、品牌色 token、僅橫向遊玩、`< 1024px`／`≥ 1024px` 兩檔固定尺寸與無溢出的限制。

## Goals / Non-Goals

**Goals:**

- 當目前玩家是真人且至少有一名其他玩家，並且所有其他玩家皆為電腦時，每次 /game 牌桌就緒後啟動導覽。
- 以固定順序說明抽牌區、手牌區、棄牌區與其他玩家位置。
- 在其他玩家步驟中準確說明淘汰與率先取得 3 次回合勝利的整場勝利條件。
- 在非符合情境、DOM 目標缺失、重複狀態更新及元件卸載時維持安全且不阻斷遊戲。
- 導覽在兩個橫向 breakpoint 維持固定尺寸、可讀、可關閉且不產生溢出。
- 深色遮罩需明確壓暗非目標區，前三步透明目標區需有藍色邊框與光暈，第四步需同時框選其餘三位玩家並保持其他區域深色。
- 「略過」控制的繁體中文文字必須維持單行橫排，且字級與所屬 breakpoint 的 tooltip 標題相同。
- 導覽不得捲動遊戲畫面以完整露出目標；手牌區原本超出 viewport 的部分與第二步框選範圍都必須維持原始構圖。
- `< 1024px` 小型橫向預設保留 Intro.js autoPosition，使抽牌與手牌步驟維持既有行為；透過 onBeforeChange 僅在進入棄牌步驟前暫時關閉 autoPosition，以保留目標左側定位，離開該步驟即恢復。三對手步驟使用專用 tooltip class 與固定垂直位移，將說明移到螢幕下半部；小型橫向的 tooltip padding、按鈕區 gap 與 helper padding 使用較緊湊的固定值。

**Non-Goals:**

- 不新增永久已讀狀態、手動重播入口或設定開關。
- 不修改電腦玩家決策、淘汰判定、回合勝利或整場勝利的後端規則。
- 不新增 API、Socket.IO 事件、資料庫欄位或分析追蹤。
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

### 每次符合條件的 GameStage 掛載只啟動一次

不使用 localStorage 或伺服器旗標。每個 GameStage instance 維護 hasStarted 狀態；players 非同步載入後首次滿足條件且四個目標皆存在時啟動，後續 socket 更新不重啟。離開 /game 後重新掛載會重新顯示，符合每次進入遊戲皆顯示的決定。

替代方案是監聽所有更新並在條件成立時反覆啟動；未採用，因為回合狀態更新會造成重複 overlay。

### 以固定橫向樣式整合深色遮罩與多對手高亮

src/main.js 載入 intro.js 的官方 CSS，並載入新的 game-tutorial 全域覆寫樣式。覆寫只使用既有品牌及 surface token 的值或衍生透明色，將 tooltip、按鈕與進度標記維持 0px 圓角，提供 hover、active、focus-visible 與 disabled 狀態。樣式僅使用 `< 1024px` 與 `≥ 1024px` 兩檔固定 px 尺寸；略過控制使用足夠固定寬度與 `white-space: nowrap`。Intro.js overlay opacity 設為 0.72，helper layer 與三個對手座位使用品牌藍邊框及藍色光暈。

替代方案是在 GameStage 使用 scoped CSS；未採用，因為 Intro.js tooltip 掛載於元件 scoped 範圍之外，選擇器無法可靠套用。

## Implementation Contract

**Observable behavior**

- 觸發條件為 players 包含 currentPlayerId 對應的真人玩家、至少一名其他玩家，且每名其他玩家的 isComputer 均為 true。
- 每個 /game 的 GameStage 掛載週期最多自動啟動一次；離開再進入 /game 會重新啟動。
- 步驟順序固定為抽牌區、手牌區、棄牌區、其他玩家位置；第四步同時高亮三個對手座位，其他牌桌區域維持深色遮罩。
- 第四步文案包含淘汰其他仍存活玩家的目標，以及率先累積 3 次回合勝利即贏得整場遊戲。
- `< 1024px` 的步驟位置依序為 right、自動、left、bottom；`≥ 1024px` 保留 Intro.js 自動定位。
- 使用者可透過 Intro.js 的下一步、上一步、略過與完成控制操作導覽；切換步驟時不得自動捲動遊戲畫面，導覽結束後牌桌恢復正常互動。

**Interface and data shape**

- UseGameTutorial 對外提供是否符合觸發條件的純判斷，以及 startTutorial 和 disposeTutorial 生命週期操作。
- GameStage 傳入的目標 resolver 回傳 deck、hand、discard 三個 HTMLElement 與 opponents 三個 HTMLElement 的陣列；任一必要元素無效或 opponents 不是三個元素時不得啟動。
- TableCardPiles、PlayerHand 與 PlayerSeats 透過 defineExpose 提供命名明確的 DOM element getter；PlayerSeats getter 依 currentPlayerId 排除目前玩家且不移除既有公開方法。
- Intro.js instance 僅存在於 composable 內，GameStage 卸載時必須呼叫清理。

**Failure modes**

- 玩家資料尚未完成、目前玩家不存在、目前玩家是電腦、沒有其他玩家或存在真人對手時，導覽保持未啟動，不顯示錯誤。
- 任一導覽目標缺失時，本次更新不啟動；若同一掛載週期稍後目標就緒，可再次評估。
- 元件卸載、路由離開或 Intro.js 已結束時，清理操作必須可重複呼叫且不拋出錯誤。
- 導覽已啟動後的玩家或回合狀態更新不得建立第二個 instance。
- 第四步的暫時高亮 class 在任何結束路徑都必須清除；清除失敗不得讓座位永久停留在 overlay 上方。

**Acceptance criteria**

- node tests/game-tutorial.test.mjs 驗證全電腦對手、混合真人對手、目前玩家為電腦、缺少目前玩家、零對手、目標缺失與固定步驟順序。
- npm run build 成功解析 Intro.js import、Vue expose 介面與新增樣式。
- 人工在 `< 1024px` 與 `≥ 1024px` 橫向 viewport 檢查固定尺寸、四步順序、略過橫排、較深遮罩、藍框光暈、三位對手同步高亮、關閉後互動及無溢出。
- 人工離開 /game 再進入同一全電腦對局時，導覽再次顯示；同一次停留期間的 socket 更新不重複顯示。

**Scope boundaries**

- In scope: 前端觸發判斷、四個 DOM 錨點、Intro.js 設定與清理、繁體中文文案、Square UI 覆寫及聚焦測試。
- Out of scope: 後端規則、房間建立流程、玩家配對、持久化偏好、教學分析事件及其他路由。

## Risks / Trade-offs

- [Risk] PlayerSeats 的 stacking context 可能讓子座位無法個別越過 Intro.js overlay。 → Mitigation: 第四步只提升透明的 PlayerSeats 容器，明確暗化目前玩家並只替三個對手加藍框光暈，結束時集中清理 class。
- [Risk] 非同步遊戲狀態與 DOM 掛載時序可能使第一次評估找不到目標。 → Mitigation: 監看必要狀態並在 nextTick 後解析元素，只有成功啟動才設定 hasStarted。
- [Risk] Intro.js 全域 CSS 與現有樣式衝突。 → Mitigation: 自訂覆寫限定在 introjs 與 game-tutorial class，載入順序置於官方 CSS 之後，並以 npm run build 與兩個橫向 breakpoint 人工檢查。
- [Trade-off] 每次進入都顯示會打斷熟悉規則的單機玩家。 → Mitigation: 這是已確認的產品決策，保留略過與關閉控制，不加入持久化抑制。
