## Tasks

- [x] 1. Implement 電腦玩家使用真實 players row 並由 room slot 標記 for Computer players are represented in room and game state
  - Add an idempotent `game_room_players.is_computer BOOLEAN NOT NULL DEFAULT false` schema change in `server/src/db/schema.sql`.
  - Add an idempotent helper in `server/src/services/roomService.js` that finds or creates reserved computer `players` rows with stable usernames.
  - Ensure `getRoomState` returns `isComputer` for each room player and `isReady: true` for computer players.

- [x] 2. Implement 房間加入電腦以 socket 為主、HTTP fallback 為輔 for Host can add computer players to a waiting room and Room computer player contract
  - Add `addComputerPlayer({ roomCode, hostPlayerId })` in `server/src/services/roomService.js` with validations for room existence, host-only access, waiting status, and max four players.
  - Add `room:add-computer` in `server/src/socket/roomHandlers.js`, broadcast `room:state` on success, and return the updated room state in the ACK response.
  - Add HTTP fallback in the room route/controller/service path and expose it through `src/services/roomApi.js`.

- [x] 3. Replace Custom room local fake computer behavior within Scope boundaries
  - Update `src/stores/roomStore.js` with an `addComputerPlayer` action that prefers `room:add-computer` and falls back to HTTP.
  - Update `src/views/CustomRoomView.vue` so the add-computer button calls the store action, renders only backend room players, and always starts games through `room:start`.
  - Remove the local computer start shortcut and the initial ranking-based fake computer prefill from the Custom room flow.

- [x] 4. Preserve computer metadata into game state
  - Update `server/src/services/roomService.js` start-game query to include `grp.is_computer`.
  - Update `server/src/game/initialState.js` to copy `isComputer` into each game player.
  - Update `server/src/services/gameStateService.js` so public game state includes `isComputer`.
  - Update `src/views/GameView.vue` player normalization so computer players remain displayable and non-controllable.

- [x] 5. Implement 電腦決策集中在 computerPlayerService for Computer turns are decided by the backend and Computer turn contract
  - Create `server/src/services/computerPlayerService.js` with `runComputerTurn({ roomCode })` and helper functions for current computer detection, playable card selection, target selection, and Intern guessed card.
  - Use existing `drawCardAction` and `playCardAction` so all normal rules, effects, round flow, and action logs stay authoritative.
  - Ensure non-computer current turns return a no-op result without mutating game state.

- [x] 6. Add backend action/state emission helpers for computer turns
  - Refactor reusable socket emission helpers in `server/src/socket/gameHandlers.js` so human and computer draw/play actions can emit the same viewer-specific `game:action` and `game:state` payloads.
  - Include stable action ids and set `afterActionId` on emitted states that must wait for a matching animation.
  - Keep hidden card data private by sending drawn card details only to the drawing player's socket room.

- [x] 7. Implement computer turn ACK socket orchestration
  - Add `game:ready-for-computer-turn` in `server/src/socket/gameHandlers.js` with payload validation for room membership and `reason`.
  - Add an in-memory `activeComputerTurnRooms` lock so concurrent ACKs for the same room cannot duplicate computer actions.
  - After ACK, read latest state and run computer action emission only when phase is playing and the current turn player has `isComputer: true`.

- [x] 8. Implement Action/state 以 afterActionId 綁定動畫完成 for Game state waits for matching action animation
  - Replace the single `pendingSocketGameState` path in `src/views/GameView.vue` with action-id keyed pending state storage.
  - Apply a `game:state` with `afterActionId` only after the matching queued action completes its animation chain.
  - Preserve normal immediate application for states without `afterActionId`.

- [x] 9. Implement ACK event 有鎖且只在電腦回合生效 and Animation ACK contract for Frontend ACK controls computer turn advancement
  - Extend `src/components/game/ui/GameStage.vue` exposes or emits so `GameView.vue` can await remote draw, remote play, effect animation, round winner notice, player eliminated notice, round start notice, shuffle, and deal completion as a single sequence.
  - Send `game:ready-for-computer-turn` with `reason: "action-complete"` only after post-action animation and notices complete.
  - Send `game:ready-for-computer-turn` with `reason: "round-start"` only after new round notices, shuffle, and deal animations complete.

- [x] 10. Add backend tests
  - Add or update backend tests covering add-computer success, non-host rejection, full room rejection, started room rejection, state metadata preservation, non-computer no-op, draw-then-play, Advisor rule, target selection, Intern CEO guess, ACK lock, and no immediate computer run before ACK.
  - Run `cd server` then `npm test`.

- [x] 11. Add frontend integration tests for PVP flow is not delayed by computer player behavior
  - Add Node tests covering Custom room add-computer store wiring, removal of local fake computer start, `afterActionId` state deferral, action-complete ACK timing, round-start ACK timing, and PVP flow without PVE delay.
  - Run the relevant root `node tests\\*.test.mjs` scripts and `npm run build`.
