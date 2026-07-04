## Summary

Unify blocked-action hover hints for the game table so hand-card and deck interactions use the same lightweight hint pattern.

## Motivation

The hand-before-draw guard currently owns its own hover message styling, and the deck has no matching hint when a non-turn player cannot draw. A shared hint pattern keeps blocked interaction feedback consistent and easier to maintain.

## Proposed Solution

- Add a small reusable hover hint component for blocked game-table actions.
- Use the shared hint for the hand-before-draw message "請先抽下一張牌".
- Use the shared hint for the deck when the viewer is not the current turn player, with message "還沒輪到你".
- Make the hint open only while hovering the blocked target and close immediately when the pointer leaves.
- Keep the style minimal: hidden by default, visible on hover, dark background, white text, small padding, no animation, no glow, no modal backdrop.

## Non-Goals

- No backend rule changes.
- No modal dialog behavior.
- No new game-stage backend field.
- No changes to draw, play, card effect, or turn resolution rules.

## Alternatives Considered

- Keep separate hand and deck hint styles: rejected because it duplicates behavior and makes future blocked-action hints harder to keep consistent.
- Use a modal: rejected because hover feedback should disappear immediately on pointer leave and should not interrupt the table.

## Impact

- Affected specs: hand-before-draw-guard
- Affected code:
  - Modified: src/components/game/GameStage.vue
  - Modified: src/components/game/PlayerHand.vue
  - Modified: src/components/game/TableCardPiles.vue
  - Modified: tests/player-hand.test.mjs
  - Modified: tests/table-card-piles.test.mjs
  - New: src/components/game/HoverBlockHint.vue
  - Removed: none
