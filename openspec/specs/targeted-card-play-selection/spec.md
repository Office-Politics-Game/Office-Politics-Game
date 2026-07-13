# targeted-card-play-selection Specification

## Purpose

Define a consistent target-first card-play flow so cards that require a player target do not show their confirmation modal until an eligible player has been selected.

## Requirements

### Requirement: Target selection precedes the card confirmation modal

When a pending card has `targetMode` set to `opponent` or `anyPlayer`, the game stage SHALL enter player-target selection before rendering the card confirmation modal. While no valid target is selected, the game stage SHALL display `請選擇玩家`, SHALL keep eligible player seats selectable, and MUST NOT render the confirmation modal. After a valid target is selected, target-selection mode SHALL stop and the confirmation modal SHALL render with the selected player as its target.

#### Scenario: Opponent-target card waits for player selection

- **WHEN** Manager, HR, or Cleaner enters pending-play state without a selected target
- **THEN** the game stage displays `請選擇玩家`, enables eligible opponent seats, and does not render the confirmation modal

#### Scenario: Any-player card waits for player selection

- **WHEN** PM enters pending-play state without a selected target
- **THEN** the game stage displays `請選擇玩家`, enables every eligible player seat including the current player, and does not render the confirmation modal

#### Scenario: Valid target opens the confirmation modal

- **WHEN** the player selects an eligible target for a pending Manager, HR, PM, or Cleaner card
- **THEN** target-selection mode stops and the confirmation modal renders with the selected player's name

#### Scenario: Invalid target does not advance the flow

- **WHEN** a player identifier outside the pending card's eligible target set is submitted during target selection
- **THEN** the game stage retains target-selection mode and does not render the confirmation modal

### Requirement: Cards without player targets retain their play flow

When a pending card has `targetMode` set to `none`, the game stage MUST retain its existing immediate play or choice behavior and SHALL NOT require player-target selection.

#### Scenario: Non-target card is played

- **WHEN** Senior, Advisor, or CEO is played legally
- **THEN** the game stage does not display `請選擇玩家` and does not wait for a player target
