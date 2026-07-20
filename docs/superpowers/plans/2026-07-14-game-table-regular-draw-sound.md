# Formal Game Table Regular Draw Sound Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Play `game-card-draw.mp3` once whenever a valid draw animation begins on the formal game table, for both the initial deal and later draws by any player.

**Architecture:** Keep the existing `playGameCardDealSound()` controller and `GameStage` dependency injection. Move the callback invocation from the initial-deal loop into the shared formal-table `playDrawAnimation()` after source and target rectangles are validated, so all valid formal-table draws share one trigger without double-playing during the initial deal.

**Tech Stack:** Vue 3 Composition API, Node.js test runner, Vite, Spectra.

## Global Constraints

- Apply only to the formal game table; do not wire `CardPlayTestView.vue`.
- Keep `game-card-draw.mp3`, shared `soundEnabled`/`soundVolume`, and gain `0.35` unchanged.
- Do not change role-effect animation audio, draw animation timing, or socket event behavior.
- Missing animation rectangles must not play the sound.
- Audio API unavailability and rejected `play()` Promises must not block the draw sequence.
- Do not stage, commit, or push as part of this plan.

---

### Task 1: Define the shared formal-table draw trigger contract

**Files:**
- Modify: `tests/game-table-audio.test.mjs`
- Test: `tests/game-table-audio.test.mjs`

**Interfaces:**
- Consumes: `playGameCardDealSound(): void` injected into `useGameStageDrawSequence()`.
- Produces: A source-contract test requiring one trigger in the shared formal-table `playDrawAnimation()` and no direct trigger in the initial-deal loop or animation test page.

- [ ] **Step 1: Replace the initial-deal-only wiring assertions with a failing shared-draw test**

```js
test('formal table plays one deal sound for every valid draw animation', async () => {
  const stageSource = await readSource('src/components/game/ui/GameStage.vue')
  const sequenceSource = await readSource(
    'src/composables/useGameStageDrawSequence.js',
  )
  const demoSource = await readSource('src/views/CardPlayTestView.vue')
  const regularDrawSource = sequenceSource.slice(
    sequenceSource.indexOf('async function playDrawAnimation'),
    sequenceSource.indexOf('async function playInitialRoundDrawSequence'),
  )
  const initialDealSource = sequenceSource.slice(
    sequenceSource.indexOf('async function playInitialRoundDrawSequence'),
  )
  const invalidRectGuardIndex = regularDrawSource.indexOf(
    'if (!startRect || !targetRect)',
  )
  const invalidRectReturnIndex = regularDrawSource.indexOf(
    'return false;',
    invalidRectGuardIndex,
  )
  const soundIndex = regularDrawSource.indexOf('playGameCardDealSound()')
  const animationIndex = regularDrawSource.indexOf(
    'await cardDrawAnimation.value?.selfDraw',
  )

  assert.match(stageSource, /useGameTableAudio/)
  assert.match(stageSource, /playGameCardDealSound/)
  assert.match(
    stageSource,
    /useGameStageDrawSequence\(\{[\s\S]*playGameCardDealSound/,
  )
  assert.match(sequenceSource, /playGameCardDealSound = \(\) => \{\}/)
  assert.equal(
    (regularDrawSource.match(/playGameCardDealSound\(\)/g) ?? []).length,
    1,
  )
  assert.ok(invalidRectGuardIndex >= 0)
  assert.ok(invalidRectReturnIndex > invalidRectGuardIndex)
  assert.ok(soundIndex > invalidRectReturnIndex)
  assert.ok(animationIndex > soundIndex)
  assert.doesNotMatch(
    initialDealSource,
    /for \(const player of props\.players\) \{\s*playGameCardDealSound\(\)/,
  )
  assert.doesNotMatch(demoSource, /playGameCardDealSound/)
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
node --test --test-name-pattern="formal table plays one deal sound" tests/game-table-audio.test.mjs
```

Expected: FAIL because `playGameCardDealSound()` is still called directly by `playInitialRoundDrawSequence()` and is absent from the shared `playDrawAnimation()`.

### Task 2: Move the sound trigger to every valid formal-table draw

**Files:**
- Modify: `src/composables/useGameStageDrawSequence.js`
- Test: `tests/game-table-audio.test.mjs`

**Interfaces:**
- Consumes: `playGameCardDealSound(): void` with the existing no-op default.
- Produces: `playDrawAnimation(card, playerId): Promise<boolean>` that plays the sound once only after valid source and target rectangles are available.

- [ ] **Step 1: Move the callback into `playDrawAnimation()`**

After the existing invalid-rectangle return and immediately before the animation `try` block, add:

```js
playGameCardDealSound();
```

Remove this direct call from the initial-deal player loop:

```js
playGameCardDealSound();
```

The resulting flow must be:

```js
if (!startRect || !targetRect) {
  playerHand.value?.finishDraw();
  activeDrawCard.value = null;
  isDrawAnimating.value = false;
  return false;
}

playGameCardDealSound();

try {
  if (shouldDrawSelf) {
    await cardDrawAnimation.value?.selfDraw({
      startRect,
      targetRect,
    });
  } else {
    await cardDrawAnimation.value?.othersDraw({
      startRect,
      targetRect,
    });
  }
```

- [ ] **Step 2: Run the focused test and verify GREEN**

Run:

```powershell
node --test --test-name-pattern="formal table plays one deal sound" tests/game-table-audio.test.mjs
```

Expected: PASS with one matching test and zero failures.

- [ ] **Step 3: Run the complete game-table audio test**

Run:

```powershell
node tests/game-table-audio.test.mjs
```

Expected: all game-table audio tests pass, including the existing `0.35` gain and safe-playback assertions.

### Task 3: Verify draw, socket, and audio regressions

**Files:**
- Verify: `src/composables/useGameStageDrawSequence.js`
- Verify: `src/composables/UseGameTableAudio.js`
- Verify: `src/views/CardPlayTestView.vue`
- Test: `tests/game-table-audio.test.mjs`
- Test: `tests/card-draw-animation.test.mjs`
- Test: `tests/socket-game-animation.test.mjs`
- Test: `tests/pre-game-audio.test.mjs`
- Test: `tests/game-view-refactor.test.mjs`

**Interfaces:**
- Consumes: the shared draw-sequence callback placement from Task 2.
- Produces: verified production output with no formal-table draw regression and no demo-page wiring.

- [ ] **Step 1: Run the focused regression suite**

Run:

```powershell
node --test tests/game-table-audio.test.mjs tests/card-draw-animation.test.mjs tests/socket-game-animation.test.mjs tests/pre-game-audio.test.mjs tests/game-view-refactor.test.mjs
```

Expected: all tests pass with zero failures.

- [ ] **Step 2: Run the production build**

Run:

```powershell
npm run build
```

Expected: Vite exits with code 0 and the output contains `game-card-draw-*.mp3`. The repository's existing chunk-size warning is non-blocking.

- [ ] **Step 3: Check the scoped diff**

Run:

```powershell
git diff --check -- src/composables/useGameStageDrawSequence.js tests/game-table-audio.test.mjs
```

Expected: exit code 0 with no whitespace errors; line-ending conversion warnings are non-blocking.
