## ADDED Requirements

### Requirement: Hand interaction is guarded before draw

The game table SHALL treat the current player's hand as unavailable for play interaction while it is the current player's turn and the current player has not completed the required draw for that turn. During this guarded state, hand cards SHALL display the visible hover message "請先抽下一張牌" and MUST NOT start drag or play-card interaction from pointer input.

#### Scenario: Current player hovers hand before drawing

- **WHEN** it is the current player's turn and the player can still draw because the required draw has not been completed
- **THEN** the hovered hand card displays the visible message "請先抽下一張牌"
- **THEN** the hovered hand card does not use a native title tooltip for that message
- **THEN** the hovered hand card does not use the not-allowed cursor for this draw-required state

#### Scenario: Current player attempts to drag hand before drawing

- **WHEN** it is the current player's turn and the player presses a visible hand card before completing the required draw
- **THEN** the game table does not start a hand-card drag preview
- **THEN** the game table does not emit a play-card request for that hand card

#### Scenario: Current player completes draw before playing

- **WHEN** it is the current player's turn and the player has completed the required draw for that turn
- **THEN** hand cards do not display the visible hover message "請先抽下一張牌"
- **THEN** eligible hand cards can start the existing drag-to-play interaction

#### Scenario: Guard does not change server rule enforcement

- **WHEN** a client bypasses the frontend and submits a play-card request before drawing
- **THEN** this capability does not require new backend validation for that request
