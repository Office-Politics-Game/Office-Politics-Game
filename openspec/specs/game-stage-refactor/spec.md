# game-stage-refactor Specification

## Purpose

TBD - created by archiving change 'refactor-game-stage'. Update Purpose after archive.

## Requirements

### Requirement: Game stage refactor preserves runtime contract

The game stage SHALL preserve its public integration contract and player-visible behavior while moving internal responsibilities into focused modules.

#### Scenario: GameView integration remains stable

- **WHEN** `GameView.vue` renders the game stage after the refactor
- **THEN** the game stage accepts the same props and emits the same events as before the refactor
- **THEN** the game stage exposes `playDrawAnimation`, `playEffectAnimation`, `playRemoteCardPlayAnimation`, and `waitForNoticeIdle` with the same call shapes as before the refactor

#### Scenario: Animation and notice timing remains equivalent

- **WHEN** draw, initial round deal, remote card play, effect animation, round start notice, turn notice, winner notice, or eliminated notice flows run after the refactor
- **THEN** missing animation rectangles settle without throwing
- **THEN** pending notices and post-close ACK buffers continue to block `waitForNoticeIdle` until the same idle conditions are met

#### Scenario: Card play interaction remains equivalent

- **WHEN** the current player drags a playable hand card to the play zone after the refactor
- **THEN** the card play animation, pending target selection, pending guess selection, confirm action, cancel action, local hidden played-card behavior, and emitted play-card payload match the pre-refactor behavior
- **THEN** blocked hand states and advisor-rule disabled cards still prevent the pointer interaction from starting
