## ADDED Requirements

### Requirement: Round start notice

The game table SHALL display a FlyInTextModal round start notice when a round begins and the frontend has a round number value available.

#### Scenario: Initial round notice appears after initial deal

- **WHEN** the game table finishes the initial round deal animation for round number 1
- **THEN** the game table displays a FlyInTextModal notice that includes the number 1 and communicates that the round has started

#### Scenario: Later round notice appears before turn notice

- **WHEN** the game table detects a new round number after the round deal flow completes
- **THEN** the game table displays the round start notice before displaying the current-player turn notice

#### Scenario: Backend round counter is not introduced

- **WHEN** the frontend receives no incremented backend round counter beyond the existing roundNumber prop fallback
- **THEN** the game table uses the currently resolved frontend round number for the notice text without requesting a new backend field
