# Custom Room Button Audio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every enabled button control in the custom-room waiting screen play the existing `login-button-click` sound.

**Architecture:** Reuse the existing page-level `useButtonClickAudio()` event-delegation composable. `CustomRoomView.vue` will attach its `handleButtonClick` function to the page root with a capture listener so buttons rendered by the page and its child components share one implementation while disabled controls remain silent.

**Tech Stack:** Vue 3 `<script setup>`, existing pre-game audio composables, Node.js built-in test runner, Vite.

## Global Constraints

- Apply the behavior only to the custom-room waiting screen.
- Play `login-button-click` for enabled `<button>` and `role="button"` controls.
- Do not play for `:disabled` or `aria-disabled="true"` controls.
- Do not add or replace audio assets.
- Do not modify waiting-room layout, button styling, or room flow.
- Preserve all pre-existing uncommitted workspace changes.

---

### Task 1: Wire shared click audio into the custom-room waiting screen

**Files:**
- Modify: `tests/pre-game-audio.test.mjs`
- Modify: `src/views/CustomRoomView.vue`

**Interfaces:**
- Consumes: `useButtonClickAudio(): { handleButtonClick(event: MouseEvent): void }` from `src/composables/UseButtonClickAudio.js`.
- Produces: A `click` capture listener on the `CustomRoomView.vue` root `<main>` that delegates enabled button clicks to `handleButtonClick`.

- [ ] **Step 1: Write the failing waiting-room wiring test**

Add this focused test beside the existing post-login button-audio tests in `tests/pre-game-audio.test.mjs`:

```js
test('custom room waiting controls use the shared click sound', async () => {
  const source = await readSource('src/views/CustomRoomView.vue')

  assert.match(source, /useButtonClickAudio/)
  assert.match(
    source,
    /const \{ handleButtonClick \} = useButtonClickAudio\(\)/,
  )
  assert.match(source, /<main[\s\S]*?@click\.capture="handleButtonClick"/)
})
```

- [ ] **Step 2: Run the focused test and verify the RED state**

Run:

```powershell
node --test --test-name-pattern="custom room waiting controls use the shared click sound" tests/pre-game-audio.test.mjs
```

Expected: FAIL because `CustomRoomView.vue` does not yet import or call `useButtonClickAudio()` and its root `<main>` has no capture listener.

- [ ] **Step 3: Add the minimal shared-handler wiring**

In `src/views/CustomRoomView.vue`, add the composable import with the other composable imports:

```js
import { useButtonClickAudio } from "@/composables/UseButtonClickAudio.js";
```

Create the handler once in `<script setup>` after the existing composable/store initialization:

```js
const { handleButtonClick } = useButtonClickAudio();
```

Attach the capture listener to the root `<main>`:

```vue
<main
  class="flex h-[100svh] min-h-[100svh] w-screen items-center justify-center overflow-hidden bg-cover bg-center bg-blend-multiply p-0 text-[var(--brand-active)]"
  :style="{
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    backgroundImage: `url(${BG})`,
  }"
  @click.capture="handleButtonClick"
>
```

Do not add per-button playback calls; the shared handler already filters non-button and disabled targets.

- [ ] **Step 4: Run the focused test and verify the GREEN state**

Run:

```powershell
node --test --test-name-pattern="custom room waiting controls use the shared click sound" tests/pre-game-audio.test.mjs
```

Expected: PASS with zero failures.

- [ ] **Step 5: Run regression verification**

Run:

```powershell
node tests/pre-game-audio.test.mjs
npm run build
```

Expected: all pre-game audio tests pass, then Vite exits with code `0` and produces a production build without compile errors.

- [ ] **Step 6: Review scope before handoff**

Run:

```powershell
git diff --check
git diff -- tests/pre-game-audio.test.mjs src/views/CustomRoomView.vue
```

Expected: no whitespace errors; the task-specific diff contains only the new waiting-room test and the `CustomRoomView.vue` shared-handler wiring. Do not stage or commit unrelated pre-existing changes; use the project `$spectra-commit` workflow only if the user later requests a commit.
