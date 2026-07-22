## ADDED Requirements

### Requirement: Stable top-level route component identity

The application SHALL derive the top-level RouterView component key from the first matched route record so that navigation between child routes of the same top-level route preserves the parent component instance. If the matched record has no name, the application SHALL use the matched record path; if no matched record exists, it SHALL fall back to the current route name and then the current route path. The key MUST NOT use the full path.

#### Scenario: Navigate from Lobby home to game menu

- **WHEN** the current route changes from `/lobby` with route name `LobbyHome` to `/lobby/game-menu` with route name `LobbyGameMenu`
- **THEN** the top-level RouterView key remains the identity of the `Lobby` matched route
- **AND** the existing Lobby component instance remains mounted

#### Scenario: Navigate between different top-level routes

- **WHEN** navigation changes from the `Lobby` top-level matched route to a different top-level matched route
- **THEN** the RouterView key changes to the destination top-level route identity

#### Scenario: Matched route identity is incomplete

- **WHEN** the first matched route has no name
- **THEN** the application uses that matched route path as the key
- **AND WHEN** no matched route exists
- **THEN** the application uses the current route name or current route path without throwing an error

### Requirement: Bidirectional Lobby flip transition

The Lobby SHALL use the preserved parent component instance to transition the shared flip card between its front and back faces according to the active Lobby child route. The transition SHALL remain 700 milliseconds in both directions.

#### Scenario: Start playing from Lobby home

- **WHEN** the user activates the start-playing action on `LobbyHome`
- **THEN** navigation targets `LobbyGameMenu`
- **AND** the preserved Lobby flip card transitions from the front face to the back face over 700 milliseconds

#### Scenario: Return from the game menu

- **WHEN** the user activates the return action on `LobbyGameMenu`
- **THEN** navigation targets `LobbyHome`
- **AND** the preserved Lobby flip card transitions from the back face to the front face over 700 milliseconds

#### Scenario: Reduced motion is enabled

- **WHEN** the system reports `prefers-reduced-motion: reduce`
- **THEN** the Lobby still switches between the front and back faces
- **AND** the flip card transition duration is disabled by the existing reduced-motion rule

### Requirement: Existing result page transition remains supported

The application SHALL continue selecting the `result-page-slide` transition when the destination route query contains `transition=game-end`.

#### Scenario: Navigate to the result page after a game

- **WHEN** a route is rendered with query parameter `transition` equal to `game-end`
- **THEN** the top-level Transition uses the `result-page-slide` name
- **AND** the stable RouterView key does not remove or replace that transition selection
