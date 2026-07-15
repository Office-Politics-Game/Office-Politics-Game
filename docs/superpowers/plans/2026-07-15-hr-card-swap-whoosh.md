# 人資主管換牌動畫音效 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 正式牌桌的人資主管換牌動畫在 1 秒提示結束、兩張牌開始翻轉與移動時播放一次 `game-card-swap-whoosh-04.mp3`。

**Architecture:** `CardSwapAnimation` 只在一般與 reduced-motion 時間軸的動作起點 emit `swap-motion-start`；正式 `GameStage` 將事件直接接到 `UseGameTableAudio.playHrCardSwapSound()`。音效控制器延遲持有單一 Audio、沿用共享音效設定與安全播放 helper，動畫展示頁不接線。

**Tech Stack:** Vue 3 `<script setup>`、GSAP timeline、HTML Audio、Node.js `node:test`、Vite、Spectra。

## Global Constraints

- 音效固定使用 `src/assets/audio/game-card-swap-whoosh-04.mp3`，不得改用 `01`～`03`、`05`～`07` 或 `game-card-swap.mp3`。
- 觸發點固定為 `SWAP_PROMPT_HOLD_SECONDS` 的 1 秒停留結束後、第一個翻牌／移動操作之前。
- 一般與 reduced-motion 時間軸各 emit 一次 `swap-motion-start`；每次實際執行只會進入其中一條路徑，因此每次有效動畫播放一次。
- 音量固定為 bounded 共享 `soundVolume × 0.45`，並遵守 `soundEnabled`。
- Audio API 不可用、音效停用、音量為 0、同步 `play()` 例外與 Promise rejection 都必須安靜 no-op，且不得中斷動畫。
- 正式 `GameStage` 接線；`CardPlayTestView` 不得取得命令或監聽事件。
- 不修改後端、Socket.IO 合約、人資主管規則、動畫時長、視覺樣式或 reduced-motion 結果。
- 目前音效資料夾含使用者尚未提交的其他 whoosh 變體、`kids_cheering.mp3` 與原始檔刪除；每次 Git 操作只 stage 本計畫列出的檔案，不得 stage 其他資產或刪除。

---

## File Structure

- `src/assets/audio/game-card-swap-whoosh-04.mp3`：既有未追蹤的指定換牌素材；Task 1 將此單一資產納入版本控制。
- `src/composables/UseGameTableAudio.js`：新增人資主管換牌 Audio 的擁有權、共享音量與安全播放命令。
- `src/components/game/animations/CardSwapAnimation.vue`：在兩條 GSAP 時間軸的換牌動作起點送出語意事件，不直接依賴音效。
- `src/components/game/ui/GameStage.vue`：正式牌桌將動畫事件路由到共用音效控制器。
- `tests/game-table-audio.test.mjs`：驗證資產、控制器介面、增益、正式接線、demo 隔離與 failure safety。
- `tests/card-effect-result.test.mjs`：驗證一般與 reduced-motion 的 `hold → emit → motion` 時序與 emit 數量。
- `src/views/CardPlayTestView.vue`：只作為 demo 隔離 assertion 的唯讀對象，不修改。

### Task 1: 人資主管換牌音效控制器

**Files:**
- Add: `src/assets/audio/game-card-swap-whoosh-04.mp3`
- Modify: `src/composables/UseGameTableAudio.js`
- Test: `tests/game-table-audio.test.mjs`

**Interfaces:**
- Consumes: `useAudioSettings()` 的 `soundEnabled`／`soundVolume`、既有 `canUseAudio()`、`getBoundedGameTableSoundVolume(volume)` 與 `playAudio(audio)`。
- Produces: `useGameTableAudio().playHrCardSwapSound(): void`。

- [ ] **Step 1: 新增會失敗的控制器契約測試**

在 `tests/game-table-audio.test.mjs` 新增：

```js
test('HR card swap sound uses whoosh 04 at reduced gain', async () => {
  const audioDirectory = new URL('../src/assets/audio/', import.meta.url)
  const source = await readSource('src/composables/UseGameTableAudio.js')
  const commandSource = source.slice(
    source.indexOf('function playHrCardSwapSound'),
    source.indexOf('function playInternGuessResultSound'),
  )

  assert.ok(
    (await stat(new URL('game-card-swap-whoosh-04.mp3', audioDirectory))).size > 0,
  )
  assert.match(
    source,
    /import gameCardSwapWhooshSoundUrl from ["']@\/assets\/audio\/game-card-swap-whoosh-04\.mp3["'];/,
  )
  assert.match(source, /const GAME_HR_CARD_SWAP_SOUND_GAIN = 0\.45/)
  assert.match(source, /let hrCardSwapAudio = null/)
  assert.equal(
    (source.match(/new Audio\(gameCardSwapWhooshSoundUrl\)/g) ?? []).length,
    1,
  )
  assert.match(source, /audio\.preload = ["']auto["']/)
  assert.match(commandSource, /if \(!canUseAudio\(\)\) \{\s*return;/)
  assert.match(commandSource, /if \(!soundEnabled\.value \|\| targetVolume <= 0\) \{\s*return;/)
  assert.match(commandSource, /audio\.currentTime = 0/)
  assert.match(commandSource, /targetVolume \* GAME_HR_CARD_SWAP_SOUND_GAIN/)
  assert.match(commandSource, /playAudio\(audio\)/)
  assert.match(source, /playHrCardSwapSound,/)
})
```

