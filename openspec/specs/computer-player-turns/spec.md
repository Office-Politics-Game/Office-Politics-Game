# computer-player-turns Specification

## Purpose

TBD - created by archiving change 'rework-computer-player-turns'. Update Purpose after archive.

## Requirements

### Requirement: Host can add computer players to a waiting room

The system SHALL allow the room host to add a computer player to a waiting room through the backend room state.

#### Scenario: Host adds a computer player

- **WHEN** the host sends `room:add-computer` with a valid `roomCode` and `hostPlayerId` for a waiting room with an empty seat
- **THEN** the system SHALL add one ready computer player to the next available seat and broadcast the updated room state

#### Scenario: Non-host cannot add a computer player

- **WHEN** a non-host sends `room:add-computer` for a room
- **THEN** the system MUST reject the request and MUST NOT change the room players

#### Scenario: Full or started room cannot add a computer player

- **WHEN** `room:add-computer` is sent for a room that is full or no longer waiting
- **THEN** the system MUST reject the request and MUST NOT change the room players

##### Example: room add validation

| Room status | Player count | Requester | Expected |
| ----------- | ------------ | --------- | -------- |
| waiting | 3 | host | one computer player is added |
| waiting | 4 | host | request is rejected |
| playing | 3 | host | request is rejected |
| waiting | 3 | non-host | request is rejected |

---
### Requirement: Computer players are represented in room and game state

The system SHALL represent computer players as backend-owned players with `isComputer: true` and `isReady: true` in room state and game state.

#### Scenario: Room state includes computer metadata

- **WHEN** a room contains a computer player
- **THEN** the room state SHALL include that player with `playerId`, `username`, `seatOrder`, `isComputer: true`, and `isReady: true`

#### Scenario: Game state preserves computer metadata

- **WHEN** a game starts from a room containing a computer player
- **THEN** the game state SHALL include the computer player with `isComputer: true` and the same `playerId` and `seatOrder` from the room state

---
### Requirement: Computer turns are decided by the backend

The system SHALL decide computer player draw, card selection, target selection, guessed card, and play action on the backend.

#### Scenario: Computer turn draws before playing when needed

- **WHEN** the current turn player is a computer player with fewer than two cards and the deck has cards
- **THEN** the backend SHALL perform a draw action before selecting and playing a card

#### Scenario: Computer turn uses deterministic first-version strategy

- **WHEN** the current turn player is a computer player with playable cards
- **THEN** the backend SHALL choose a legal card by prioritizing lower ranks, keeping CEO as the last choice, obeying Advisor restrictions, selecting the first legal target when a target is required, and guessing `CEO` for Intern

#### Scenario: Human turn does not trigger computer action

- **WHEN** computer turn execution is requested while the current turn player is not a computer player
- **THEN** the backend MUST NOT draw, play, or mutate game state for a computer player

---
### Requirement: Game state waits for matching action animation

The system SHALL support action-bound state delivery by using `game:action.id`, `game:state.afterActionId`, and `game:state.readyForComputerTurn`.

#### Scenario: State is deferred until matching action finishes

- **WHEN** the frontend receives `game:state` with `afterActionId` equal to a pending `game:action.id`
- **THEN** the frontend SHALL apply that state only after the matching action animation, effect animation, and related notices have finished

#### Scenario: State without action binding applies normally

- **WHEN** the frontend receives `game:state` without `afterActionId`
- **THEN** the frontend SHALL apply the state without waiting for an action id

#### Scenario: Intermediate draw state does not advance computer turns

- **WHEN** a computer turn emits a `draw-card` action and then a `game:state` for the drawn card
- **THEN** that state SHALL include `readyForComputerTurn: false`
- **AND** the frontend SHALL NOT send `game:ready-for-computer-turn` after applying that draw state

#### Scenario: Post-play state may advance computer turns

- **WHEN** a computer or human turn emits a `play-card` action and then a `game:state` for the completed play
- **THEN** that state SHALL include `readyForComputerTurn: true`
- **AND** the frontend MAY send `game:ready-for-computer-turn` only after the matching play animation, effect animation, notices, and any queued action sequence have finished

---
### Requirement: Frontend ACK controls computer turn advancement

The system SHALL start or continue computer player turns only after the frontend acknowledges completed animation sequences.

#### Scenario: ACK after action completion can start computer turn

- **WHEN** the frontend sends `game:ready-for-computer-turn` with `reason: "action-complete"` after an action animation sequence has completed
- **THEN** the backend SHALL run a computer turn only if the latest current turn player is a computer player

#### Scenario: ACK after round start can start computer turn

- **WHEN** the frontend sends `game:ready-for-computer-turn` with `reason: "round-start"` after new round notices, shuffle, and deal animations have completed
- **THEN** the backend SHALL run a computer turn only if the latest current turn player is a computer player

#### Scenario: Duplicate ACK does not duplicate computer actions

- **WHEN** multiple clients send `game:ready-for-computer-turn` for the same room while a computer turn is already active
- **THEN** the backend MUST process at most one computer turn pipeline for that room and MUST acknowledge the duplicate requests without emitting duplicate game actions

---
### Requirement: PVP flow is not delayed by computer player behavior

The system SHALL keep human-only games free from computer-player-specific waits and automatic actions.

#### Scenario: Human-only room remains manual

- **WHEN** a room has four human players and a player completes a draw or play action
- **THEN** the system MUST NOT wait for computer thinking delay and MUST NOT emit computer player actions
