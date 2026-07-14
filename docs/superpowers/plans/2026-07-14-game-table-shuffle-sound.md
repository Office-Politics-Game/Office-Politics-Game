# 牌桌洗牌音效 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在每次有效的牌桌洗牌動畫開始時，以較低增益播放兩層裁切為 1.2 秒的 `game-card-shuffle.ogg`，並遵守共用音效設定。

**Architecture:** 延伸既有 `UseGameTableAudio`，讓牌桌背景音樂與牌桌效果音共用安全播放基礎，但各自使用音樂與音效設定。洗牌音效使用兩個 HTML Audio 實例：主層立即播放，第二層延遲 100ms，兩層各自播放 1200ms；`CardShuffleAnimation` 仍只呼叫公開的洗牌播放命令。

**Tech Stack:** Vue 3 Composition API、HTML Audio、GSAP、Node.js test runner

## Global Constraints

- 音效只在洗牌動畫輸入驗證通過後、動畫正式開始時播放一次。
- 音效跟隨 `soundEnabled` 與 `soundVolume`，不得使用背景音樂設定。
- 主層增益固定為 0.25，第二層增益固定為 0.15。
- 主層從 0ms 播放至 1200ms，第二層從 100ms 播放至 1300ms。
- 新一輪洗牌必須先清除舊計時器並停止、歸零兩層音訊。
- 播放失敗不得阻斷洗牌動畫。
- 不修改其他牌桌音效、洗牌視覺效果或背景音樂行為。
- 保留工作區中所有既有未提交變更；未經使用者要求不建立 Git commit。

---

### Task 1: 牌桌洗牌音效控制器

**Files:**
- Modify: `tests/game-table-audio.test.mjs`
- Modify: `src/composables/UseGameTableAudio.js`

**Interfaces:**
- Consumes: `useAudioSettings()` 提供的 `soundEnabled`、`soundVolume`
- Produces: `playGameCardShuffleSound(): void`

- [x] **Step 1: 寫入失敗測試**

在 `tests/game-table-audio.test.mjs` 新增測試，確認資產存在、控制器使用音效設定、重設播放位置並公開播放函式：

```js
test('game table audio controller plays the shuffle effect using sound settings', async () => {
  const audioDirectory = new URL('../src/assets/audio/', import.meta.url)
  const audioFiles = await readdir(audioDirectory)
  const source = await readSource('src/composables/UseGameTableAudio.js')

  assert.ok(audioFiles.includes('game-card-shuffle.ogg'))
  assert.ok((await stat(new URL('game-card-shuffle.ogg', audioDirectory))).size > 0)
  assert.match(source, /gameCardShuffleSoundUrl/)
  assert.match(source, /new Audio\(gameCardShuffleSoundUrl\)/)
  assert.match(source, /function playGameCardShuffleSound/)
  assert.match(source, /soundEnabled/)
  assert.match(source, /soundVolume/)
  assert.match(source, /audio\.currentTime = 0/)
  assert.match(source, /playGameCardShuffleSound,/)
})
```

- [x] **Step 2: 執行測試並確認 RED**

Run: `node --test --test-name-pattern="shuffle effect" tests/game-table-audio.test.mjs`

Expected: FAIL，原因為 `UseGameTableAudio.js` 尚未包含 `gameCardShuffleSoundUrl`。

- [x] **Step 3: 寫入最小控制器實作**

在 `UseGameTableAudio.js`：

```js
import gameCardShuffleSoundUrl from "@/assets/audio/game-card-shuffle.ogg";

let gameCardShuffleAudio = null;

function getBoundedGameTableSoundVolume(volume) {
  const numericVolume = Number(volume);

  if (!Number.isFinite(numericVolume)) {
    return 1;
  }

  return Math.min(1, Math.max(0, numericVolume / 100));
}

function ensureGameCardShuffleAudio() {
  if (!gameCardShuffleAudio) {
    const audio = new Audio(gameCardShuffleSoundUrl);
    audio.preload = "auto";
    gameCardShuffleAudio = audio;
  }

  return gameCardShuffleAudio;
}

function playGameCardShuffleSound() {
  if (!canUseAudio()) {
    return;
  }

  const { soundEnabled, soundVolume } = useAudioSettings();
  const targetVolume = getBoundedGameTableSoundVolume(soundVolume.value);

  if (!soundEnabled.value || targetVolume <= 0) {
    return;
  }

  const audio = ensureGameCardShuffleAudio();
  audio.currentTime = 0;
  audio.volume = targetVolume;
  playAudio(audio);
}
```

