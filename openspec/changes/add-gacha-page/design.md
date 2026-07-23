## Context

The frontend already has Vue Router routes under src/router/index.js, page-level views under src/views, card rendering through src/components/game/ui/GameCard.vue, and card asset metadata in src/constants/cardAssets.js. The lobby menu already includes a recruit button in src/components/menu/LobbyMenu.vue using menu-btn positioning, icon-recruit.png, and the label shown to players as the recruit entry. The gacha feature is a new lobby feature page that uses existing bitmap assets and remains local-only for its first version.

## Goals / Non-Goals

**Goals:**

- Provide a /gacha page that displays the gacha background and printer artwork as a full-screen scene.
- Use the existing lobby recruit button as the entry point to /gacha without changing its visual layout.
- Support mouse and touch pulling on the printer to start a single draw interaction.
- Show a card-back print and flight sequence, then let the user reveal the CEO sample card.
- Keep the interaction responsive on mobile and desktop without horizontal overflow.

**Non-Goals:**

- No backend draw API request or response model.
- No player resource consumption or inventory persistence.
- No random result selection, card pool configuration, odds table, pity logic, or draw history.
- No changes to the reusable GameCard component contract.
- No redesign of the lobby menu, recruit button placement, recruit icon, or recruit label.

## Decisions

### Use the existing lobby recruit button as the gacha entry

The recruit button in LobbyMenu will keep its current menu-btn classes, icon-recruit.png image, label, and disabled binding. The only behavioral addition is navigation to the Gacha route when the button is enabled.

Alternative considered: Add a new gacha button to the lobby. This is rejected because the user selected the existing recruit button as the entry point and adding another button would change the lobby menu layout.

### Use a self-contained GachaView state machine

The page will own a small local state machine for idle, pulling, printing, flying, ready-to-reveal, and revealed states. This keeps the prototype isolated from game table state and avoids introducing shared stores before backend draw behavior exists.

Alternative considered: Add gacha state to Pinia. This is rejected for the first version because no cross-page state or persistence is required.

### Use Pointer Events for mouse and touch input

The printer interaction will use pointerdown, pointermove, pointerup, and pointercancel so desktop and mobile share the same drag logic. The drag only tracks downward movement from the initial pointer position and starts the draw only after release when the configured threshold has been reached.

Alternative considered: Separate mouse and touch handlers. This creates duplicated gesture logic and increases the chance of inconsistent thresholds.

### Reuse existing card rendering and CEO assets

The revealed card will use GameCard with cardAssetsByKey.ceo. The unrevealed and flying card will use card-bg-back.webp because existing game animations already treat that image as the card back.

Alternative considered: Create a separate card reveal component. This is unnecessary for the first version because GameCard already provides the card face composition.

### Keep animation local with reduced-motion fallback

The implementation can use GSAP because it is already a project dependency. Reduced-motion users will receive a shortened fade/position transition that still reaches the centered card-back state before reveal.

Alternative considered: CSS-only animations. CSS-only can work, but GSAP is already used for card motion and gives the implementer explicit control over cancellation and repeated runs.

## Implementation Contract

The delivered behavior is a frontend-only route named Gacha at /gacha. Opening the route displays a full-screen scene using bg-gacha.webp, a full-viewport-width printer image using gacha-printer.png anchored to the bottom edge, and a visible return-to-lobby button that routes to /lobby.

The lobby entry contract is: the existing recruit button in LobbyMenu remains visually the same button, including the provided menu-btn placement classes, icon-recruit.png image, recruit label, and disabled binding to isAnyPageTransitioning. When the button is enabled and activated, it navigates to /gacha. When isAnyPageTransitioning is true, the button remains disabled and does not navigate.

The printer drag contract is: pressing inside the printer interaction area starts tracking one active pointer; downward drag distance is clamped at zero minimum; the printer image itself remains fixed in place; three evenly spaced downward Chevron icons provide the visible pull affordance; releasing below the activation threshold restores idle state with no card; releasing at or above the threshold starts one draw sequence. Any pointer input during printing, flight, ready-to-reveal, or revealed state must not start another concurrent sequence.

The draw contract is: the sequence starts with a visible upright card back at the printer output area, moves that card downward out of the viewport without tilt, then moves it back to the center of the viewport while scaling up before exposing a keyboard-accessible centered card control. Activating that control by click, tap, Enter, or Space flips the card to the CEO face rendered by GameCard. The reveal control must not use a disabled button state that prevents click or keyboard events after the card reaches the ready-to-reveal state. The first version must always reveal CEO and must not perform network calls, resource deduction, or persistence writes.

Acceptance criteria are: npm run build succeeds; a focused source test confirms route registration, lobby recruit-button navigation to Gacha or /gacha, gacha assets, card back usage, GameCard usage, CEO asset usage, and absence of rounded- utility classes in the new gacha page; manual desktop and mobile checks confirm recruit button entry, pull threshold, no under-threshold draw, no concurrent draw, and card reveal.

Scope boundaries are: implementation is limited to the Gacha view, router registration, LobbyMenu recruit-button navigation, and a focused source test. Existing GameCard behavior, backend services, player stores, shop flows, and game table animation components are out of scope unless required only for imports.

## Risks / Trade-offs

- [Risk] The recruit button could accidentally lose its existing layout or disabled behavior while gaining navigation. -> Mitigation: add source-test assertions for the recruit button icon, label, disabled binding, and navigation target.
- [Risk] Printer output coordinates can vary by viewport and artwork dimensions. -> Mitigation: use DOM rects and viewport-relative positioning rather than fixed pixel-only flight endpoints.
- [Risk] Mobile browser gestures can interfere with pulling. -> Mitigation: set touch-action none on the printer interaction area and keep the page overflow hidden.
- [Risk] Repeated input can spawn duplicate animations. -> Mitigation: guard draw start by state and kill or ignore stale animation runs during reset.
