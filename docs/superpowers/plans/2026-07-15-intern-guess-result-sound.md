# Intern Guess Result Sound Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Play the correct semantic sound exactly when the formal-table Intern animation reveals a correct or incorrect guess result.

**Architecture:** `InternAnimation` owns the GSAP reveal timing and emits `outcome-reveal` at the result boundary. `GameStage` forwards that outcome to a new `UseGameTableAudio.playInternGuessResultSound(outcome)` command, keeping asset selection, shared settings, gain, and playback-failure handling inside the existing audio controller.

**Tech Stack:** Vue 3 `<script setup>`, GSAP timelines, existing `UseAudioSettings`, Node.js built-in test runner, Vite.

## Global Constraints

- `correct` MUST use `intern-guess-correct.mp3`; `incorrect` MUST use `intern-guess-incorrect.mp3`.
- Playback MUST occur after the one-second prompt hold and at the same boundary where the outcome text becomes visible.
- Each Intern animation MUST trigger at most one result sound.
- Gain MUST equal bounded shared `soundVolume × 0.45`.
- Disabled sound, zero volume, unknown outcome, unavailable Audio API, and rejected playback MUST remain silent without interrupting the animation.
- The animation demo page MUST NOT be wired to formal-table result audio.
- Preserve the existing uncommitted card-play sound work in `UseGameTableAudio.js`, `GameStage.vue`, and `tests/game-table-audio.test.mjs`.

---

### Task 1: Add semantic Intern result playback to the table audio controller

**Files:**
- Modify: `tests/game-table-audio.test.mjs`
- Modify: `src/composables/UseGameTableAudio.js`

**Interfaces:**
- Consumes: `useAudioSettings(): { soundEnabled, soundVolume }` and the existing safe `playAudio(audio)` helper.
- Produces: `playInternGuessResultSound(outcome: "correct" | "incorrect"): void` from `useGameTableAudio()`.

- [ ] **Step 1: Write the failing controller test**

Add a focused test to `tests/game-table-audio.test.mjs` that verifies:

```js
test('Intern guess results use semantic sounds with shared settings', async () => {
  const audioDirectory = new URL('../src/assets/audio/', import.meta.url)
  const audioFiles = await readdir(audioDirectory)
  const source = await readSource('src/composables/UseGameTableAudio.js')

  assert.ok(audioFiles.includes('intern-guess-correct.mp3'))
  assert.ok(audioFiles.includes('intern-guess-incorrect.mp3'))
  assert.ok((await stat(new URL('intern-guess-correct.mp3', audioDirectory))).size > 0)
  assert.ok((await stat(new URL('intern-guess-incorrect.mp3', audioDirectory))).size > 0)
  assert.match(source, /internGuessCorrectSoundUrl/)
  assert.match(source, /internGuessIncorrectSoundUrl/)
  assert.match(source, /INTERN_GUESS_RESULT_SOUND_GAIN = 0\.45/)
  assert.match(source, /function playInternGuessResultSound\(outcome\)/)
  assert.match(source, /\["correct", "incorrect"\]\.includes\(outcome\)/)
  assert.match(source, /audio\.currentTime = 0/)
  assert.match(source, /targetVolume \* INTERN_GUESS_RESULT_SOUND_GAIN/)
  assert.match(source, /playInternGuessResultSound,/)
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
node --test --test-name-pattern="Intern guess results use semantic sounds" tests/game-table-audio.test.mjs
```

Expected: FAIL because the controller does not import the two assets or expose `playInternGuessResultSound()`.

- [ ] **Step 3: Implement the minimal controller command**

In `src/composables/UseGameTableAudio.js`, preserve the existing card-play additions and add:

```js
import internGuessCorrectSoundUrl from "@/assets/audio/intern-guess-correct.mp3";
import internGuessIncorrectSoundUrl from "@/assets/audio/intern-guess-incorrect.mp3";

const INTERN_GUESS_RESULT_SOUND_GAIN = 0.45;
let internGuessResultAudios = null;

function ensureInternGuessResultAudios() {
  if (!internGuessResultAudios) {
    internGuessResultAudios = {
      correct: new Audio(internGuessCorrectSoundUrl),
      incorrect: new Audio(internGuessIncorrectSoundUrl),
    };
    Object.values(internGuessResultAudios).forEach((audio) => {
      audio.preload = "auto";
    });
  }
  return internGuessResultAudios;
}

function playInternGuessResultSound(outcome) {
  if (!canUseAudio() || !["correct", "incorrect"].includes(outcome)) {
    return;
  }

  const { soundEnabled, soundVolume } = useAudioSettings();
  const targetVolume = getBoundedGameTableSoundVolume(soundVolume.value);
  if (!soundEnabled.value || targetVolume <= 0) {
    return;
  }

  const audio = ensureInternGuessResultAudios()[outcome];
  audio.currentTime = 0;
  audio.volume = targetVolume * INTERN_GUESS_RESULT_SOUND_GAIN;
  playAudio(audio);
}
```

