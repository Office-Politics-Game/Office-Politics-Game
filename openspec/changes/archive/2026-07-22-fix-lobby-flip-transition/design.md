## Context

頂層 `RouterView` 目前用 `route.fullPath` 作為動態元件 key。Vue 會在 key 改變時重建路由元件，因此 `/lobby` 與 `/lobby/game-menu` 之間的子路由切換會重建 `Lobby.vue`。Lobby 的正反面由同一個元件內的 `isGameMenuRoute` 與 CSS class 控制；若父層被重建，瀏覽器無法觀察同一元素從未翻面到已翻面的狀態差異，700ms transition 就不會執行。

本變更只調整頂層動態元件 identity 與新增回歸測試。既有 Lobby CSS、路由結構、音效、按鈕事件及結算頁轉場均維持不變。

## Goals / Non-Goals

**Goals:**

- 讓同一頂層 matched route 的子路由共用同一個頂層路由元件實例。
- 恢復 Lobby 主選單前往遊戲選單的正向翻面與返回時的反向翻面。
- 保留頂層頁面之間的元件 identity 區隔與遊戲結算滑入轉場。
- 用可直接執行的回歸測試固定 key、路由動作、700ms 與 reduced-motion 契約。

**Non-Goals:**

- 不修改翻面視覺、時間、緩動曲線或 Square UI 樣式。
- 不更動 Vue Router 路由名稱、路徑、children 結構或公開介面。
- 不處理其他 Lobby 按鈕的獨立轉場。
- 不導入 lazy loading、端對端測試框架或新依賴。

## Decisions

### 使用頂層 matched route 建立穩定 RouterView key

動態元件 key SHALL 優先取 `route.matched[0]` 的穩定識別值。這讓 `LobbyHome` 與 `LobbyGameMenu` 雖有不同 full path 與葉節點 route name，仍共享頂層 `Lobby` identity；切換至其他頂層 route 時 key 仍會改變。

替代方案是移除 key，但這可能讓不相關頂層頁面重用元件 identity，改變現有重建語意。另一替代方案是對 Lobby 路徑寫死特例，但會把通用巢狀路由生命週期規則綁定單一路徑，後續難以維護。

### 提供 route name 與 path 的確定性 fallback

當 matched records 暫時不存在時，key SHALL 依序退回目前 route name 與 route path，確保 key 不會是未定義值。fallback 只保障異常或初始化邊界，不改變正常導航的 matched route 行為。

替代方案是只讀 matched record 而不 fallback；這會讓尚未完成解析或特殊 route object 的 identity 不明確，增加測試與維護風險。

### 保留既有 Transition name 判斷

`result-page-slide` 仍 SHALL 由 `route.query.transition === "game-end"` 決定，不把 transition name 納入 key，也不調整 CSS。頂層 key 只負責元件 identity，Transition name 只負責動畫選擇，兩者維持獨立。

替代方案是以 full path 或 query 組合 key 來驅動結算轉場，但這會重新引入同一路由 query 改變即重建的問題。

### 使用既有 Node source-contract 測試形式

新增的 `tests/lobby-flip-transition.test.mjs` SHALL 沿用現有 Node `node:test` 與 source assertion 慣例，直接驗證 RouterView key 不使用 fullPath、頂層 matched key 與 fallback 存在、雙向路由名稱正確、CSS 700ms 與 reduced-motion 契約仍在，以及 result-page-slide 判斷未移除。

替代方案是新增 Vue component 或瀏覽器端 E2E 測試框架；目前專案沒有對應依賴，為單一回歸導入新框架超出本變更範圍。

## Implementation Contract

**Behavior**

- 使用者在 `LobbyHome` 點擊「開始遊玩」後，URL 導向 `/lobby/game-menu`，同一個 Lobby DOM 由未翻面狀態過渡至 `rotateY(180deg)`。
- 使用者在 `LobbyGameMenu` 點擊「返回」後，URL 導向 `/lobby`，同一個 Lobby DOM 反向過渡回未翻面狀態。
- 翻面 transition 維持 700ms；系統偏好 reduced motion 時 transition 維持 `none`。
- 導航至不同頂層 route 時仍取得不同動態元件 key。
- 帶有 `transition=game-end` query 的結算導航仍選用 `result-page-slide`。

**Interface / data shape**

- 不新增或修改公開 API、props、emits、store shape 或 route name。
- RouterView key 的輸入為 Vue Router 提供的 route object；輸出優先為第一個 matched record 的名稱，缺少名稱時使用其 path，再依序退回目前 route name 與 route path。

**Failure modes and fallback**

- route 沒有 matched record 時不得產生例外；使用 route name 或 path 作為 fallback。
- 頂層 matched record 沒有 name 時不得退回 fullPath；改用該 record path，以免 query 或子路由變化造成不必要重建。
- 本變更不新增錯誤訊息或靜默捕捉例外。

**Acceptance criteria**

- `node tests/lobby-flip-transition.test.mjs` 通過。
- `npm run build` 通過。
- source-contract 測試確認 RouterView key 未直接或間接使用 `route.fullPath`。
- source-contract 測試確認 `LobbyGameMenu`、`LobbyHome`、700ms、reduced-motion 及 `result-page-slide` 契約均存在。

**Scope boundaries**

- In scope：頂層 RouterView identity 計算與 Lobby 翻面回歸測試。
- Out of scope：Lobby CSS 視覺重設、路由重構、載入效能、音效、其他頁面轉場與新測試框架。

## Risks / Trade-offs

- [Risk] 同一頂層 route 的 query 或子路由變化不再重建父層元件，可能保留父層區域狀態。→ Mitigation：這正是巢狀路由的預期 identity；測試鎖定 Lobby 行為，其他頂層 route 仍各自擁有不同 key。
- [Risk] source assertion 能防止已知結構回歸，但不等同真實瀏覽器動畫測量。→ Mitigation：同時固定觸發 class、路由方向、transition 時間與 reduced-motion，且不引入專案目前不存在的 E2E 框架。
- [Trade-off] 使用 matched record path fallback 比 fullPath 少了 query 粒度。→ 這可避免 query 導致不必要重建，符合本次修復目標。
