## Context

目前分支已有 `game:action` / `game:state` socket 事件、`GameView.vue` 的 socket action queue、`GameStage.vue` 的抽牌/出牌/效果/notice 動畫方法。房間端仍存在 local fake computer player：`CustomRoomView.vue` 會用排行榜資料填入本地 slot，並在有 local computer 時跳過後端 `room:start`。後端資料模型則要求 `game_room_players.player_id` 與 `game_sessions.current_turn_player_id` 都參照 `players.id`，因此第一版電腦玩家必須使用真實 player row，而不是虛擬 id。

## Goals / Non-Goals

**Goals:**

- 房主可在等待房間用 socket 加入後端電腦玩家，room state 與 game state 都能標示 `isComputer: true`。
- 後端是唯一遊戲裁判，電腦玩家抽牌、選牌、選目標、猜牌與出牌都在後端執行。
- 前端只負責動畫與 ACK：`game:state.afterActionId` 對應的 state 必須等該 `game:action.id` 動畫完成後才套用。
- 電腦回合只在真人 action 完成 ACK 或新回合動畫完成 ACK 後嘗試啟動。
- 四真人 PVP 流程不等待 PVE 專用 delay，也不因 ACK event 造成額外自動回合。

**Non-Goals:**

- 不開發聰明 AI、難度等級、勝率推理或根據對手手牌調整策略。
- 不重寫整套卡牌動畫；只把既有抽牌、出牌、效果、淘汰、勝利與新回合動畫整理成可等待的完成訊號。
- 不新增移除電腦玩家、調整電腦玩家頭像外觀或觀戰模式。
- 不處理多 server instance 的分散式 lock；第一版使用單一 Node process 的 in-memory lock。

## Decisions

### 電腦玩家使用真實 players row 並由 room slot 標記

在 `players` 建立系統電腦玩家資料，並在 `game_room_players` 新增 `is_computer BOOLEAN NOT NULL DEFAULT false`。加入電腦時使用既有或新建的系統電腦玩家 row 佔用空 seat，room state 回傳 `isComputer: true`，start game 時 `createInitialState` 將該欄位複製進 state players。

選這個方案是因為現有 FK 已綁定 `players.id`，可避免大幅調整 `game_sessions.current_turn_player_id`、action logs 與 game state 的 player id 型別。替代方案是使用負數或字串虛擬 id，但會破壞 FK、public state viewer 驗證與多處 `Number(playerId)` 邏輯。

### 房間加入電腦以 socket 為主、HTTP fallback 為輔

新增 `room:add-computer` socket event，payload 為 `{ roomCode, hostPlayerId }`，成功回傳 `{ ok: true, data: roomState }` 並 broadcast `room:state`。同時新增 HTTP fallback 給 `roomStore` 在 socket 失敗時呼叫。後端驗證 room exists、requester is host、room status is waiting、room has empty seat、room does not already contain the same computer row。

Custom room 必須移除 local fake computer start path。加入電腦按鈕改呼叫 store action，成功後只使用後端回傳的 `players` 顯示 slot；開始遊戲永遠走 `room:start`。

### 電腦決策集中在 computerPlayerService

新增 `runComputerTurn({ roomCode })` 與 `runComputerTurns({ roomCode, io })`。`runComputerTurn` 每次只處理目前電腦玩家的一個完整 turn：必要時先呼叫 `drawCardAction`，再依最新 hand 選牌並呼叫 `playCardAction`。選牌規則固定且可測：遵守 Advisor 規則，優先出低 rank，CEO 最後出，需要目標時選第一個合法未淘汰目標，Intern 固定猜 `"CEO"`。

`runComputerTurns` 不連續無等待地跑完整串電腦回合。它只在一次 ACK 後推進目前電腦玩家需要發出的 action/state，下一段電腦回合必須等前端再次送 `game:ready-for-computer-turn`。這保證電腦連續回合仍由前端動畫節奏驅動，不退回固定秒數等待。

### Action/state 以 afterActionId 綁定動畫完成

後端 emit 電腦 draw 或 play 時，先 emit `game:action`，再 emit `game:state`，該 state 帶 `afterActionId` 等於前一個 action id。前端收到帶 `afterActionId` 的 state 時，必須將 state 暫存到以 action id 為 key 的 pending map；只有對應 action 動畫、效果動畫與 notice queue 全部完成後才套用 state。

