# all-computer-game-tutorial Specification

## Purpose

TBD - created by archiving change 'add-all-computer-game-tutorial'. Update Purpose after archive.

## Requirements

### Requirement: Tutorial eligibility for an all-computer-opponent game

The /game table SHALL start the gameplay tutorial only when the game contains exactly one human player and three computer players, the current player is that human player, and the current game session has not completed a successful card play.

#### Scenario: Human player faces only computer opponents

- **WHEN** the current human player enters /game with exactly three other players, every other player has isComputer equal to true, and hasAnyCardBeenPlayed is false or absent
- **THEN** the game SHALL start the tutorial after all required tutorial targets are available

#### Scenario: A human opponent is present

- **WHEN** at least one player other than the current human player has isComputer equal to false
- **THEN** the game SHALL NOT start the tutorial

#### Scenario: Current player is not eligible

- **WHEN** the current player is missing, is a computer player, the game does not contain exactly three opponents, or hasAnyCardBeenPlayed is true
- **THEN** the game SHALL NOT start the tutorial

---
### Requirement: Tutorial starts once per game-page visit

The game SHALL start at most one tutorial instance during a single mounted /game table visit. The game SHALL allow a new tutorial after route re-entry only while the current game session has not completed a successful card play.

#### Scenario: Game state updates after tutorial start

- **WHEN** the tutorial has started and subsequent socket or turn updates change the player or game state
- **THEN** the mounted game table SHALL NOT start another tutorial instance

#### Scenario: Player re-enters the game route

- **WHEN** an eligible human player leaves /game and later enters /game before any successful card play
- **THEN** the newly mounted game table SHALL start a new tutorial after its targets become available

#### Scenario: Player re-enters after the first successful card play

- **WHEN** the human player leaves and re-enters /game after hasAnyCardBeenPlayed became true
- **THEN** the newly mounted game table SHALL NOT start a tutorial

---
### Requirement: Human player starts the first all-computer round

When a game session starts with exactly one human player and three computer players, the game SHALL assign the human player as currentTurnPlayerId for the first round. Later rounds SHALL retain the existing random starting-player behavior.

#### Scenario: Initial all-computer-opponent round starts

- **WHEN** an initial game state is created for exactly one human player and three computer players
- **THEN** currentTurnPlayerId SHALL equal the human player's playerId

#### Scenario: A later round starts

- **WHEN** the same game session starts a round after the first round
- **THEN** the game SHALL select the starting player using the existing random selection behavior

#### Scenario: Initial player composition is not the tutorial composition

- **WHEN** an initial game state is created without exactly one human player and three computer players
- **THEN** the game SHALL retain the existing random starting-player behavior

---
### Requirement: Successful card play permanently suppresses the session tutorial

The game session state SHALL initialize hasAnyCardBeenPlayed to false, SHALL set it to true only after a card is successfully discarded by playCardAction, SHALL expose it in the public game state, and SHALL preserve the true value across later rounds. A missing value in an older state SHALL be exposed as false.

#### Scenario: Session has not played a card

- **WHEN** a new game session is created or an older state has no hasAnyCardBeenPlayed value
- **THEN** the public game state SHALL expose hasAnyCardBeenPlayed as false

#### Scenario: First card play succeeds

- **WHEN** playCardAction successfully discards a card
- **THEN** the persisted and public game state SHALL set hasAnyCardBeenPlayed to true

#### Scenario: Card play fails validation

- **WHEN** playCardAction fails before successfully discarding a card
- **THEN** hasAnyCardBeenPlayed SHALL remain unchanged

#### Scenario: Later round begins after a card was played

- **WHEN** a later round resets the deck, hands, and discard pile after hasAnyCardBeenPlayed became true
- **THEN** hasAnyCardBeenPlayed SHALL remain true

---
### Requirement: First-round notice waits for tutorial settlement

The existing first-round start notice SHALL wait until the eligible tutorial completes, is skipped, is closed, is disposed, or determines that it cannot start. When the initial deal sequence begins waiting, the tutorial SHALL either already be active or starting, or SHALL finalize the current mount as skipped and prevent a later tutorial from starting after the notice. The game SHALL NOT add a separate game-start notice.

#### Scenario: Eligible tutorial is active

- **WHEN** the initial deal sequence reaches the first-round notice while the tutorial is active or starting
- **THEN** the first-round notice SHALL remain closed until the tutorial settles

#### Scenario: Tutorial completes or exits

- **WHEN** the user completes, skips, or closes the tutorial
- **THEN** the existing first-round notice SHALL become eligible to play before the current-player turn notice

#### Scenario: Tutorial is ineligible or cannot start

- **WHEN** the initial deal sequence requests tutorial settlement while the tutorial is suppressed by session state, lacks valid targets, fails to start, or is disposed during unmount
- **THEN** tutorial settlement SHALL resolve without indefinitely blocking the notice sequence
- **THEN** the same mounted game table SHALL NOT start a tutorial after the first-round notice becomes eligible to play

---
### Requirement: Tutorial follows the gameplay-area sequence

The tutorial SHALL present exactly six steps in this order: draw pile, current player's hand, discard pile, other player positions, settings button, and rules sidebar trigger. The draw-pile, hand, discard-pile, settings-button, and rules-sidebar steps SHALL each anchor to one target element. The fourth step SHALL simultaneously highlight exactly three opponent seat elements while the rest of the game table remains under the dark overlay. The settings and rules steps SHALL explain their available actions without automatically opening either interface.

