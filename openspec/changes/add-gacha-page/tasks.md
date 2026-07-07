## 1. Route and lobby entry

- [x] 1.1 Deliver Gacha route is available by registering the /gacha route with name Gacha and rendering src/views/GachaView.vue; verify with tests/gacha-view.test.mjs checking router registration and with npm run build.
- [x] 1.2 Implement Use the existing lobby recruit button as the gacha entry by adding enabled-state navigation from the recruit button in src/components/menu/LobbyMenu.vue to /gacha while preserving its menu-btn placement classes, icon-recruit.png image, recruit label, and isAnyPageTransitioning disabled binding; verify with tests/gacha-view.test.mjs checking the recruit button target and with a manual click from the lobby menu.
- [x] 1.3 Build the full-screen gacha scene in src/views/GachaView.vue using bg-gacha.webp as the background, gacha-printer.webp as the anchored printer foreground, and a return-to-lobby control that routes to /lobby; verify manually by opening /gacha and activating the return control.
- [x] 1.4 Keep the scene responsive and Square UI compliant with no rounded- utility classes, no horizontal overflow, and keyboard-visible focus on controls; verify with tests/gacha-view.test.mjs source assertions and a manual mobile viewport check.

## 2. Printer interaction state

- [x] 2.1 Implement Use a self-contained GachaView state machine for idle, pulling, printing, flying, ready-to-reveal, and revealed states so duplicate draw runs cannot overlap; verify manually that a second pull during active or revealed states does not create another card.
- [x] 2.2 Implement Use Pointer Events for mouse and touch input on the printer area so Printer pull starts one draw interaction only after release past the downward threshold; verify manually with one mouse drag and one touch-size viewport drag.
- [x] 2.3 Ensure an under-threshold printer pull restores idle state and does not create a card; verify manually by dragging less than the threshold and confirming no card appears.

## 3. Card animation and reveal

- [x] 3.1 Implement Draw animation reveals a sample CEO card by showing card-bg-back.webp at the printer output area, animating the card back to the center, and waiting in ready-to-reveal state; verify with a manual draw and tests/gacha-view.test.mjs checking card back asset usage.
- [x] 3.2 Implement Reuse existing card rendering and CEO assets by rendering the revealed card with GameCard and cardAssetsByKey.ceo; verify with tests/gacha-view.test.mjs checking GameCard and cardAssetsByKey.ceo usage.
- [x] 3.3 Implement click, tap, Enter, and Space activation on the centered card so it flips from card back to CEO face; verify manually with pointer activation and keyboard activation.
- [x] 3.4 Implement Keep animation local with reduced-motion fallback so reduced-motion users still reach the centered card-back state and can reveal the CEO card; verify by inspecting the prefers-reduced-motion branch and manually testing with reduced motion enabled when available.

## 4. Local-only scope and verification

- [x] 4.1 Preserve First version remains local-only by avoiding backend draw API calls, resource consumption, store writes, and inventory persistence; verify with source review of src/views/GachaView.vue and tests/gacha-view.test.mjs asserting no draw API import.
- [x] 4.2 Add tests/gacha-view.test.mjs to assert route registration, Lobby recruit button opens gacha, required gacha assets, card back usage, GameCard usage, CEO asset usage, and absence of rounded- utility classes in the new gacha page; verify by running node tests/gacha-view.test.mjs.
- [x] 4.3 Run final verification with npm run build and node tests/gacha-view.test.mjs; verify both commands complete successfully before handoff.

## 5. Full-width printer adjustment

- [x] 5.1 Make the gacha printer foreground span the full viewport width while staying anchored to the bottom edge and keeping pull interaction movement vertical-only; verify with tests/gacha-view.test.mjs and npm.cmd run build.

## 6. Printer and reveal interaction fixes

- [x] 6.1 Keep the printer fixed during pull, show three evenly spaced downward Chevron icons as the pull affordance, keep the flying card upright without tilt, and allow click/Enter/Space reveal without a disabled button blocking events; verify with tests/gacha-view.test.mjs and npm.cmd run build.
- [x] 6.2 Change the card flight path so the card first flies downward out of the viewport, then scales up while flying back to the center without tilt; verify with tests/gacha-view.test.mjs and npm.cmd run build.
