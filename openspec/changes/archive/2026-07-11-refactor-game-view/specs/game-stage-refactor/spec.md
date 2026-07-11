## ADDED Requirements

### Requirement: Game view responsibilities remain modular

The game route view SHALL remain a thin coordination layer while focused composables own derived presentation data, room-state synchronization, and socket-action orchestration. The refactor MUST preserve the existing `GameStage` integration contract and player-visible behavior.

#### Scenario: Game view composes focused responsibilities

- **WHEN** the game route view initializes after the refactor
- **THEN** derived player and card presentation state is provided by a view-model composable
- **THEN** initial loading, room metadata, and Pinia state synchronization are provided by a room-state composable
- **THEN** socket subscriptions, ordered action animations, deferred state application, and HTTP fallbacks are provided by a socket-action composable
- **THEN** the route view retains only composable assembly, lifecycle coordination, and template bindings

#### Scenario: Relative player presentation remains equivalent

- **WHEN** a four-player game state is transformed for the current viewer
- **THEN** the viewer remains in the bottom position
- **THEN** the other players retain the same top, left, and right relative ordering
- **THEN** hand cards, discard cards, deck count, public hand counts, turn status, and draw eligibility match the pre-refactor output

#### Scenario: Socket action ordering remains equivalent

- **WHEN** socket game actions and their associated state updates arrive during animation
- **THEN** actions are deduplicated and animated sequentially in arrival order
- **THEN** a state update carrying `afterActionId` is applied only after the matching action completes
- **THEN** acknowledged draw and play states are applied immediately
- **THEN** the ready-for-computer-turn acknowledgement is sent only after pending actions and notices are idle

#### Scenario: Socket failure retains HTTP fallback

- **WHEN** a draw-card or play-card Socket acknowledgement fails
- **THEN** the corresponding HTTP action fallback is attempted
- **THEN** recoverable animation failures do not prevent the room state from being refreshed
- **THEN** listener cleanup removes both `game:action` and `game:state` handlers when the route view is destroyed or resubscribed
