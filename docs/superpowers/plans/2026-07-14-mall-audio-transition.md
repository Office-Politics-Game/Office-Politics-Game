# Mall Audio Transition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Play a delayed entrance bell after the mall view mounts and restore `pre-game-lobby-theme` with the existing 900ms fade-in when navigation returns from `Mall` to `LobbyHome`.

**Architecture:** Register the bell in the existing `UsePreGameAudio` sound-effect registry, schedule its one-shot playback in `MallView`, and cancel the timer on unmount. Preserve pre-game activation while the active route is `Mall`, then let the root route watcher request a one-time fade-in when the previous route was `Mall`.

**Tech Stack:** Vue 3 Composition API, Vue Router, native `HTMLAudioElement`, Node.js test runner, Vite.

## Global Constraints

- Import the source audio as `src/assets/audio/mall-entrance-bell.mp3`; do not rename or delete the Downloads copy.
- Keep the existing `login-button-click` before mall navigation.
- Play the entrance bell 200ms after `MallView` mounts and cancel pending playback when it unmounts.
- Restore `pre-game-lobby-theme` with the existing 900ms fade-in only when returning from `Mall` to a pre-game route.
- Respect the existing music/sound enabled flags and volume settings.
- Preserve the current uncommitted `PRE_LOGIN_MUSIC_GAIN = 1.0` change.
- Preserve the current uncommitted `Profile`, `Friend`, and `Gacha` pre-game route additions and their regression test.
- Do not touch `src/assets/audio/Cheesy force field on and off Sound effect.mp3` or unrelated working-tree files.

## File Map

- Create `src/assets/audio/mall-entrance-bell.mp3`: semantic project copy of the supplied store entrance bell.
- Modify `src/composables/UsePreGameAudio.js`: register the bell, preserve activation on `Mall`, and accept a route-entry fade-in option.
- Modify `src/views/MallView.vue`: schedule/cancel the bell and unify all return controls through `goLobby()`.
- Modify `src/App.vue`: detect `Mall` → pre-game navigation and request fade-in.
- Modify `tests/pre-game-audio.test.mjs`: cover the asset, delayed lifecycle playback, unified exits, activation preservation, and fade-in routing.

---

### Task 1: Delayed Mall Entrance Bell

**Files:**
- Create: `src/assets/audio/mall-entrance-bell.mp3`
- Modify: `src/composables/UsePreGameAudio.js:1-35`
- Modify: `src/views/MallView.vue:24-132,377-416,616-619,768-774`
- Test: `tests/pre-game-audio.test.mjs`

**Interfaces:**
- Consumes: `usePreGameAudio().playPreGameSound(soundName: string): void`
- Produces: sound-effect key `mall-entrance-bell`; `MallView` lifecycle timer with a fixed 200ms delay.

- [ ] **Step 1: Write the failing entrance-bell tests**

Append focused assertions to `tests/pre-game-audio.test.mjs`:

```js
test('mall entrance uses a delayed semantic bell sound', async () => {
  const audioFiles = await readdir(new URL('../src/assets/audio/', import.meta.url))
  const audioSource = await readSource('src/composables/UsePreGameAudio.js')
  const mallSource = await readSource('src/views/MallView.vue')
  const lobbySource = await readSource('src/components/menu/LobbyMenu.vue')

  assert.ok(audioFiles.includes('mall-entrance-bell.mp3'))
  assert.match(audioSource, /mallEntranceBellUrl/)
  assert.match(audioSource, /"mall-entrance-bell": mallEntranceBellUrl/)
  assert.match(lobbySource, /function openMallPage\(\)[\s\S]*?playPreGameSound\("login-button-click"\)/)
  assert.match(mallSource, /MALL_ENTRANCE_BELL_DELAY_MS = 200/)
  assert.match(mallSource, /playPreGameSound\("mall-entrance-bell"\)/)
  assert.match(mallSource, /window\.setTimeout/)
  assert.match(mallSource, /window\.clearTimeout/)
})

test('all mall return controls use the shared lobby handler', async () => {
  const mallSource = await readSource('src/views/MallView.vue')
  const returnHandlers = Array.from(mallSource.matchAll(/@click="goLobby"/g))

  assert.equal(returnHandlers.length, 3)
  assert.doesNotMatch(mallSource, /@click="router\.push\('\/lobby'\)"/)
})
```

- [ ] **Step 2: Run the tests and verify RED**

Run:

```powershell
node tests\pre-game-audio.test.mjs
```

Expected: FAIL because `mall-entrance-bell.mp3`, its registry entry, delayed lifecycle playback, and the third `goLobby` binding do not exist yet.

- [ ] **Step 3: Copy and semantically rename the supplied audio**

Copy without altering the Downloads source:

```powershell
Copy-Item -LiteralPath 'C:\Users\user\Downloads\daviddumaisaudio-store-entrance-bell-188054.mp3' -Destination 'src\assets\audio\mall-entrance-bell.mp3'
```

- [ ] **Step 4: Register the bell in the shared audio controller**

Add the import and map entry in `src/composables/UsePreGameAudio.js`:

```js
import mallEntranceBellUrl from "@/assets/audio/mall-entrance-bell.mp3";

const soundEffectUrls = {
  "login-button-click": loginButtonClickUrl,
  "lobby-navigation-whoosh": lobbyNavigationWhooshUrl,
  "mall-entrance-bell": mallEntranceBellUrl,
};
```

- [ ] **Step 5: Schedule and cancel entrance playback in MallView**

Update `src/views/MallView.vue`:

```js
import { usePreGameAudio } from "@/composables/UsePreGameAudio";

const { handleButtonClick } = useButtonClickAudio();
const { playPreGameSound } = usePreGameAudio();
const MALL_ENTRANCE_BELL_DELAY_MS = 200;
let mallEntranceBellTimerId = null;

onMounted(() => {
  window.addEventListener("keydown", handleEscape);
  mallEntranceBellTimerId = window.setTimeout(() => {
    mallEntranceBellTimerId = null;
    playPreGameSound("mall-entrance-bell");
  }, MALL_ENTRANCE_BELL_DELAY_MS);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleEscape);

  if (mallEntranceBellTimerId !== null) {
    window.clearTimeout(mallEntranceBellTimerId);
    mallEntranceBellTimerId = null;
  }
});
```

Change the desktop return control from direct routing to the existing handler:

```vue
<button
  type="button"
  class="btn-dark order-2 h-8 translate-y-1 whitespace-nowrap px-2.5 py-1 text-xs font-bold xl:order-none xl:h-11 xl:px-4 xl:py-2 xl:text-sm"
  @click="goLobby"
>
  返回大廳
</button>
```

- [ ] **Step 6: Run the tests and verify GREEN**

Run:

```powershell
node tests\pre-game-audio.test.mjs
```

Expected: all entrance-bell and existing pre-game audio tests PASS.

- [ ] **Step 7: Record the entrance-bell checkpoint without committing**

```powershell
git diff --check -- src/composables/UsePreGameAudio.js src/views/MallView.vue tests/pre-game-audio.test.mjs
git status --short
```

Expected: no whitespace errors; the planned files remain uncommitted for the final combined commit. Preserve the approved `PRE_LOGIN_MUSIC_GAIN = 1.0` and `Profile`/`Friend`/`Gacha` route additions already present in the working tree.

---

### Task 2: Fade the Pre-game Theme Back In After Mall Exit

**Files:**
- Modify: `src/composables/UsePreGameAudio.js:23-26,304-410`
- Modify: `src/App.vue:1-16`
- Test: `tests/pre-game-audio.test.mjs`

**Interfaces:**
- Consumes: route names `Mall` and `LobbyHome`; existing `startPreGameBackground({ fadeIn, userInitiated })`.
- Produces: `syncPreGameRouteAudio(routeName: string, options?: { fadeIn?: boolean }): void`.

- [ ] **Step 1: Write the failing route-transition test**

Append to `tests/pre-game-audio.test.mjs`:

```js
test('returning from mall preserves activation and fades the pre-game theme in', async () => {
  const appSource = await readSource('src/App.vue')
  const audioSource = await readSource('src/composables/UsePreGameAudio.js')

  assert.match(appSource, /\(routeName, previousRouteName\) =>/)
  assert.match(appSource, /previousRouteName === "Mall"/)
  assert.match(appSource, /syncPreGameRouteAudio\(routeName, \{ fadeIn \}\)/)
  assert.match(
    audioSource,
    /function syncPreGameRouteAudio\(routeName, \{ fadeIn = false \} = \{\}\)/,
  )
  assert.match(audioSource, /startPreGameBackground\(\{ fadeIn \}\)/)
  assert.match(
    audioSource,
    /preserveActivation: routeName === "Mall"/,
  )
})
```