- [ ] **Step 2: 執行 RED 測試**

Run:

```powershell
node --test --test-name-pattern="HR card swap sound" tests/game-table-audio.test.mjs
```

Expected: FAIL，因 `UseGameTableAudio.js` 尚未 import `game-card-swap-whoosh-04.mp3` 且沒有 `playHrCardSwapSound()`。

- [ ] **Step 3: 實作最小控制器**

在 `UseGameTableAudio.js` 的現有音效 import／常數／module state 區加入：

```js
import gameCardSwapWhooshSoundUrl from "@/assets/audio/game-card-swap-whoosh-04.mp3";

const GAME_HR_CARD_SWAP_SOUND_GAIN = 0.45;

let hrCardSwapAudio = null;
```

加入 lazy factory 與命令：

```js
function ensureHrCardSwapAudio() {
  if (!hrCardSwapAudio) {
    const audio = new Audio(gameCardSwapWhooshSoundUrl);
    audio.preload = "auto";
    hrCardSwapAudio = audio;
  }

  return hrCardSwapAudio;
}

function playHrCardSwapSound() {
  if (!canUseAudio()) {
    return;
  }

  const { soundEnabled, soundVolume } = useAudioSettings();
  const targetVolume = getBoundedGameTableSoundVolume(soundVolume.value);

  if (!soundEnabled.value || targetVolume <= 0) {
    return;
  }

  const audio = ensureHrCardSwapAudio();
  audio.currentTime = 0;
  audio.volume = targetVolume * GAME_HR_CARD_SWAP_SOUND_GAIN;
  playAudio(audio);
}
```

並在 `useGameTableAudio()` return object 加入：

```js
playHrCardSwapSound,
```

- [ ] **Step 4: 執行 GREEN 與控制器回歸**

Run:

```powershell
node --test --test-name-pattern="HR card swap sound" tests/game-table-audio.test.mjs
node --test tests/game-table-audio.test.mjs
```

Expected: 聚焦測試 PASS；完整牌桌音效測試零失敗，既有洗牌、抽牌、出牌、實習生與老鳥音效 assertions 保持通過。

- [ ] **Step 5: 僅提交 Task 1 檔案**

```powershell
git add -- src/assets/audio/game-card-swap-whoosh-04.mp3 src/composables/UseGameTableAudio.js tests/game-table-audio.test.mjs
git commit -m "feat(audio): 新增人資主管換牌音效控制器"
```

提交前執行 `git diff --cached --name-only`，Expected: 只列出上述三個路徑。

### Task 2: 換牌動作事件與正式牌桌接線

**Files:**
- Modify: `src/components/game/animations/CardSwapAnimation.vue`
- Modify: `src/components/game/ui/GameStage.vue`
- Test: `tests/card-effect-result.test.mjs`
- Test: `tests/game-table-audio.test.mjs`
- Read only: `src/views/CardPlayTestView.vue`

**Interfaces:**
- Consumes: Task 1 的 `playHrCardSwapSound(): void`。
- Produces: `CardSwapAnimation` emit `swap-motion-start(): void`；正式 `GameStage` 的 `@swap-motion-start="playHrCardSwapSound"` 接線。

- [ ] **Step 1: 新增會失敗的動畫時序測試**

在 `tests/card-effect-result.test.mjs` 新增：

```js
test('HR swap emits one motion-start event after the prompt hold in both motion modes', async () => {
  const source = await readSource('src/components/game/animations/CardSwapAnimation.vue')
  const reducedStart = source.indexOf('if (reduced)')
  const reducedEnd = source.indexOf('return', reducedStart)
  const reducedSource = source.slice(
    reducedStart,
    reducedEnd,
  )
  const standardSource = source.slice(
    source.indexOf('timeline.value', reducedEnd),
    source.indexOf('watch(() => props.result?.id'),
  )

  assert.match(source, /defineEmits\(\[['"]complete['"], ['"]swap-motion-start['"]\]\)/)
  assert.match(
    reducedSource,
    /\.to\(\{\}, \{ duration: SWAP_PROMPT_HOLD_SECONDS \}\)\s*\.call\(\(\) => emit\(['"]swap-motion-start['"]\)\)\s*\.set\(\[sourceFlipperElement, targetFlipperElement\]/,
  )
  assert.match(
    standardSource,
    /\.to\(\{\}, \{ duration: SWAP_PROMPT_HOLD_SECONDS \}\)\s*\.call\(\(\) => emit\(['"]swap-motion-start['"]\)\)\s*\.to\(sourceFlipperElement/,
  )
  assert.equal(
    (source.match(/emit\(['"]swap-motion-start['"]\)/g) ?? []).length,
    2,
  )
})
```

- [ ] **Step 2: 新增會失敗的正式接線與 demo 隔離測試**

