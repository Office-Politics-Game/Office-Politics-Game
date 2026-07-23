# 牌桌發牌音效 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 初始回合每張牌開始飛向玩家前播放一次 `game-card-draw.mp3`，使用共享音效設定與 0.35 固定增益。

**Architecture:** `UseGameTableAudio` 集中管理發牌 Audio 與安全播放；`GameStage` 將 `playGameCardDealSound()` 注入 `useGameStageDrawSequence`。只有 `playInitialRoundDrawSequence()` 的玩家迴圈觸發，通用 `playDrawAnimation()` 保持無音效。

**Tech Stack:** Vue 3 Composition API、HTML Audio、Node.js test runner、Vite

## Global Constraints

- 音效檔固定使用 `src/assets/audio/game-card-draw.mp3`。
- 每位玩家的初始發牌動畫開始前播放一次。
- 音量固定為共享 `soundVolume` 換算值乘以 0.35。
- 一般抽牌、角色效果抽牌與展示頁不得播放此發牌音效。
- 音效停用、音量為 0、Audio 不可用或 play Promise 拒絕時不得阻斷發牌。
- 不修改發牌動畫視覺效果、順序或速度。
- 保留所有既有未提交變更；未經使用者要求不建立 Git commit。

---

### Task 1: 發牌音效控制器

**Files:**
- Modify: `tests/game-table-audio.test.mjs`
- Modify: `src/composables/UseGameTableAudio.js`

**Interfaces:**
- Consumes: `soundEnabled`、`soundVolume`、既有 `playAudio(audio)`
- Produces: `playGameCardDealSound(): void`

- [ ] **Step 1: 寫入失敗測試**

在 `tests/game-table-audio.test.mjs` 新增：

```js
test('game table audio controller plays the deal sound at reduced gain', async () => {
  const audioDirectory = new URL('../src/assets/audio/', import.meta.url)
  const audioFiles = await readdir(audioDirectory)
  const source = await readSource('src/composables/UseGameTableAudio.js')

  assert.ok(audioFiles.includes('game-card-draw.mp3'))
  assert.ok((await stat(new URL('game-card-draw.mp3', audioDirectory))).size > 0)
  assert.match(source, /gameCardDealSoundUrl/)
  assert.match(source, /GAME_CARD_DEAL_SOUND_GAIN = 0\.35/)
  assert.match(source, /new Audio\(gameCardDealSoundUrl\)/)
  assert.match(source, /function playGameCardDealSound/)
  assert.match(source, /targetVolume \* GAME_CARD_DEAL_SOUND_GAIN/)
  assert.match(source, /playGameCardDealSound,/)
})
```

- [ ] **Step 2: 執行測試並確認 RED**

Run: `node --test --test-name-pattern="deal sound at reduced gain" tests/game-table-audio.test.mjs`

Expected: FAIL，原因為控制器尚未引用 `gameCardDealSoundUrl`。

- [ ] **Step 3: 寫入最小控制器實作**

在 `UseGameTableAudio.js` 新增：

```js
import gameCardDealSoundUrl from "@/assets/audio/game-card-draw.mp3";

const GAME_CARD_DEAL_SOUND_GAIN = 0.35;
let gameCardDealAudio = null;

function ensureGameCardDealAudio() {
  if (!gameCardDealAudio) {
    const audio = new Audio(gameCardDealSoundUrl);
    audio.preload = "auto";
    gameCardDealAudio = audio;
  }

  return gameCardDealAudio;
}

function playGameCardDealSound() {
  if (!canUseAudio()) {
    return;
  }

  const { soundEnabled, soundVolume } = useAudioSettings();
  const targetVolume = getBoundedGameTableSoundVolume(soundVolume.value);

  if (!soundEnabled.value || targetVolume <= 0) {
    return;
  }

  const audio = ensureGameCardDealAudio();
  audio.currentTime = 0;
  audio.volume = targetVolume * GAME_CARD_DEAL_SOUND_GAIN;
  playAudio(audio);
}
```

將 `playGameCardDealSound` 加入 `useGameTableAudio()` 回傳物件。

