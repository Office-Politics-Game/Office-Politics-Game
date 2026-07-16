## Context

正式 `/game` 的實習生效果目前在 `InternAnimation` 收到結果後直接播放猜對或猜錯動畫。`GameView` 已將含 `name` 的玩家陣列傳入 `GameStage`，但 intern 動畫結果只包含目標 ID、目標手牌與結果，缺少玩家實際提交的猜測職位。此變更只調整正式遊戲資料與動畫鏈路，不修改 `CardPlayTestView` 等測試頁。

## Goals / Non-Goals

**Goals:**

- 在正式 `/game` 結果揭曉前清楚顯示本次猜測的目標暱稱與職位。
- 猜測提示停留 1 秒後與既有結果動畫疊加，並在結果退場時一起消失。
- 猜對與猜錯都顯示原始 `guessedCardName`，不誤用實際手牌作為猜測內容。
- 保持既有出牌動畫、正確翻牌／棄牌、錯誤光暈及 effect complete 協調契約。

**Non-Goals:**

- 不修改 `src/views/CardPlayTestView.vue` 或任何測試頁 fixture／按鈕。
- 不修改實習生卡牌規則或合法猜測範圍。
- 不新增職位翻譯表，也不修改其他卡牌效果動畫。
- 不調整 `GameView` 對外事件、Socket 事件名稱或資料庫結構。

## Decisions

### Intern 動畫結果攜帶原始猜測職位

`buildCardEffectAnimationResult` 在未受保護且存在目標手牌的 intern 結果加入 `guessedCardName`，`normalizeEffectAnimationResult` 驗證其為非空字串後保留。相較於從 `targetCard` 推導，此方式在猜錯時仍能準確呈現使用者選擇，也不需讓 `GameView` 保存暫態送出資料。

### GameStage 解析目標暱稱

`GameStage` 已持有標準化玩家陣列，應以字串化 ID 比對目前 intern 結果的 `targetPlayerId`，產生 `targetPlayerName` 傳給 `InternAnimation`。找不到玩家時固定使用 `玩家`，避免非同步狀態更新造成空白文字。相較於後端回傳暱稱，此作法沿用客戶端現有 metadata 合併結果，不擴大伺服器公開資料契約。

### 單一 GSAP 時間軸管理兩層文字

`InternAnimation` 將猜測提示與結果拆成獨立元素。每次播放先重設兩者，再顯示提示並建立 1 秒 hold，之後執行既有正確或錯誤分支；結果文字出現時提示保持可見，退場節點同時隱藏兩者。reduced-motion 僅縮短移動與翻牌效果，不移除 1 秒資訊停留與顯示順序。

### 既有職位名稱直接顯示

提示使用後端回傳的 `guessedCardName`，例如 `Manager` 或 `CEO`，與現有猜測選項及遊戲契約一致。此變更不建立獨立本地化映射，避免動畫文字與實際提交值產生偏差。

### 實習生目標與職位分階段選擇

`useGameStageCardPlay` 提供衍生狀態，辨識 pending card 是否同時需要 target 與 guess，以及目標是否已選定。`GameStage` 在未選目標時只開啟玩家頭像選擇且不掛載 `CardPlayConfirmPanel`；選定有效目標後停止頭像選擇並掛載既有面板，讓玩家選擇職位與確認出牌。只需要 target、不需要 guess 的卡牌不套用此門檻，以維持既有流程。相較於建立第二個彈窗元件，此作法重用既有職位選擇與確認面板，避免重複狀態。

### 動態值使用縮小黃色樣式

提示父層的 responsive 字級縮為原設定的 60%；玩家暱稱與 `guessedCardName` 分別包在語意 span 並套用 `#facc15`，「猜」與「是」仍由父層提供原色。黃色不是 Square UI 正式 token，但使用者已明確同意沿用遊戲現有黃色作為本次規範例外。

## Implementation Contract

- Behavior: 正式 `/game` 使用 Intern 出牌後先選擇目標玩家，目標選定後才顯示職位選擇彈窗；送出後的 intern effect 先以原字級的 60% 顯示整行 `猜 {targetPlayerName} 是 {guessedCardName}`，其中動態值為黃色；1 秒後顯示既有結果文字，兩者在結果動畫結束時同時消失，之後才 emit `complete`。
- Interface: 未受保護的 intern `animationResult` 形狀新增必要非空字串 `guessedCardName`；`InternAnimation` 接收目標玩家顯示名稱，並繼續接收既有 `result` 與定位函式。
- Failure modes: 前端收到缺少 `guessedCardName` 的 intern 結果時視為無效動畫結果並沿用既有忽略流程；目標玩家 metadata 缺失時顯示 `玩家`，不阻斷動畫。
- Acceptance: 後端 Jest 覆蓋猜對與猜錯資料形狀；前端 Node 測試覆蓋正規化、暱稱解析與時間軸關鍵順序；`npm run build` 成功；正式 `/game` 可人工驗證兩種 outcome。
- Scope boundaries: 僅修改正式 `/game` 使用的 intern 選擇流程、動畫資料與呈現鏈路；`CardPlayTestView` 與其他測試頁、卡牌規則、回合流程、保護效果及其他動畫均不變。

## Risks / Trade-offs

- [Risk] 舊版後端未提供 `guessedCardName` 時新版前端不播放 intern 結果動畫 → 前後端需同版部署，回滾時也一併回滾契約變更。
- [Risk] 玩家清單在動畫開始前已更新而找不到淘汰玩家 → 使用 `玩家` 備援確保句子完整，且不延遲動畫等待 metadata。
- [Trade-off] 固定 1 秒停留會延長每次實習生效果 → 這是使用者指定的資訊閱讀時間，且維持在單一效果動畫序列內。
