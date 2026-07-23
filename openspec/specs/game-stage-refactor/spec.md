# game-stage-refactor Specification

## Purpose

TBD - created by archiving change 'refactor-game-stage'. Update Purpose after archive.

## Requirements

### Requirement: Game stage refactor preserves runtime contract

The game stage SHALL preserve its public integration contract while separating short-click card inspection from threshold-based drag play.

#### Scenario: GameView integration remains stable

- **WHEN** `GameView.vue` renders the game stage after the interaction change
- **THEN** the game stage accepts the same props and emits the same events as before the change
- **THEN** the game stage exposes `playDrawAnimation`, `playEffectAnimation`, `playRemoteCardPlayAnimation`, and `waitForNoticeIdle` with the same call shapes as before the change

#### Scenario: Animation and notice timing remains equivalent

- **WHEN** draw, initial round deal, remote card play, effect animation, round start notice, turn notice, winner notice, or eliminated notice flows run after the change
- **THEN** missing animation rectangles settle without throwing
- **THEN** pending notices and post-close ACK buffers continue to block `waitForNoticeIdle` until the same idle conditions are met

#### Scenario: Card play interaction distinguishes inspection and drag

- **WHEN** the current player short-clicks a hand card
- **THEN** centered inspection opens without starting the card-play flow
- **WHEN** the current player drags a playable hand or inspected card into the play zone
- **THEN** the card play animation, pending target selection, pending guess selection, confirm action, cancel action, local hidden played-card behavior, and emitted play-card payload match the pre-change behavior
- **THEN** blocked play states and advisor-rule disabled cards prevent dragging while retaining inspection access

---
### Requirement: Game view responsibilities remain modular

The game route view SHALL remain a thin coordination layer while focused composables own derived presentation data, room-state synchronization, and socket-action orchestration. The refactor MUST preserve the existing `GameStage` integration contract and player-visible behavior.

#### Scenario: Game view composes focused responsibilities

- **WHEN** the game route view initializes after the refactor
- **THEN** derived player and card presentation state is provided by a view-model composable
- **THEN** initial loading, room metadata, and Pinia state synchronization are provided by a room-state composable
- **THEN** socket subscriptions, ordered action animations, deferred state application, and HTTP fallbacks are provided by a socket-action composable
- **THEN** the route view retains only composable assembly, lifecycle coordination, and template bindings

#### Scenario: Relative player presentation remains equivalent

- **WHEN** a four-player game state is transformed for the current viewer
- **THEN** the viewer remains in the bottom position
- **THEN** the other players retain the same top, left, and right relative ordering
- **THEN** hand cards, discard cards, deck count, public hand counts, turn status, and draw eligibility match the pre-refactor output

#### Scenario: Socket action ordering remains equivalent

- **WHEN** socket game actions and their associated state updates arrive during animation
- **THEN** actions are deduplicated and animated sequentially in arrival order
- **THEN** a state update carrying `afterActionId` is applied only after the matching action completes
- **THEN** acknowledged draw and play states are applied immediately
- **THEN** the ready-for-computer-turn acknowledgement is sent only after pending actions and notices are idle

#### Scenario: Socket failure retains HTTP fallback

- **WHEN** a draw-card or play-card Socket acknowledgement fails
- **THEN** the corresponding HTTP action fallback is attempted
- **THEN** recoverable animation failures do not prevent the room state from being refreshed
- **THEN** listener cleanup removes both `game:action` and `game:state` handlers when the route view is destroyed or resubscribed

<!-- @trace
source: refactor-game-view
updated: 2026-07-11
code:
  - src/views/GameView.vue
  - src/composables/useGameViewModel.js
  - src/composables/useGameSocketActions.js
  - tests/game-view-refactor.test.mjs
  - tests/socket-game-animation.test.mjs
  - src/composables/useGameRoomState.js
-->