- [ ] **Step 4: 執行聚焦測試並確認 GREEN**

Run: `node --test --test-name-pattern="deal sound at reduced gain" tests/game-table-audio.test.mjs`

Expected: PASS。

### Task 2: 初始發牌序列觸發音效

**Files:**
- Modify: `tests/game-table-audio.test.mjs`
- Modify: `src/components/game/ui/GameStage.vue`
- Modify: `src/composables/useGameStageDrawSequence.js`

**Interfaces:**
- Consumes: `playGameCardDealSound(): void`
- Produces: 初始發牌玩家迴圈每次飛牌前呼叫一次音效，通用抽牌路徑零呼叫

- [ ] **Step 1: 寫入失敗測試**

在 `tests/game-table-audio.test.mjs` 新增：

```js
test('initial deal plays one sound per player without affecting regular draws', async () => {
  const stageSource = await readSource('src/components/game/ui/GameStage.vue')
  const sequenceSource = await readSource('src/composables/useGameStageDrawSequence.js')
  const regularDrawSource = sequenceSource.slice(
    sequenceSource.indexOf('async function playDrawAnimation'),
    sequenceSource.indexOf('async function playInitialRoundDrawSequence'),
  )
  const initialDealSource = sequenceSource.slice(
    sequenceSource.indexOf('async function playInitialRoundDrawSequence'),
  )

  assert.match(stageSource, /useGameTableAudio/)
  assert.match(stageSource, /playGameCardDealSound/)
  assert.match(
    stageSource,
    /useGameStageDrawSequence\(\{[\s\S]*playGameCardDealSound/,
  )
  assert.match(sequenceSource, /playGameCardDealSound = \(\) => \{\}/)
  assert.match(
    initialDealSource,
    /for \(const player of props\.players\) \{\s*playGameCardDealSound\(\);\s*const didDraw = await playDrawAnimation/,
  )
  assert.doesNotMatch(regularDrawSource, /playGameCardDealSound/)
})
```

- [ ] **Step 2: 執行測試並確認 RED**

Run: `node --test --test-name-pattern="initial deal plays one sound" tests/game-table-audio.test.mjs`

Expected: FAIL，原因為 `GameStage` 尚未提供 `playGameCardDealSound`。

- [ ] **Step 3: 寫入最小發牌接線**

在 `GameStage.vue`：

```js
import { useGameTableAudio } from "@/composables/UseGameTableAudio";

const { playGameCardDealSound } = useGameTableAudio();
```

將 `playGameCardDealSound` 傳給 `useGameStageDrawSequence()`。

在 `useGameStageDrawSequence.js` 參數加入安全預設：

```js
playGameCardDealSound = () => {},
```

在初始發牌玩家迴圈中呼叫：

```js
for (const player of props.players) {
  playGameCardDealSound();
  const didDraw = await playDrawAnimation(
```

- [ ] **Step 4: 執行聚焦測試並確認 GREEN**

Run: `node --test tests/game-table-audio.test.mjs`

Expected: 全部 PASS。

### Task 3: 回歸與建置驗證

**Files:**
- Verify: `tests/game-table-audio.test.mjs`
- Verify: `tests/card-draw-animation.test.mjs`
- Verify: `tests/pre-game-audio.test.mjs`

**Interfaces:**
- Consumes: Task 1 與 Task 2 完成的發牌音效行為
- Produces: 測試與 production build 證據

- [ ] **Step 1: 執行相關回歸測試**

Run: `node --test tests/game-table-audio.test.mjs tests/card-draw-animation.test.mjs tests/pre-game-audio.test.mjs`

Expected: 全部 PASS。

- [ ] **Step 2: 執行正式建置**

Run: `npm run build`

Expected: Vite production build 成功，輸出包含 `game-card-draw-*.mp3`。

- [ ] **Step 3: 檢查差異**

Run: `git diff --check -- src/composables/UseGameTableAudio.js src/components/game/ui/GameStage.vue src/composables/useGameStageDrawSequence.js tests/game-table-audio.test.mjs`

Expected: 無空白錯誤；不提交、不改動其他工作區檔案。
