## ADDED Requirements

### Requirement: Hand card gestures distinguish inspection from play

The game stage SHALL treat a pointer gesture that moves no more than 6 pixels as an inspection click and SHALL start dragging only after the movement exceeds 6 pixels. A card SHALL be played only when an active drag is released inside the existing play zone.

#### Scenario: Short click opens inspection without playing

- **WHEN** the player presses and releases a hand card without moving more than 6 pixels
- **THEN** the card is displayed in the centered inspection overlay
- **THEN** no card-play animation runs and no play-card event is emitted

#### Scenario: Drag release inside the play zone plays the card

- **WHEN** a playable card moves more than 6 pixels and is released inside the play zone
- **THEN** the existing card-play animation and choice flow run
- **THEN** the existing play-card payload remains unchanged

#### Scenario: Drag release outside the play zone does not play

- **WHEN** a dragged hand card is released outside the play zone
- **THEN** the card returns to the hand without running the card-play flow

### Requirement: Centered card inspection is dismissible and draggable

The game stage SHALL display one inspected card at viewport center and SHALL close it when the card is clicked again, the backdrop is clicked, or Escape is pressed. A playable inspected card SHALL be draggable through the same play-zone contract as a hand card.

#### Scenario: Inspection is dismissed

- **WHEN** an inspected card is clicked without exceeding the drag threshold, its backdrop is clicked, or Escape is pressed
- **THEN** the inspection overlay closes and the card remains in the hand

#### Scenario: Inspected card drag misses the play zone

- **WHEN** an inspected card is dragged and released outside the play zone
- **THEN** the card returns to centered inspection and is not played

#### Scenario: Inspected card drag reaches the play zone

- **WHEN** an inspected playable card is dragged and released inside the play zone
- **THEN** the inspection closes and the existing card-play flow runs

### Requirement: Inspection remains available when play is blocked

The game stage SHALL allow a hand card to be inspected while play is blocked by turn state, draw requirements, animation state, or card rules, but MUST NOT start a drag or emit play-card in those states.

#### Scenario: Blocked card can be read but not played

- **WHEN** the player clicks a card while play is blocked
- **THEN** the centered inspection opens
- **WHEN** the player attempts to drag that inspected card
- **THEN** no drag preview or card-play flow starts

### Requirement: Inspected card provides layered pointer depth

The centered inspection SHALL derive normalized pointer coordinates relative to the card center, expose them as `--pointer-x` and `--pointer-y`, and render the background and frame at different depth offsets. Reduced-motion mode MUST disable live tilt and parallax.

#### Scenario: Pointer movement updates two visual layers

- **WHEN** the pointer moves across an inspected card and reduced motion is not requested
- **THEN** the card tilt and normalized pointer CSS variables update
- **THEN** the background and frame use distinct transforms to create layered offset

#### Scenario: Reduced motion disables live parallax

- **WHEN** the user requests reduced motion
- **THEN** inspection and dismissal remain available
- **THEN** pointer tilt and parallax remain neutral

### Requirement: Hand cards use enlarged interaction cursors

The hand SHALL use 32 by 32 pixel custom pointer, grab, and grabbing cursors for inspect-only, draggable, and pressed states respectively, with matching native cursor fallbacks. The card itself MUST NOT scale as part of this cursor change.

#### Scenario: Hand interaction uses the matching enlarged cursor

- **WHEN** the player must draw before playing and moves the cursor over a hand card
- **THEN** the card uses the 32 by 32 pixel custom pointer cursor
- **WHEN** the card is draggable or pressed
- **THEN** it uses the 32 by 32 pixel custom grab or grabbing cursor respectively
- **THEN** the card dimensions and transform remain unchanged
