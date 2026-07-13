## ADDED Requirements

### Requirement: Gacha route is available

The frontend SHALL expose a /gacha route as a lobby feature page. The route SHALL render the gacha scene without requiring backend draw data. The printer foreground SHALL span the full viewport width while remaining anchored to the bottom edge of the screen.

#### Scenario: User opens the gacha route

- **WHEN** a user navigates to /gacha
- **THEN** the frontend displays the gacha page scene with the gacha background, full-width printer foreground, and a return-to-lobby control

#### Scenario: User returns to lobby

- **WHEN** a user activates the return-to-lobby control on the gacha page
- **THEN** the frontend navigates to /lobby

### Requirement: Lobby recruit button opens gacha

The lobby menu SHALL use its existing recruit button as the entry point to the gacha page. The button SHALL preserve the current menu-btn placement classes, icon-recruit.png image, recruit label, and isAnyPageTransitioning disabled behavior while adding navigation to /gacha.

#### Scenario: User activates the recruit button

- **WHEN** a user activates the lobby menu recruit button while it is enabled
- **THEN** the frontend navigates to /gacha

#### Scenario: Recruit button is disabled during page transition

- **WHEN** isAnyPageTransitioning is true
- **THEN** the lobby menu recruit button remains disabled and does not navigate to /gacha

### Requirement: Printer pull starts one draw interaction

The gacha page SHALL support mouse and touch pointer input on the printer area. Pulling downward past the activation threshold SHALL start exactly one draw interaction while a draw is not already running. The printer image SHALL remain fixed in place during the pull, and the pull affordance SHALL be shown with three evenly spaced downward chevrons.

#### Scenario: Pull passes the activation threshold

- **WHEN** the user presses on the printer area, drags downward by at least the configured activation threshold, and releases
- **THEN** the page starts the draw interaction once

#### Scenario: Pull does not pass the activation threshold

- **WHEN** the user presses on the printer area, drags downward less than the configured activation threshold, and releases
- **THEN** the page returns the printer pull indicator to idle and does not create a card

#### Scenario: Draw is already active

- **WHEN** the user attempts another printer pull while the card is printing, flying, waiting for reveal, or revealed
- **THEN** the page does not start an additional concurrent draw interaction

### Requirement: Draw animation reveals a sample CEO card

The gacha page SHALL use the existing card back asset while printing and flying. The flying card SHALL remain upright without tilt. The draw animation SHALL move the card downward out of the viewport before moving it back to the center while scaling it up. After the card reaches the center of the screen, the page SHALL wait for user activation before flipping the card to the CEO face using the existing GameCard component and CEO card assets.

#### Scenario: Card back flies to center

- **WHEN** the draw interaction starts
- **THEN** a card back appears from the printer output area, flies downward out of the viewport, then scales up while moving to the center of the viewport

#### Scenario: User reveals the centered card

- **WHEN** the card back has reached the center and the user clicks, taps, presses Enter, or presses Space on the card
- **THEN** the card flips to show the CEO sample card face

#### Scenario: Reduced motion is preferred

- **WHEN** the user has reduced motion enabled and starts the draw interaction
- **THEN** the page uses a reduced-motion transition that still reaches the centered card-back state and allows the CEO reveal

### Requirement: First version remains local-only

The first gacha page version SHALL NOT call a backend draw API, consume player resources, or persist card ownership. The page SHALL always use the CEO sample card as the draw result.

#### Scenario: Draw result is local sample data

- **WHEN** a user completes the draw and reveals the card
- **THEN** the revealed card is the CEO sample card and no network draw request is required
