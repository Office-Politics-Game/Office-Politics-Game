## Context

目前 `finishTurn` 在牌庫為空時呼叫勝者判定，若尚未達成整場三勝條件便立即執行下一小局初始化；因此送到前端的公開 state 已經包含新手牌，上一小局的存活玩家手牌無法再用於攤牌。Socket 出牌流程雖會先送出 `game:action` 再送出 `game:state`，但出牌者仍會從 acknowledgement 立即套用 state，造成與其他玩家不同的動畫與廣播時序。

本變更跨越回合服務、遊戲 action 傳輸、前端 socket 佇列及遊戲舞台動畫。前端必須沿用 Vue 3、GSAP、既有卡牌資產正規化、`EffectCardLayer` 和 `useGameAnimationRects`，且視覺使用 Square UI 的方形介面與既有色彩 token 衍生值。

## Goals / Non-Goals

**Goals:**

- 在牌庫耗盡且仍有至少兩位玩家存活時，保存重置前的唯一攤牌結果。
- 讓所有連線玩家依相同順序看到出牌、卡牌效果、攤牌與勝者廣播。
- 在玩家原手牌位置翻開存活手牌，將唯一勝者手牌精確放大至 2 倍，並在放大完成後維持 5000 毫秒。
- 保持 Socket.IO 與 HTTP 備援路徑的結果一致，且不增加新的套件。

**Non-Goals:**

- 不修改點數算法、三勝規則、回合勝者廣播樣式或持續時間。
- 不新增同點破平規則；沿用目前排序結果所選出的唯一勝者。
- 不為中途重新連線的玩家重播已結束的攤牌動畫。
- 不延後後端建立下一小局 state，也不建立需要多玩家 acknowledgement 的伺服器狀態機。

## Decisions

### Capture a transient showdown snapshot before next-round reset

`finishTurn` 在確認牌庫為空、存活玩家數量大於一且完成 `checkWinner` 後，先建立 `showdownResult`，再依既有流程開始下一小局。資料形狀固定為：

```json
{
  "reason": "deck-empty",
  "winnerPlayerId": 2,
  "players": [
    { "playerId": 1, "card": { "id": 5, "name": "PM" } },
    { "playerId": 2, "card": { "id": 8, "name": "CEO" } }
  ]
}
```

`players` 只包含未淘汰玩家，每位玩家只帶當時 `hand[0]`。快照是 action 結果的一部分，不寫回持久化 state；如此可保留既有立即初始化下一局的伺服器模型，也避免把已公開的上一局手牌混入新局公開 state。

替代方案是延後 `startNextRound` 直到所有客戶端回報動畫完成，但這會引入斷線、逾時與多客戶端協調狀態，因此不採用。

### Reuse the play-card action queue for ordering

Socket `play-card` action 與 HTTP 出牌回應新增可選的 `showdownResult`。Socket acknowledgement 同時回傳與 action 相同的 `afterActionId`；前端出牌成功時將此回應交給既有 `handleSocketGameState` 延後機制，而不是立即呼叫 `applyGameStatePayload`。佇列依序等待遠端出牌動畫、既有卡牌效果動畫及攤牌動畫，完成後才套用 state。

若 `showdownResult` 缺失或結構無效，前端跳過攤牌但仍完成 action 並套用 state，避免動畫資料問題卡住遊戲。HTTP 備援路徑會先播放回應內的效果及攤牌，再套用回應 state 或刷新房間 state。

替代方案是在勝場 watcher 內加入固定延遲，但 watcher 看不到上一局手牌，且無法保證出牌者與其他玩家同步，因此不採用。

### Render a dedicated fixed-position GSAP overlay at hand anchors

新增 `RoundShowdownAnimation`，透過 `GameStage` 提供的 `getPlayerHandRect` 將每張快照手牌渲染到玩家既有手牌位置。動畫使用 `EffectCardLayer` 顯示正反面：對手從背面同步翻至正面，自己的手牌維持正面；翻牌完成後只將 `winnerPlayerId` 對應卡牌以中心為原點放大到 2，提升其 z-index，並保持 5000 毫秒才 resolve。

