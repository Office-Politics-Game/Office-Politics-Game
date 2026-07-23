## Context

`GameStage.vue` is the game table assembly component used by `GameView.vue`. It currently owns child refs, visible card derivation, draw and initial deal sequences, card play drag interaction, pending target/guess selection, effect animation state, and notice idle/ACK timing. `GameView.vue` calls the exposed methods `playDrawAnimation`, `playRemoteCardPlayAnimation`, `playEffectAnimation`, and `waitForNoticeIdle`, and listens for `round-sequence-complete`.

Existing source-text tests assert that computer-player animation ACK, socket play animation, and remote opponent card play remain wired. Those tests must keep validating the same contracts after logic moves out of `GameStage.vue`.

## Goals / Non-Goals

**Goals:**

- Reduce `GameStage.vue` to a stage assembly layer without changing runtime behavior.
- Move related state and functions into focused composables with explicit inputs and cleanup functions.
- Move the play confirmation panel markup and scoped styles into a dedicated UI component.
- Keep all exposed methods, emits, props, animation timing, ACK waiting, and player-visible UI behavior equivalent.
- Update tests to locate the moved contracts in the new files.

**Non-Goals:**

- No backend, socket payload, store, router, or API contract changes.
- No visual redesign, timing adjustment, text copy change, or rule change.
- No migration of game state into Pinia or a global store.
- No generated output or unrelated asset edits.

## Decisions

### Keep GameStage as the orchestration shell

`GameStage.vue` SHALL keep props, emits, imported visual children, template layout, and `defineExpose`. This keeps the `GameView.vue` integration stable and limits template churn. Alternative considered: split the whole table template into multiple containers; rejected because animation rects and child refs are tightly coupled to the existing stage layout.

### Extract behavior by lifecycle and responsibility

Create composables around cohesive runtime responsibilities: draw/deal sequence, notice idle/ACK state, card play interaction, and effect animation state. Each composable SHALL receive refs, props-derived computed values, callbacks, and emit functions as parameters instead of importing `GameView.vue` or global stores. Alternative considered: generic utilities; rejected because these flows are stage-specific and depend on component refs and animation timing.

### Preserve source-level contracts in tests

Tests that currently inspect `GameStage.vue` SHALL be updated to inspect the file that now owns the contract. The tests SHALL still verify the same behavior markers: exposed methods exist, remote opponent play skips self players, notice idle waits for pending open/ACK buffers, and manager/protection animation ACK delays remain present. Alternative considered: deleting source-text tests; rejected because no Vue component test harness currently covers these animation coordination contracts.

## Implementation Contract

Behavior: Users see the same table, hand, deck/discard piles, notices, drag preview, play confirmation panel, protection aura, and effect animations as before. Computer-player readiness ACK remains delayed until scheduled notices and post-close ACK buffers are idle.

Interfaces: `GameStage.vue` SHALL keep the same props, emits, and exposed methods: `playDrawAnimation(card, playerId)`, `playEffectAnimation(result)`, `playRemoteCardPlayAnimation(action)`, and `waitForNoticeIdle()`. `round-sequence-complete` SHALL still emit after the initial round draw sequence and round-start notice flow completes. `CardPlayConfirmPanel.vue` SHALL receive only display/control data for the pending play and emit `select-guess`, `confirm`, and `cancel`.

Failure modes: Missing animation rects SHALL continue to return `false` or reset local interaction state without throwing. Pointer capture failures SHALL remain silent. Effect animation timeouts SHALL continue to settle the animation and release idle waiters. Unmount cleanup SHALL clear pointer listeners and all timers.

Acceptance criteria: `npm run build`, `node tests\computer-player-animation-ack.test.mjs`, `node tests\socket-game-animation.test.mjs`, `node tests\card-play-interaction.test.mjs`, and `node tests\cardplay-target-selection.test.mjs` pass. Source-text tests continue to assert the same behavior in the new module locations.

Scope boundaries: In scope are `GameStage.vue`, the new game-stage composables, `CardPlayConfirmPanel.vue`, and tests that directly assert moved source contracts. Out of scope are backend code, socket payload shapes, game rules, visual redesign, and unrelated frontend components.

## Risks / Trade-offs

- [Risk] Moving tightly coupled refs can break animation rect lookup. -> Mitigation: keep `useGameAnimationRects` construction in `GameStage.vue` and pass the resulting helper object into composables.
- [Risk] Notice idle resolution can regress computer turn ACK timing. -> Mitigation: keep pending-open count, ACK-delay count, manager buffer, and `waitForNoticeIdle` tests as explicit contract checks.
- [Risk] Drag interaction cleanup can leak listeners after extraction. -> Mitigation: expose a card-play cleanup function and call it from `GameStage.vue` unmount.
- [Risk] Source-text tests can become weaker when updated. -> Mitigation: update them to inspect the specific new files that own each behavior instead of replacing checks with broad existence assertions.