將 `playGameCardShuffleSound` 加入 `useGameTableAudio()` 的回傳物件。

- [x] **Step 4: 執行測試並確認 GREEN**

Run: `node --test --test-name-pattern="shuffle effect" tests/game-table-audio.test.mjs`

Expected: PASS。

### Task 2: 在洗牌動畫開始時觸發音效

**Files:**
- Modify: `tests/game-table-audio.test.mjs`
- Modify: `src/components/game/animations/CardShuffleAnimation.vue`

**Interfaces:**
- Consumes: `playGameCardShuffleSound(): void`
- Produces: 每次有效 `CardShuffleAnimation.play(options)` 呼叫觸發一次洗牌音效

- [x] **Step 1: 寫入失敗測試**

在 `tests/game-table-audio.test.mjs` 新增測試，確認播放呼叫只出現一次，且位於輸入 guard 之後、GSAP 時間軸之前：

```js
test('shuffle animation starts one sound after validating its input', async () => {
  const source = await readSource(
    'src/components/game/animations/CardShuffleAnimation.vue',
  )
  const guardIndex = source.indexOf('if (!resolvedDeckPose?.rect || deckCount <= 0)')
  const soundIndex = source.indexOf('playGameCardShuffleSound()')
  const timelineIndex = source.indexOf('await waitForTimeline')

  assert.match(source, /useGameTableAudio/)
  assert.equal((source.match(/playGameCardShuffleSound\(\)/g) ?? []).length, 1)
  assert.ok(guardIndex >= 0)
  assert.ok(soundIndex > guardIndex)
  assert.ok(timelineIndex > soundIndex)
})
```

- [x] **Step 2: 執行測試並確認 RED**

Run: `node --test --test-name-pattern="shuffle animation starts" tests/game-table-audio.test.mjs`

Expected: FAIL，原因為動畫元件尚未引用 `useGameTableAudio`。

- [x] **Step 3: 寫入最小動畫整合**

在 `CardShuffleAnimation.vue` 匯入並取得播放函式：

```js
import { useGameTableAudio } from '@/composables/UseGameTableAudio'

const { playGameCardShuffleSound } = useGameTableAudio()
```

在無效輸入 guard 後、設定可見牌張前呼叫：

```js
playGameCardShuffleSound()
visibleCardCount.value = Math.min(deckCount, 6)
```

- [x] **Step 4: 執行聚焦測試並確認 GREEN**

Run: `node --test tests/game-table-audio.test.mjs`

Expected: 全部 PASS。

- [x] **Step 5: 執行回歸驗證**

Run: `node --test tests/game-table-audio.test.mjs tests/pre-game-audio.test.mjs`

Expected: 全部 PASS，沒有 error 或 warning。

Run: `npm run build`

Expected: Vite production build 成功完成。

- [x] **Step 6: 檢查差異**

Run: `git diff --check -- tests/game-table-audio.test.mjs src/composables/UseGameTableAudio.js src/components/game/animations/CardShuffleAnimation.vue`

Expected: 無輸出。僅檢查本次修改，不提交或改動其他工作區檔案。

### Task 3: 裁短並疊加兩層洗牌音效

**Files:**
- Modify: `tests/game-table-audio.test.mjs`
- Modify: `src/composables/UseGameTableAudio.js`

**Interfaces:**
- Consumes: `playGameCardShuffleSound(): void`、`soundEnabled`、`soundVolume`
- Produces: 主層 0–1200ms／0.25 增益與第二層 100–1300ms／0.15 增益的單次洗牌聲景

- [ ] **Step 1: 寫入失敗測試**

在 `tests/game-table-audio.test.mjs` 新增斷言，確認控制器定義兩層參數、兩個音訊實例、延遲與裁切計時器，以及重播清理：