在 `tests/game-table-audio.test.mjs` 新增：

```js
test('formal table wires HR swap motion sound while the animation demo stays silent', async () => {
  const stageSource = await readSource('src/components/game/ui/GameStage.vue')
  const demoSource = await readSource('src/views/CardPlayTestView.vue')

  assert.match(
    stageSource,
    /const \{[\s\S]*playHrCardSwapSound[\s\S]*\} = useGameTableAudio\(\)/,
  )
  assert.match(
    stageSource,
    /<CardSwapAnimation[\s\S]*@swap-motion-start="playHrCardSwapSound"[\s\S]*\/>/,
  )
  assert.doesNotMatch(demoSource, /playHrCardSwapSound/)
  assert.doesNotMatch(demoSource, /@swap-motion-start/)
})
```

- [ ] **Step 3: 執行 RED 測試**

Run:

```powershell
node --test --test-name-pattern="HR swap emits|formal table wires HR swap" tests/card-effect-result.test.mjs tests/game-table-audio.test.mjs
```

Expected: 兩個新測試 FAIL，分別指出 `swap-motion-start` emit 與 `GameStage` 接線不存在。

- [ ] **Step 4: 實作動畫事件**

將 `CardSwapAnimation.vue` 的 emit 宣告改為：

```js
const emit = defineEmits(['complete', 'swap-motion-start'])
```

在 reduced-motion 與一般時間軸的 1 秒 hold 後，各加入同一個 GSAP call：

```js
.to({}, { duration: SWAP_PROMPT_HOLD_SECONDS })
.call(() => emit('swap-motion-start'))
```

Reduced-motion 的下一步仍是：

```js
.set([sourceFlipperElement, targetFlipperElement], { rotationY: 180 })
```

一般動畫的下一步仍是：

```js
.to(sourceFlipperElement, getFlipVars(180, timing.flip))
```

- [ ] **Step 5: 實作正式牌桌接線**

在 `GameStage.vue` 的 `useGameTableAudio()` 解構加入：

```js
playHrCardSwapSound,
```

在正式 `<CardSwapAnimation>` 加入：

```vue
@swap-motion-start="playHrCardSwapSound"
```

不要修改 `CardPlayTestView.vue`。

- [ ] **Step 6: 執行 GREEN 與相關回歸**

Run:

```powershell
node --test --test-name-pattern="HR swap emits|formal table wires HR swap" tests/card-effect-result.test.mjs tests/game-table-audio.test.mjs
node --test tests/card-effect-result.test.mjs tests/game-table-audio.test.mjs
```

Expected: 聚焦測試 2/2 PASS；兩個完整測試檔零失敗，既有人資主管提示、卡面可見性與其他牌桌音效 assertions 保持通過。

- [ ] **Step 7: 僅提交 Task 2 檔案**

```powershell
git add -- src/components/game/animations/CardSwapAnimation.vue src/components/game/ui/GameStage.vue tests/card-effect-result.test.mjs tests/game-table-audio.test.mjs
git commit -m "feat(audio): 同步人資主管換牌動畫音效"
```

提交前執行 `git diff --cached --name-only`，Expected: 只列出上述四個路徑。

### Task 3: 完整驗證與 Spectra 收尾

**Files:**
- Verify: `src/assets/audio/game-card-swap-whoosh-04.mp3`
- Verify: `dist/assets/game-card-swap-whoosh-04-*.mp3`
- Verify: `openspec/changes/add-game-table-background-music/`

**Interfaces:**
- Consumes: Task 1 的控制器與 Task 2 的動畫事件／正式接線。
- Produces: 可交付的測試、build、資產輸出與 Spectra validation 證據。

- [ ] **Step 1: 執行聚焦與相關回歸測試**

```powershell
node --test tests/game-table-audio.test.mjs tests/card-effect-result.test.mjs tests/card-play-interaction.test.mjs tests/socket-game-animation.test.mjs
```

Expected: 零失敗；新的人資主管音效測試與既有交換、出牌、實習生、socket 動畫回歸全部通過。

- [ ] **Step 2: 執行 production build 並確認資產輸出**

```powershell
npm run build
Get-ChildItem dist/assets -Filter 'game-card-swap-whoosh-04-*.mp3' | Select-Object Name, Length
```

Expected: Vite build exit 0；恰有一個非空的 `game-card-swap-whoosh-04-*.mp3`。

- [ ] **Step 3: 驗證差異與 Spectra**

```powershell
git diff --check
spectra validate add-game-table-background-music --strict
spectra analyze add-game-table-background-music --json
```

Expected: `git diff --check` 無 whitespace error；strict validation 通過；新增人資主管內容沒有 Coverage、Consistency 或 Gaps finding。既有 Suggestion 可記錄但不阻擋。

- [ ] **Step 4: 檢查提交範圍**

```powershell
git status --short
git log -3 --oneline
```

Expected: 兩個功能 commit 只包含計畫列出的資產、控制器、動畫、正式接線與測試；其他 whoosh 變體、`kids_cheering.mp3` 與原始素材刪除仍保持使用者原有狀態，未被 stage 或 commit。
