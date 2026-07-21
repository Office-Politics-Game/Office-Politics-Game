## ADDED Requirements

### Requirement: Waiting-room slots follow backend seat order

The custom room frontend SHALL derive each of its four player slots from backend `players` and each player's `seatOrder`; local invitation or pending-operation state MUST NOT replace an occupied backend seat.

#### Scenario: Backend players occupy consecutive seats

- **WHEN** room state contains players with `seatOrder` values 1, 2, and 3
- **THEN** the frontend SHALL render those players in slots 1, 2, and 3 and SHALL recompute slot 4 as an empty slot from the current room status and host permissions

#### Scenario: Invitation is sent before a computer is added

- **WHEN** the host opens or sends an invitation for an empty slot and then adds a computer before the invitee joins
- **THEN** the invitation SHALL NOT reserve a slot and the next backend room state SHALL determine every occupied and empty slot

#### Scenario: Players are compacted after removal

- **WHEN** backend room state moves a player to a lower `seatOrder` after another member leaves or is removed
- **THEN** the frontend SHALL move that player to the matching slot and MUST NOT leave stale add-computer, invite-friend, or removal state in the vacated slot

#### Scenario: Pending computer conflicts with an occupied seat

- **WHEN** a pending computer indicator targets a slot that becomes occupied in a newer backend room state
- **THEN** the occupied backend player SHALL be rendered and the stale pending indicator SHALL be cleared
