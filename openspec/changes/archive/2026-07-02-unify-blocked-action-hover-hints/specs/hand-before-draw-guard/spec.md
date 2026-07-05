## MODIFIED Requirements

### Requirement: Hand interaction is guarded before draw

The game table SHALL treat the current player's hand as unavailable for play interaction while it is the current player's turn and the current player has not completed the required draw for that turn. During this guarded state, hand cards SHALL display the shared blocked-action hover hint with message "請先抽下一張牌" and MUST NOT start drag or play-card interaction from pointer input.

#### Scenario: Current player hovers hand before drawing

- **WHEN** it is the current player's turn and the player can still draw because the required draw has not been completed
- **THEN** the hovered hand card displays the shared blocked-action hover hint with message "請先抽下一張牌"
- **THEN** the hint closes immediately when the pointer leaves the hovered hand card
- **THEN** the hovered hand card does not use a native title tooltip for that message
- **THEN** the hovered hand card does not use the not-allowed cursor for this draw-required state

#### Scenario: Current player attempts to drag hand before drawing

- **WHEN** it is the current player's turn and the player presses a visible hand card before completing the required draw
- **THEN** the game table does not start a hand-card drag preview
- **THEN** the game table does not emit a play-card request for that hand card

#### Scenario: Current player completes draw before playing

- **WHEN** it is the current player's turn and the player has completed the required draw for that turn
- **THEN** hand cards do not display the blocked-action hover hint with message "請先抽下一張牌"
- **THEN** eligible hand cards can start the existing drag-to-play interaction

#### Scenario: Guard does not change server rule enforcement

- **WHEN** a client bypasses the frontend and submits a play-card request before drawing
- **THEN** this capability does not require new backend validation for that request

## ADDED Requirements

### Requirement: Deck interaction is guarded outside the player's turn

The game table SHALL treat the deck as unavailable for draw interaction when the viewer is not the current turn player. During this guarded state, the deck SHALL display the shared blocked-action hover hint with message "還沒輪到你" and MUST NOT emit a draw request.

#### Scenario: Non-turn player hovers deck

- **WHEN** the viewer is not the current turn player
- **THEN** hovering the deck displays the shared blocked-action hover hint with message "還沒輪到你"
- **THEN** the hint closes immediately when the pointer leaves the deck
- **THEN** the deck does not use a native title tooltip for that message
- **THEN** the deck does not use a modal dialog for that message

#### Scenario: Non-turn player attempts to draw

- **WHEN** the viewer is not the current turn player and presses the deck
- **THEN** the game table does not emit a draw request

### Requirement: Blocked-action hover hint is shared and minimal

Blocked hand and deck interactions SHALL use the same reusable hover hint presentation. The shared hint SHALL be hidden by default, SHALL be visible only while hovering its blocked target, and SHALL use minimal styling: dark background, white text, small padding, and no glow, backdrop, animation, or modal container.

#### Scenario: Shared hint style is used by blocked targets

- **WHEN** a blocked hand card or blocked deck target is hovered
- **THEN** the target displays the same reusable hover hint component
- **THEN** the hint uses minimal dark-background and white-text styling
- **THEN** the hint is hidden again immediately after the pointer leaves the target
