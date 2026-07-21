## MODIFIED Requirements

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

### Requirement: Tutorial fails safely when UI targets are unavailable

The game SHALL resolve tutorial targets through component-owned element interfaces and SHALL NOT start Intro.js until the draw pile, hand, discard, settings button, and rules sidebar trigger targets are valid HTML elements and the opponents target contains exactly three valid HTML elements. The settings-button component SHALL expose its owned button element, and the rules-sidebar component SHALL expose its owned trigger-button element. The game MUST dispose the active tutorial and remove all temporary opponent-highlight classes when the game table unmounts.

#### Scenario: A required target is initially unavailable

- **WHEN** any draw pile, hand, discard pile, settings button, rules sidebar trigger, or one of the three opponent-seat targets is unavailable
- **THEN** the game SHALL keep the tutorial unstarted without blocking game rendering or interaction
- **THEN** the game SHALL permit another eligibility evaluation in the same mount after the target becomes available

#### Scenario: Game table unmounts during tutorial

- **WHEN** the active game table unmounts or the player leaves /game
- **THEN** the game SHALL dispose the active Intro.js instance without throwing an error

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
