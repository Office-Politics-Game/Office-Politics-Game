## MODIFIED Requirements

### Requirement: Sequential intern target and position selection

When an Intern card enters pending-play state, the game stage SHALL present target-player selection first and MUST NOT render the position-selection dialog before a valid target is selected. After the target is selected, the game stage SHALL stop target-selection mode and SHALL render the position-selection dialog for ranks 2 through 8. The common target-card flow SHALL govern the same target-first ordering for cards that require a player target without a guessed position.

#### Scenario: Intern waits for target selection

- **WHEN** an Intern card enters pending-play state and no target player has been selected
- **THEN** eligible player avatars are selectable, `請選擇玩家` is displayed, and the position-selection dialog is not rendered

#### Scenario: Target selection opens the position dialog

- **WHEN** the player selects an eligible target for a pending Intern card
- **THEN** target-selection mode stops and the position-selection dialog is rendered for choosing ranks 2 through 8