```js
test('shuffle effect uses two short low-gain layers and clears stale playback', async () => {
  const source = await readSource('src/composables/UseGameTableAudio.js')

  assert.match(source, /GAME_CARD_SHUFFLE_SOUND_DURATION_MS = 1200/)
  assert.match(source, /GAME_CARD_SHUFFLE_LAYER_DELAY_MS = 100/)
  assert.match(source, /GAME_CARD_SHUFFLE_PRIMARY_GAIN = 0\.25/)
  assert.match(source, /GAME_CARD_SHUFFLE_SECONDARY_GAIN = 0\.15/)
  assert.equal(
    (source.match(/new Audio\(gameCardShuffleSoundUrl\)/g) ?? []).length,
    2,
  )
  assert.match(source, /window\.setTimeout/)
  assert.match(source, /window\.clearTimeout/)
  assert.match(source, /audio\.pause\(\)/)
  assert.match(source, /targetVolume \* GAME_CARD_SHUFFLE_PRIMARY_GAIN/)
  assert.match(source, /targetVolume \* GAME_CARD_SHUFFLE_SECONDARY_GAIN/)
})
```

- [ ] **Step 2: 執行測試並確認 RED**

Run: `node --test --test-name-pattern="two short low-gain layers" tests/game-table-audio.test.mjs`

Expected: FAIL，原因為控制器尚未定義兩層播放參數。

- [ ] **Step 3: 寫入最小兩層播放實作**

在 `UseGameTableAudio.js` 定義參數與兩個音訊實例：

```js
const GAME_CARD_SHUFFLE_SOUND_DURATION_MS = 1200;
const GAME_CARD_SHUFFLE_LAYER_DELAY_MS = 100;
const GAME_CARD_SHUFFLE_PRIMARY_GAIN = 0.25;
const GAME_CARD_SHUFFLE_SECONDARY_GAIN = 0.15;

let gameCardShuffleAudios = null;
let gameCardShuffleTimerIds = [];

function ensureGameCardShuffleAudios() {
  if (!gameCardShuffleAudios) {
    gameCardShuffleAudios = [
      new Audio(gameCardShuffleSoundUrl),
      new Audio(gameCardShuffleSoundUrl),
    ];
    gameCardShuffleAudios.forEach((audio) => {
      audio.preload = "auto";
    });
  }

  return gameCardShuffleAudios;
}
```

新增清理與排程函式：

```js
function clearGameCardShuffleTimers() {
  gameCardShuffleTimerIds.forEach((timerId) => window.clearTimeout(timerId));
  gameCardShuffleTimerIds = [];
}

function pauseAndResetGameCardShuffleAudio(audio) {
  audio.pause();
  audio.currentTime = 0;
}

function stopGameCardShuffleSounds() {
  clearGameCardShuffleTimers();
  gameCardShuffleAudios?.forEach(pauseAndResetGameCardShuffleAudio);
}

function scheduleGameCardShuffleAction(action, delayMs) {
  gameCardShuffleTimerIds.push(window.setTimeout(action, delayMs));
}
```

將 `playGameCardShuffleSound()` 改為先清理上一輪，再排程兩層：

```js
stopGameCardShuffleSounds();
const [primaryAudio, secondaryAudio] = ensureGameCardShuffleAudios();
primaryAudio.volume = targetVolume * GAME_CARD_SHUFFLE_PRIMARY_GAIN;
secondaryAudio.volume = targetVolume * GAME_CARD_SHUFFLE_SECONDARY_GAIN;
playAudio(primaryAudio);

scheduleGameCardShuffleAction(
  () => playAudio(secondaryAudio),
  GAME_CARD_SHUFFLE_LAYER_DELAY_MS,
);
scheduleGameCardShuffleAction(
  () => pauseAndResetGameCardShuffleAudio(primaryAudio),
  GAME_CARD_SHUFFLE_SOUND_DURATION_MS,
);
scheduleGameCardShuffleAction(
  () => pauseAndResetGameCardShuffleAudio(secondaryAudio),
  GAME_CARD_SHUFFLE_LAYER_DELAY_MS + GAME_CARD_SHUFFLE_SOUND_DURATION_MS,
);
```

- [ ] **Step 4: 執行聚焦測試並確認 GREEN**

Run: `node --test tests/game-table-audio.test.mjs`

Expected: 全部 PASS。

- [ ] **Step 5: 執行回歸與建置驗證**

Run: `node --test tests/game-table-audio.test.mjs tests/pre-game-audio.test.mjs`

Expected: 全部 PASS。

Run: `npm run build`

Expected: Vite production build 成功，輸出包含 `game-card-shuffle-*.ogg`。

- [ ] **Step 6: 檢查差異**

Run: `git diff --check -- tests/game-table-audio.test.mjs src/composables/UseGameTableAudio.js`

Expected: 無空白錯誤；不提交、不改動其他工作區檔案。
