# round-showdown-animation Specification

## Purpose

TBD - created by archiving change 'add-round-showdown-animation'. Update Purpose after archive.

## Requirements

### Requirement: Showdown snapshot on deck exhaustion

When a played card completes a turn with an empty deck and at least two non-eliminated players, the backend SHALL create a transient showdown result before resetting the next round. The showdown result SHALL use reason `deck-empty`, SHALL identify the winner selected by the existing winner logic, and SHALL contain the final hand card of every non-eliminated player. The backend MUST NOT include eliminated players in the showdown result.

#### Scenario: Multiple survivors reach showdown

- **WHEN** player 1 holds rank 5, player 2 holds rank 8, player 3 is eliminated, and the final played card completes a turn with an empty deck
- **THEN** the showdown result contains players 1 and 2 with their final cards, excludes player 3, and identifies player 2 as the winner

##### Example: Showdown snapshot survives next-round reset

- **GIVEN** player 1 holds card 5, player 2 holds card 8, both players are alive, and the deck is empty
- **WHEN** the turn finishes and the backend initializes the next round
- **THEN** the persisted state contains the next-round hands while the returned showdown result still contains cards 5 and 8 with winner player 2

#### Scenario: Showdown is not created for elimination victory

- **WHEN** a turn ends with exactly one non-eliminated player
- **THEN** the backend does not create a showdown result and preserves the existing immediate winner flow

#### Scenario: Showdown is not created before deck exhaustion

- **WHEN** a turn ends while at least one card remains in the deck
- **THEN** the backend does not create a showdown result

---
### Requirement: Showdown action delivery and ordering

The play-card Socket.IO action and HTTP fallback response SHALL carry the same optional showdown result. A Socket.IO play-card acknowledgement containing a showdown result SHALL include an `afterActionId` equal to the broadcast action ID. The frontend MUST defer applying the associated game state until the play-card action animation sequence completes.

#### Scenario: Acting player receives deferred state

- **WHEN** the acting player receives a play-card acknowledgement and socket action for the same `afterActionId`
- **THEN** the frontend queues the acknowledgement state and applies it only after the play-card, card-effect, and showdown animations complete

#### Scenario: Other players receive deferred state

- **WHEN** a non-acting player receives a play-card action followed by a game state carrying the same `afterActionId`
- **THEN** the frontend applies that state only after the action animation sequence completes

#### Scenario: Invalid showdown data fails open

- **WHEN** a play-card action has a missing winner, an empty player list, a player without a card, or a winner absent from the player list
- **THEN** the frontend skips the showdown animation and continues applying the queued state without blocking the game

---
### Requirement: Survivor hand reveal and winner emphasis

The game stage SHALL display each showdown player's final card at that player's existing hand anchor. Opponent cards SHALL flip from back to front, the current player's card SHALL remain face up, and eliminated players MUST NOT receive an animation card. After the reveal completes, the card belonging to `winnerPlayerId` SHALL scale to exactly 2 from its center while all other cards remain at their normal scale.

#### Scenario: Survivor cards reveal at their seats

- **WHEN** a valid showdown result contains three surviving players
- **THEN** the game stage renders three face-up animation cards at the corresponding hand anchors and excludes every eliminated player

#### Scenario: Winner card is emphasized

- **WHEN** all showdown cards finish revealing
- **THEN** only the card associated with `winnerPlayerId` scales to 2 and renders above the other showdown cards

#### Scenario: Reduced motion preserves result visibility

- **WHEN** the viewer has requested reduced motion
- **THEN** the reveal and emphasis transitions use reduced durations while the winner result remains displayed for the full required hold duration

---
### Requirement: Winner announcement waits for showdown

The showdown animation SHALL keep the emphasized winner card visible for 5000 milliseconds after the scale-to-2 transition completes. The animation SHALL resolve only after that hold, and the frontend SHALL apply the queued round result only after resolution so the existing winner announcement cannot open before the hold completes.

#### Scenario: Announcement follows the five-second hold

- **WHEN** the winner card completes its scale-to-2 transition at time T
- **THEN** the queued state remains unapplied before T plus 5000 milliseconds and the existing winner announcement opens only after the showdown animation resolves

#### Scenario: Missing hand anchor does not block state

- **WHEN** a required player hand anchor is unavailable during showdown setup
- **THEN** the animation cleans up, resolves without the visual sequence, and permits the queued state to be applied

#### Scenario: Component cleanup releases the queue

- **WHEN** the game stage unmounts or a replacement animation cancels an active showdown timeline
- **THEN** the timeline and overlay are removed and the pending animation completion is settled so state synchronization does not remain blocked
