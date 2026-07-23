## Summary

Refactor `GameStage.vue` by moving its stage coordination, draw/deal animation flow, card play drag interaction, notice ACK state, and effect animation state into focused composables and a small UI component. The change reduces maintenance risk while preserving all player-visible behavior and the public contract consumed by `GameView.vue`.

## Motivation

`src/components/game/ui/GameStage.vue` currently mixes UI composition, pointer interaction, animation orchestration, notice timing, and exposed methods in a file larger than one thousand lines. Future changes to round notices, computer-player animation ACK, hand guards, or card play interaction are likely to touch unrelated logic unless the boundaries are made smaller first.

## Proposed Solution

- Keep `GameStage.vue` as the stage assembly layer for props/emits, child component refs, template wiring, `defineExpose`, and lifecycle cleanup coordination.
- Add game-stage-specific composables for initial dealing/draw sequences, notice idle/ACK management, card play drag and pending play state, and effect animation coordination.
- Add a card play confirmation panel component and move the current confirmation panel template and scoped CSS into it while preserving the current confirm, cancel, and guess-selection flow.
- Update source-text Node tests so they verify the same contracts in the new files instead of assuming all implementation details remain in `GameStage.vue`.

## Capabilities

### New Capabilities

- `game-stage-refactor`: Covers the behavior-preserving refactor contract for the game stage component and its extracted modules.

### Modified Capabilities

(none)

## Non-Goals (optional)

- Do not change player flow, animation durations, notice ACK buffers, target/guess rules, hand guard rules, or visual output.
- Do not change backend behavior, socket event contracts, or the `GameView.vue` calls to exposed `GameStage.vue` methods.
- Do not redesign the game table UI, introduce new state-management dependencies, or edit `dist/` or unrelated assets.

## Alternatives Considered (optional)

- Reorder functions inside `GameStage.vue` only: lower immediate risk, but it would leave the core maintainability problem and future regression risk mostly unchanged.
- Split the stage into multiple large container components: this would add template wiring and ref forwarding complexity, and it would increase the chance of changing existing animation positioning behavior.

## Impact

- Affected specs: game-stage-refactor; this change is behavior-preserving and does not alter existing requirements in round-start-notice, computer-player-turns, or hand-before-draw-guard.
- Affected code:
  - Modified: src/components/game/ui/GameStage.vue, tests/computer-player-animation-ack.test.mjs, tests/socket-game-animation.test.mjs
  - New: src/composables/useGameStageDrawSequence.js, src/composables/useGameStageNotices.js, src/composables/useGameStageCardPlay.js, src/composables/useGameStageEffectAnimation.js, src/components/game/ui/CardPlayConfirmPanel.vue
  - Removed: none