Add `playInternGuessResultSound` to the existing `useGameTableAudio()` return object without altering other commands.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run the Step 2 command again. Expected: PASS with zero failures.

---

### Task 2: Emit the reveal boundary and wire formal GameStage playback

**Files:**
- Modify: `tests/card-play-interaction.test.mjs`
- Modify: `tests/game-table-audio.test.mjs`
- Modify: `src/components/game/animations/InternAnimation.vue`
- Modify: `src/components/game/ui/GameStage.vue`

**Interfaces:**
- Consumes: `playInternGuessResultSound(outcome)` from Task 1.
- Produces: `InternAnimation` event `outcome-reveal` with payload `"correct" | "incorrect"`, handled only by formal `GameStage`.

- [ ] **Step 1: Write failing animation-timing and stage-wiring tests**

Extend the Intern animation test in `tests/card-play-interaction.test.mjs` with these assertions:

```js
assert.match(source, /defineEmits\(\["complete", "outcome-reveal"\]\)/)
assert.equal((source.match(/emit\("outcome-reveal", result\.outcome\)/g) ?? []).length, 2)
assert.equal(
  (source.match(/\.to\(\{\}, \{ duration: GUESS_PROMPT_HOLD_SECONDS \}\)[\s\S]*?\.call\(\(\) => emit\("outcome-reveal", result\.outcome\)\)[\s\S]*?\.set\(outcomeRef\.value/g) ?? []).length,
  2,
)
```

Add a focused wiring test to `tests/game-table-audio.test.mjs`:

```js
test('formal Intern animation plays the result sound at outcome reveal', async () => {
  const stageSource = await readSource('src/components/game/ui/GameStage.vue')
  const demoSource = await readSource('src/views/CardPlayTestView.vue')

  assert.match(stageSource, /playInternGuessResultSound/)
  assert.match(stageSource, /@outcome-reveal="playInternGuessResultSound"/)
  assert.doesNotMatch(demoSource, /playInternGuessResultSound/)
})
```

- [ ] **Step 2: Run both focused tests and verify RED**

Run:

```powershell
node --test --test-name-pattern="intern animation shows the submitted position|formal Intern animation plays the result sound" tests/card-play-interaction.test.mjs tests/game-table-audio.test.mjs
```

Expected: FAIL because `InternAnimation` emits only `complete` and `GameStage` has no outcome-reveal handler.

- [ ] **Step 3: Implement the reveal event and formal-table wiring**

In `InternAnimation.vue`, change the emit contract and add the same GSAP call immediately after the hold in both correct and incorrect timelines:

```js
const emit = defineEmits(["complete", "outcome-reveal"]);
```

```js
.to({}, { duration: GUESS_PROMPT_HOLD_SECONDS })
.call(() => emit("outcome-reveal", result.outcome))
.set(outcomeRef.value, { opacity: 1, scale: 1 })
```

In `GameStage.vue`, preserve the existing `playGameCardPlaySound` work, destructure `playInternGuessResultSound` from `useGameTableAudio()`, and wire:

```vue
<InternAnimation
  v-if="activeEffectResult?.type === 'intern'"
  :result="activeEffectResult"
  :target-player-name="activeInternTargetPlayerName"
  :get-player-hand-rect="animationRects.getPlayerHandRect"
  :get-discard-rect="animationRects.getDiscardRect"
  @outcome-reveal="playInternGuessResultSound"
  @complete="handleEffectAnimationComplete"
/>
```

- [ ] **Step 4: Run both focused tests and verify GREEN**

Run the Step 2 command again. Expected: both focused tests PASS.

---

### Task 3: Verify result audio and existing table behavior

**Files:**
- Verify: `src/composables/UseGameTableAudio.js`
- Verify: `src/components/game/animations/InternAnimation.vue`
- Verify: `src/components/game/ui/GameStage.vue`
- Verify: `tests/game-table-audio.test.mjs`
- Verify: `tests/card-play-interaction.test.mjs`

**Interfaces:**
- Consumes: Task 1 controller command and Task 2 event boundary.
- Produces: Verified formal-table behavior with no build or animation regressions.

- [ ] **Step 1: Run complete related test files**

```powershell
node --test tests/game-table-audio.test.mjs tests/card-play-interaction.test.mjs
```

Expected: zero failed tests.

- [ ] **Step 2: Run the production build**

```powershell
npm run build
```

Expected: Vite exits with code `0` and emits both `intern-guess-correct-*.mp3` and `intern-guess-incorrect-*.mp3` assets.

- [ ] **Step 3: Review task-specific scope**

```powershell
git diff --check
git diff -- src/composables/UseGameTableAudio.js src/components/game/animations/InternAnimation.vue src/components/game/ui/GameStage.vue tests/game-table-audio.test.mjs tests/card-play-interaction.test.mjs
```

Expected: no whitespace errors; Intern result changes remain additive and do not remove the pre-existing card-play audio changes. Do not commit or stage unrelated workspace changes unless the user explicitly requests it.