現有 `pendingSocketGameState` 單一暫存值必須升級，避免連續電腦 action 覆蓋 state。`GameStage` 應 expose 或 emit 一個完成 promise，涵蓋遠端出牌動畫、效果動畫、淘汰 notice、勝利 notice、新回合洗牌與發牌動畫。`GameView` 負責 socket protocol 與 ACK，不讓 UI component 直接呼叫 socket。

### ACK event 有鎖且只在電腦回合生效

新增 `game:ready-for-computer-turn`，payload 為 `{ roomCode, playerId, reason }`，`reason` 只能是 `"action-complete"` 或 `"round-start"`。後端驗證 player 在房間內、最新 state phase 為 `playing`、current turn player 是 `isComputer` 後才啟動電腦回合。

因多個 client 可能同時 ACK，`gameHandlers` 使用 `activeComputerTurnRooms` in-memory Set 做 room-level lock。若同房間已在處理，後端回傳 ok 但不重複啟動。若目前不是電腦回合，後端回傳 ok 且不 emit action。

## Implementation Contract

### Room computer player contract

- Interface: `room:add-computer` socket event accepts `{ roomCode, hostPlayerId }`; HTTP fallback uses the same payload and returns the same room state shape.
- Room player shape: each computer player in room state and game state exposes `{ playerId, username, seatOrder, isComputer: true, isReady: true }`.
- Failure modes: non-host, missing room, non-waiting room, and full room return `{ ok: false, error: { message } }` through socket and matching HTTP status through fallback.
- Acceptance: service/socket tests prove host success, non-host rejection, full room rejection, started room rejection, and returned room state containing `isComputer: true`.

### Computer turn contract

- Interface: `runComputerTurn({ roomCode })` reads latest game session and returns the action/state results it emitted or performed for the current computer player.
- Behavior: if current player is not computer, no game action is performed. If current computer player has fewer than two cards and deck has cards, it draws before playing. It then plays one legal card according to the deterministic first-version rules.
- Acceptance: backend tests cover not-computer no-op, draw-then-play, Advisor rule, first legal target, Intern guessing CEO, and protected target behavior not blocking legal play.

### Animation ACK contract

- Interface: `game:action` has stable `id`; `game:state` may include `afterActionId`; `game:ready-for-computer-turn` accepts `{ roomCode, playerId, reason: "action-complete" | "round-start" }`.
- Behavior: front end applies a state with `afterActionId` only after the matching action animation chain finishes. After applying the post-action state and completing notices, `GameView` sends `"action-complete"`. After new round shuffle/deal/round-start notices finish, `GameView` sends `"round-start"`.
- Acceptance: frontend tests prove state deferral by `afterActionId`, ACK after action/effect/notices, ACK after new round animation, and no visual error when ACK is sent during a human turn.

### Scope boundaries

- In scope: backend room state, backend game state, socket/HTTP contracts, deterministic computer decisions, existing animation completion wiring, focused tests.
- Out of scope: advanced AI strategy, multiplayer scaling beyond one Node process, cosmetic redesign, new card effect visuals, removing human players from room.

## Risks / Trade-offs

- [Risk] Creating system computer rows can collide on unique usernames. → Use deterministic reserved usernames such as `Computer 1` through `Computer 4` and an idempotent lookup/create helper.
- [Risk] Multiple clients ACK the same animation. → Room-level in-memory lock makes duplicate ACKs no-op while the first handler is active.
- [Risk] Existing single pending state value loses ordering during computer chains. → Replace it with action-id keyed pending state and serialized queue processing.
- [Risk] Existing animation methods do not cover notice completion as a single promise. → Keep socket ACK orchestration in `GameView` and add minimal `GameStage` exposed methods/events for completed sequences.
- [Risk] HTTP fallback cannot drive realtime computer turns alone. → Treat HTTP fallback only for adding computer to room; game turn automation remains socket-driven.

## Migration Plan

1. Add idempotent schema changes for `game_room_players.is_computer` and any supporting indexes/defaults.
2. Seed or lazily create reserved computer `players` rows when `addComputerPlayer` is called.
3. Deploy backend and frontend together because room state and game state gain `isComputer`.
4. Rollback by disabling the Add Computer UI and leaving `is_computer` default false; existing human-only rooms remain compatible.

## Open Questions

- None for first implementation. The first version will use deterministic simple play and reserved player rows as described above.
