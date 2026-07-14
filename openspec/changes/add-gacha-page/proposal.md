## Why

The lobby has no gacha page for presenting a card acquisition moment, and the existing recruit button in the lobby menu does not yet lead to a recruiting or gacha experience. This change adds a focused frontend gacha page and wires the lobby recruit button to it so the team can validate the printer pull, card-back flight, and card reveal experience before adding backend draw contracts, currencies, or inventory persistence.

## What Changes

- Add the public /gacha route as a lobby feature page with a return-to-lobby control.
- Wire the existing recruit button in the lobby menu to enter /gacha while preserving its current menu-btn placement, icon-recruit.png image, label, and disabled behavior.
- Add a Gacha page that uses the existing gacha background and printer artwork.
- Support mouse and touch pointer dragging on the printer; pulling downward past the threshold starts the draw interaction.
- For the first version, always produce the CEO sample card: the printer emits a card back, the card back flies to the center of the screen, and clicking the centered card flips it to the CEO face.
- Reuse the existing GameCard component and card asset mapping.

## Non-Goals

- No backend draw API integration.
- No player currency, ticket, or gacha item consumption.
- No player collection or inventory persistence.
- No multi-pool odds table, pity logic, draw history, or shop purchase flow.
- No redesign of the lobby menu layout or recruit button visual styling.

## Capabilities

### New Capabilities

- gacha-page: Defines the frontend gacha page route, lobby recruit-button entry point, and pointer-driven card reveal interaction.

### Modified Capabilities

(none)

## Impact

- Affected specs: gacha-page
- Affected code:
  - New: src/views/GachaView.vue
  - New: tests/gacha-view.test.mjs
  - Modified: src/router/index.js
  - Modified: src/components/menu/LobbyMenu.vue
  - Removed: (none)
