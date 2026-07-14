## 1. 後端攤牌結果

- [x] 1.1 依照 **Showdown snapshot on deck exhaustion** 與 **Capture a transient showdown snapshot before next-round reset**，讓 `finishTurn` 在牌庫為空且至少兩位玩家存活時，於下一局重置前回傳只含存活者最後手牌及既有唯一勝者的 `showdownResult`，而一般換手、單一存活者與牌庫未空時不建立快照；以 `server/tests/roundFlowService.test.js` 的快照保存、淘汰者排除、非攤牌條件及同點沿用現行勝者案例驗證。
- [x] 1.2 依照 **Showdown action delivery and ordering**，讓 `playCardAction`、HTTP 出牌 response、Socket `play-card` action 與 acknowledgement 傳遞一致的可選 `showdownResult`，且 acknowledgement 的 `afterActionId` 等於已廣播 action ID；以 `server/tests` 的 action service/controller 測試及 `tests/socket-game-animation.test.mjs` 驗證 payload 與 action-before-state 順序。

## 2. 前端動畫與排程

- [x] 2.1 依照 **Survivor hand reveal and winner emphasis** 與 **Render a dedicated fixed-position GSAP overlay at hand anchors**，新增 `src/components/game/animations/RoundShowdownAnimation.vue`，在每位存活者手牌 anchor 顯示正面牌、只翻轉對手牌、只將指定勝者牌以中心放大到 1.5，並在 reduced-motion 下縮短過渡但保留結果停留；以 `tests/round-showdown-animation.test.mjs` 驗證存活者過濾、翻牌方向、縮放值、z-index、清理及缺少 anchor 時 fail-open。
- [x] 2.2 依照 **Winner announcement waits for showdown** 與 **Reuse the play-card action queue for ordering**，將攤牌接入 `GameStage` 與 `useGameSocketActions`，固定執行出牌動畫、卡牌效果、攤牌、套用 queued state 的順序，並從勝者牌完成放大後等待 2000 毫秒才 resolve，使既有 `roundWins` watcher 之勝者廣播只能在其後開啟；以 `tests/round-showdown-animation.test.mjs` 和 `tests/socket-game-animation.test.mjs` 驗證 Promise、state 與廣播順序。
- [x] 2.3 依照 **Preserve existing tie resolution and compatibility**，正規化有效 `showdownResult` 的 player ID 與卡牌資產，對缺欄位、空 players、缺 card、winner 不在 players 的資料跳過動畫但繼續套用 state，並讓無 `afterActionId` 的舊 acknowledgement 與 HTTP fallback 保持可用；以 `tests/round-showdown-animation.test.mjs` 的無效資料表格案例及既有 socket/API fallback 測試驗證不阻塞與向後相容。

## 3. 整合驗證

- [x] 3.1 執行 `node tests/round-showdown-animation.test.mjs`、`node tests/socket-game-animation.test.mjs`、`npm run build` 與 server 目錄的 `npm test`，確認新增與既有前後端測試全部通過，且 build 無 Vue、GSAP 或 CSS 錯誤；將失敗修正後才完成本任務。

## 4. 攤牌強調時間調整

- [x] 4.1 依照 **Survivor hand reveal and winner emphasis**、**Winner announcement waits for showdown** 與 **Render a dedicated fixed-position GSAP overlay at hand anchors**，將 `RoundShowdownAnimation` 的勝者縮放由 1.5 調整為 2，並將完成放大後的固定停留由 2000 毫秒調整為 5000 毫秒；同步更新 `tests/round-showdown-animation.test.mjs`，以常數與 action resolve 順序測試驗證 2 倍縮放及完整 5 秒停留後才播放勝者廣播。
- [x] 4.2 依 Square UI 驗收在手機橫向、平板與桌面尺寸手動檢查攤牌 overlay：使用既有色彩 token 衍生遮罩、無新增圓角控制項、勝者 2 倍牌不造成水平捲動，並確認「翻正面 → 放大 → 完整停留 5 秒 → 勝者廣播」順序；以三種 viewport 的人工驗收紀錄確認。
