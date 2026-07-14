## MODIFIED Requirements

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
