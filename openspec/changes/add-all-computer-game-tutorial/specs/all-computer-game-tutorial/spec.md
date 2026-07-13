## ADDED Requirements

### Requirement: Tutorial eligibility for an all-computer-opponent game

The /game table SHALL start the gameplay tutorial only when the current player exists, the current player is not a computer player, at least one other player exists, and every other player is a computer player.

#### Scenario: Human player faces only computer opponents

- **WHEN** the current human player enters /game with one or more other players and every other player has isComputer equal to true
- **THEN** the game SHALL start the tutorial after all required tutorial targets are available

#### Scenario: A human opponent is present

- **WHEN** at least one player other than the current human player has isComputer equal to false
- **THEN** the game SHALL NOT start the tutorial

#### Scenario: Current player is not eligible

- **WHEN** the current player is missing, is a computer player, or has no opponents
- **THEN** the game SHALL NOT start the tutorial

### Requirement: Tutorial starts once per game-page visit

The game SHALL start at most one tutorial instance during a single mounted /game table visit, and SHALL allow a new tutorial to start after the player leaves and re-enters /game.

#### Scenario: Game state updates after tutorial start

- **WHEN** the tutorial has started and subsequent socket or turn updates change the player or game state
- **THEN** the mounted game table SHALL NOT start another tutorial instance

#### Scenario: Player re-enters the game route

- **WHEN** an eligible human player leaves /game and later enters /game again
- **THEN** the newly mounted game table SHALL start a new tutorial after its targets become available

### Requirement: Tutorial follows the gameplay-area sequence

The tutorial SHALL present exactly four steps in this order: draw pile, current player's hand, discard pile, and other player positions. The first three steps SHALL anchor to one target element, and the fourth step SHALL simultaneously highlight exactly three opponent seat elements while the rest of the game table remains under the dark overlay.

#### Scenario: Eligible tutorial runs

- **WHEN** the tutorial starts
- **THEN** step 1 SHALL target the draw pile
- **THEN** step 2 SHALL target the current player's hand area
- **THEN** step 3 SHALL target the discard pile
- **THEN** step 4 SHALL use a floating tooltip and simultaneously highlight the three opponent seats
- **THEN** step 4 SHALL keep the current player's seat and the remaining table under the dark overlay

### Requirement: Tutorial explains elimination and match victory

The other-player step SHALL explain that the player pursues round victory by eliminating the other surviving players and wins the match by becoming the first player to accumulate 3 round wins.

#### Scenario: User views the other-player step

- **WHEN** the tutorial reaches the other-player seat layout
- **THEN** the displayed Traditional Chinese content SHALL state the elimination objective and the 3-round-win match condition

### Requirement: Tutorial fails safely when UI targets are unavailable

The game SHALL resolve tutorial targets through component-owned element interfaces and SHALL NOT start Intro.js until the draw pile, hand, and discard targets are valid HTML elements and the opponents target contains exactly three valid HTML elements. The game MUST dispose the active tutorial and remove all temporary opponent-highlight classes when the game table unmounts.

#### Scenario: A required target is initially unavailable

- **WHEN** any draw pile, hand, discard pile, or one of the three opponent-seat targets is unavailable
- **THEN** the game SHALL keep the tutorial unstarted without blocking game rendering or interaction
- **THEN** the game SHALL permit another eligibility evaluation in the same mount after the target becomes available

#### Scenario: Game table unmounts during tutorial

- **WHEN** the active game table unmounts or the player leaves /game
- **THEN** the game SHALL dispose the active Intro.js instance without throwing an error

### Requirement: Tutorial presentation follows Square UI and responsive rules

The tutorial tooltip and controls SHALL use square corners, project brand-derived colors, accessible interaction states, and fixed pixel dimensions for exactly two landscape breakpoints: below 1024px and at least 1024px. The skip label SHALL remain on one horizontal line and SHALL use the same font size as the tooltip title. The overlay SHALL use opacity 0.72, and visible target regions SHALL use a blue border and blue glow. The tutorial SHALL NOT scroll the game viewport to reveal an entire target.

#### Scenario: Tutorial is displayed at a supported landscape breakpoint

- **WHEN** the tutorial is displayed in landscape below 1024px or at least 1024px
- **THEN** the tooltip and controls SHALL use the fixed dimensions assigned to that breakpoint without page overflow
- **THEN** tutorial controls SHALL expose default, hover, active, focus-visible, and disabled visual states
- **THEN** the Traditional Chinese skip label SHALL remain horizontal on one line
- **THEN** the skip label font size SHALL equal the tooltip title font size for the active breakpoint

#### Scenario: Hand target extends outside the viewport

- **WHEN** the current player's hand and its tutorial target are partially outside the landscape viewport
- **THEN** the tutorial SHALL NOT scroll or reposition the game viewport to reveal the hidden portion
- **THEN** the hand and highlight SHALL preserve their original position

#### Scenario: Tutorial uses compact landscape placement

- **WHEN** the tutorial starts in a landscape viewport below 1024px
- **THEN** the draw-pile tooltip SHALL appear to the right of its target
- **THEN** the hand tooltip SHALL retain automatic placement
- **THEN** the discard-pile tooltip SHALL appear to the left of its target
- **THEN** compact mode SHALL keep automatic tooltip positioning enabled for the hand step
- **THEN** compact mode SHALL disable automatic tooltip positioning only while entering the discard-pile step and SHALL restore it when leaving that step
- **THEN** the opponent tooltip SHALL use a fixed offset into the lower half of the viewport instead of remaining centered
- **THEN** tooltip padding, control gap, and helper padding SHALL use the compact fixed values

#### Scenario: A tutorial target is highlighted

- **WHEN** the tutorial displays any gameplay-area step
- **THEN** non-target content SHALL remain behind an overlay with opacity 0.72
- **THEN** every visible target SHALL have a blue border and blue glow