#### Scenario: Eligible tutorial runs

- **WHEN** the tutorial starts
- **THEN** step 1 SHALL target the draw pile
- **THEN** step 2 SHALL target the current player's hand area
- **THEN** step 3 SHALL target the discard pile
- **THEN** step 4 SHALL use a floating tooltip and simultaneously highlight the three opponent seats
- **THEN** step 4 SHALL keep the current player's seat and the remaining table under the dark overlay
- **THEN** step 5 SHALL target the settings button with title "設定按鍵" and text "調整音效與配樂，或投降離開遊戲。"
- **THEN** step 6 SHALL target the rules sidebar trigger with title "規則側邊欄" and text "隨時查看遊戲規則。"
- **THEN** the tutorial SHALL NOT automatically open the settings modal or rules sidebar

---
### Requirement: Tutorial explains elimination and match victory

The other-player step SHALL explain that the player pursues round victory by eliminating the other surviving players and wins the match by becoming the first player to accumulate 3 round wins.

#### Scenario: User views the other-player step

- **WHEN** the tutorial reaches the other-player seat layout
- **THEN** the displayed Traditional Chinese content SHALL state the elimination objective and the 3-round-win match condition

---
### Requirement: Tutorial fails safely when UI targets are unavailable

The game SHALL resolve tutorial targets through component-owned element interfaces and SHALL NOT start Intro.js until the draw pile, hand, discard, settings button, and rules sidebar trigger targets are valid HTML elements and the opponents target contains exactly three valid HTML elements. The settings-button component SHALL expose its owned button element, and the rules-sidebar component SHALL expose its owned trigger-button element. The game MUST dispose the active tutorial and remove all temporary opponent-highlight classes when the game table unmounts.

#### Scenario: A required target is initially unavailable

- **WHEN** any draw pile, hand, discard pile, settings button, rules sidebar trigger, or one of the three opponent-seat targets is unavailable
- **THEN** the game SHALL keep the tutorial unstarted without blocking game rendering or interaction
- **THEN** the game SHALL permit another eligibility evaluation in the same mount after the target becomes available

#### Scenario: Game table unmounts during tutorial

- **WHEN** the active game table unmounts or the player leaves /game
- **THEN** the game SHALL dispose the active Intro.js instance without throwing an error

---
### Requirement: Tutorial presentation follows Square UI and responsive rules

The tutorial tooltip and controls SHALL use square corners, project brand-derived colors, accessible interaction states, and fixed pixel dimensions for exactly two landscape breakpoints: below 1024px and at least 1024px. Below 1024px, the tooltip title SHALL use 14px text, while the skip label, tooltip body, and navigation buttons SHALL use 12px text. At least 1024px, the tooltip title and skip label SHALL use 22px text, the tooltip body SHALL use 18px text, and the navigation buttons SHALL use 15px text. The approved 12px compact skip-label and navigation-button text is a tutorial-specific exception to the general Square UI compact button guidance and to the prior rule that the skip label always matches the tooltip title size. The skip label SHALL remain on one horizontal line at both breakpoints and SHALL use the same font size as the tooltip title only at the at-least-1024px breakpoint. The overlay SHALL use opacity 0.72, and visible target regions SHALL use a blue border and blue glow. The tutorial SHALL NOT scroll the game viewport to reveal an entire target.

#### Scenario: Tutorial is displayed below 1024px

- **WHEN** the tutorial is displayed in a supported landscape viewport below 1024px
- **THEN** the tooltip title SHALL use 14px text
- **THEN** the skip label SHALL use 12px text
- **THEN** the tooltip body SHALL use 12px text
- **THEN** the previous, next, and done navigation buttons SHALL use 12px text
- **THEN** the tooltip and controls SHALL use the compact fixed dimensions without page overflow
- **THEN** tutorial controls SHALL expose default, hover, active, focus-visible, and disabled visual states
- **THEN** the Traditional Chinese skip label SHALL remain horizontal on one line

#### Scenario: Tutorial is displayed at least 1024px

- **WHEN** the tutorial is displayed in a supported landscape viewport at least 1024px wide
- **THEN** the tooltip title and skip label SHALL use 22px text
- **THEN** the tooltip body SHALL use 18px text
- **THEN** the previous, next, and done navigation buttons SHALL use 15px text
- **THEN** the existing standard-landscape dimensions and presentation SHALL remain unchanged

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
- **THEN** the opponent tooltip SHALL clear the default Intro.js margin, be fixed 10px above the viewport bottom, and remain horizontally centered
- **THEN** the opponent tooltip SHALL NOT use a downward 120px translation or extend below the viewport
- **THEN** tooltip padding, control gap, and helper padding SHALL use the compact fixed values

#### Scenario: A tutorial target is highlighted

- **WHEN** the tutorial displays any gameplay-area step
- **THEN** non-target content SHALL remain behind an overlay with opacity 0.72
- **THEN** every visible target SHALL have exactly one 2px blue solid border and a blue glow
- **THEN** the target highlight SHALL NOT add a second 2px blue-gray solid outer ring
- **THEN** each of the three opponent-seat highlights SHALL have exactly one 2px blue outline offset 2px inward and a blue glow with a matching 2px spread outside it
- **THEN** the opponent-seat glow SHALL retain a 30px blur radius
- **THEN** the opponent-seat highlights SHALL NOT add a 4px blue-gray outer ring