動畫層使用固定定位、無指標事件及由 `--brand-navy` 衍生的遮罩色，不加入圓角控制項。`prefers-reduced-motion` 使用既有縮短過渡時間，但保留 5000 毫秒結果停留時間。元件卸載或新動畫取代舊動畫時必須 kill GSAP timeline 並 resolve/清理狀態，避免 action 佇列永久等待。

直接修改 `PlayerSeats` 與 `PlayerHand` 的實際牌面會讓下一局 state 更新與手牌生命週期交錯，因此採用一次性 overlay。

### Preserve existing tie resolution and compatibility

後端 `checkWinner` 仍是唯一勝者來源。最高點數同點時不在快照建立流程重新排序或重新計算，`winnerPlayerId` 直接採用現行判定結果。所有新增欄位皆為可選；沒有攤牌資料的舊 action 或一般回合維持原行為。

## Implementation Contract

**Behavior**

- 僅當最後一次出牌後牌庫為空且未淘汰玩家至少兩位時播放攤牌。
- 所有存活玩家的最後一張手牌在原手牌位置展示正面；淘汰玩家不建立動畫牌。
- 對手牌由背面翻正，自己的牌保持正面。翻牌完成後只有後端指定勝者牌縮放為 2。
- 勝者牌完成放大後必須完整保持 5000 毫秒，之後 action 才完成，新的 state 才能觸發既有回合勝利廣播。
- 牌庫未空、只剩一名存活者或攤牌 payload 無效時不播放攤牌，且遊戲流程不得被阻塞。

**Interface / data shape**

- `finishTurn(state, playerId)` 必須讓呼叫端取得 mutated `state` 與可選 `showdownResult`；所有現有 state mutation 行為保持不變。
- `playCardAction`、HTTP 出牌回應及 Socket `play-card` action 使用相同的可選 `showdownResult` 形狀：`reason` 固定為 `deck-empty`、`winnerPlayerId` 為現行勝者 ID、`players` 為一到四筆 `{ playerId, card }`。
- Socket 出牌 acknowledgement 回傳 `afterActionId`，值必須等於已廣播 `play-card` action 的 ID。
- 前端正規化後將 player ID 轉為字串並以既有 `normalizeCard` 補齊卡牌展示資產；缺少 winner、空 players、無 card 或 winner 不在 players 時視為無效。

**Failure modes**

- 找不到任一必要手牌 anchor 時，動畫元件必須清理已建立的動畫層並完成 Promise，不得卡住 state 套用。
- GSAP timeline 被取消、元件卸載或收到替代動畫時，必須完成清理並釋放等待中的 action。
- Socket acknowledgement 含 `afterActionId` 時依 action 佇列套用；沒有該欄位的舊回應維持立即套用，確保向後相容。
- HTTP 備援取得有效 `showdownResult` 時播放同一動畫；無效資料只記錄警告並繼續刷新 state。

**Acceptance criteria**

- `server/tests/roundFlowService.test.js` 證明重置前快照、存活者過濾、唯一勝者與非攤牌條件。
- `tests/socket-game-animation.test.mjs` 證明 action、acknowledgement 與 deferred state 的順序契約。
- `tests/round-showdown-animation.test.mjs` 證明 2 倍縮放、5000 毫秒保持、存活牌翻正及動畫完成後才套用 state。
- `npm run build`、指定前端 Node 測試及 server 目錄的 `npm test` 全部成功。

**Scope boundaries**

- In scope：回合結果快照、Socket/HTTP 傳輸、前端 action 排程、攤牌動畫、相關測試。
- Out of scope：持久化 schema、重新連線重播、遊戲規則更動、既有廣播 UI 重設計、其他卡牌效果動畫重構。

## Risks / Trade-offs

- [Risk] 出牌 ack 與 socket action 到達順序不同，可能重複或提早套用 state → 使用相同 `afterActionId` 交由既有 pending/completed action maps 去重與排序。
- [Risk] 下一局 state 已在後端建立，動畫只能依快照顯示上一局牌 → 快照由勝者判定後立即複製，不讀取後續 mutable hand。
- [Risk] 小螢幕上 2 倍勝者牌可能與相鄰 UI 重疊 → overlay 使用高 z-index 並允許視覺重疊，但保持遊戲舞台 `overflow-hidden`，不造成水平捲動。
- [Risk] 動畫 anchor 暫時不存在 → fail-open 完成 action，確保遊戲狀態繼續同步。