- [ ] **Step 2: Run the tests and verify RED**

Run:

```powershell
node tests\pre-game-audio.test.mjs
```

Expected: FAIL because `syncPreGameRouteAudio` has no `fadeIn` option, the root watcher ignores the previous route, and entering `Mall` clears pre-game activation.

- [ ] **Step 3: Preserve activation while Mall is active and accept fade-in**

Update `src/composables/UsePreGameAudio.js`:

```js
function syncPreGameRouteAudio(routeName, { fadeIn = false } = {}) {
  if (isPreLoginAudioRoute(routeName)) {
    startPreLoginBackground();
    return;
  }

  if (isPreGameAudioRoute(routeName)) {
    currentPreGameRouteActive = true;
    currentPreLoginRouteActive = false;
    pauseAudio(loginLobbyMusicAudio, { reset: true });
    if (preGameBackgroundStarted) {
      startPreGameBackground({ fadeIn });
    }
    return;
  }

  currentPreLoginRouteActive = false;
  pauseAudio(loginLobbyMusicAudio, { reset: true });
  stopPreGameBackground({
    fadeOut: true,
    preserveActivation: routeName === "Mall",
  });
}
```

- [ ] **Step 4: Request fade-in for Mall → pre-game navigation**

Update the watcher in `src/App.vue`:

```js
watch(
  () => route.name,
  (routeName, previousRouteName) => {
    const fadeIn = previousRouteName === "Mall";
    syncPreGameRouteAudio(routeName, { fadeIn });
  },
  { immediate: true },
);
```

- [ ] **Step 5: Run the focused tests and verify GREEN**

Run:

```powershell
node tests\pre-game-audio.test.mjs
node tests\audio-settings-shared-state.test.mjs
```

Expected: all tests PASS, including activation preservation and Mall return fade-in.

- [ ] **Step 6: Run production verification**

Run:

```powershell
npm run build
git diff --check
```

Expected: Vite exits with code 0; `git diff --check` prints no errors.

- [ ] **Step 7: Record the fade-in checkpoint without committing**

```powershell
git diff --check -- src/App.vue src/composables/UsePreGameAudio.js tests/pre-game-audio.test.mjs
git status --short
```

Expected: no whitespace errors; all implementation changes remain available for the single final commit.

---

### Task 3: Final Acceptance Verification

**Files:**
- Verify: `src/assets/audio/mall-entrance-bell.mp3`
- Verify: `src/composables/UsePreGameAudio.js`
- Verify: `src/views/MallView.vue`
- Verify: `src/App.vue`
- Verify: `tests/pre-game-audio.test.mjs`

**Interfaces:**
- Consumes: completed Task 1 and Task 2 behavior.
- Produces: verified implementation ready for handoff.

- [ ] **Step 1: Re-run the complete focused verification set**

```powershell
node tests\pre-game-audio.test.mjs
node tests\audio-settings-shared-state.test.mjs
npm run build
git diff --check
```

Expected: 0 failed tests, Vite exit code 0, and no whitespace errors.

- [ ] **Step 2: Inspect repository scope**

```powershell
git status --short
git diff --stat HEAD~2..HEAD
```

Expected: the working tree contains the planned audio asset, audio controller, mall view, root route watcher, focused tests, and this plan. The unrelated `Cheesy force field on and off Sound effect.mp3` remains untracked.

- [ ] **Step 3: Confirm acceptance criteria against source**

```powershell
rg -n "mall-entrance-bell|MALL_ENTRANCE_BELL_DELAY_MS|previousRouteName|preserveActivation|fadeIn" src/App.vue src/composables/UsePreGameAudio.js src/views/MallView.vue tests/pre-game-audio.test.mjs
```

Expected: the bell is registered and delayed by 200ms; Mall preserves activation; Mall exit requests fade-in; tests cover each behavior.

- [ ] **Step 4: Create one combined implementation commit**

```powershell
git add -- docs/superpowers/plans/2026-07-14-mall-audio-transition.md src/App.vue src/assets/audio/mall-entrance-bell.mp3 src/composables/UsePreGameAudio.js src/views/MallView.vue tests/pre-game-audio.test.mjs
git commit -m "feat(audio): 完善大廳與商城音效流程"
```

Expected: one commit includes the previously approved gain/route continuity changes and the mall entrance/return behavior; `Cheesy force field on and off Sound effect.mp3` remains untracked.
