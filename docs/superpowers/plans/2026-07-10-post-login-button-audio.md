# Post-Login Button Audio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓個人區域、社交區域、商城頁面、大廳商城入口與打卡下班按鈕統一播放既有 `login-button-click.mp3`。

**Architecture:** 建立一個頁面層事件委派 composable，從點擊來源尋找最近的有效按鈕控制項並呼叫既有 `usePreGameAudio()`。個人、社交、商城只需在各自根節點接一次處理器；大廳商城入口與打卡下班維持明確播放，避免與其他特殊翻頁音效混用。

**Tech Stack:** Vue 3 Composition API、Vite、Node.js `node:test`

## Global Constraints

- 音效素材固定沿用 `src/assets/audio/login-button-click.mp3`。
- 個人區域與社交區域入口保留 `lobby-navigation-whoosh`。
- 停用按鈕、`aria-disabled="true"`、輸入框與彈窗背景不得播放按鈕音效。
- 音效必須沿用既有 `UseAudioSettings` 開關與音量。
- 不新增後端、資料庫或第三方依賴。
- 不修改既有 UI 視覺、排版與互動狀態。

---

### Task 1: 共用頁面按鈕音效與三個頁面接線

**Files:**
- Create: `src/composables/UseButtonClickAudio.js`
- Modify: `src/components/profile/ProfileShell.vue`
- Modify: `src/views/FriendView.vue`
- Modify: `src/views/MallView.vue`
- Test: `tests/pre-game-audio.test.mjs`

**Interfaces:**
- Consumes: `usePreGameAudio().playPreGameSound(soundName)`
- Produces: `useButtonClickAudio()`，回傳 `{ handleButtonClick(event) }`

- [ ] **Step 1: Write the failing test**

在 `tests/pre-game-audio.test.mjs` 新增：

```js
test('post-login pages delegate enabled button clicks to the shared click sound', async () => {
  const buttonAudioSource = await readSource('src/composables/UseButtonClickAudio.js')
  const profileSource = await readSource('src/components/profile/ProfileShell.vue')
  const friendSource = await readSource('src/views/FriendView.vue')
  const mallSource = await readSource('src/views/MallView.vue')

  assert.match(buttonAudioSource, /button, \[role="button"\]/)
  assert.match(buttonAudioSource, /closest\?\.\(BUTTON_CONTROL_SELECTOR\)/)
  assert.match(buttonAudioSource, /matches\(":disabled"\)/)
  assert.match(buttonAudioSource, /getAttribute\("aria-disabled"\) === "true"/)
  assert.match(buttonAudioSource, /playPreGameSound\("login-button-click"\)/)

  for (const source of [profileSource, friendSource, mallSource]) {
    assert.match(source, /useButtonClickAudio/)
    assert.match(source, /@click\.capture="handleButtonClick"/)
  }
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests\pre-game-audio.test.mjs`

Expected: FAIL，指出找不到 `src/composables/UseButtonClickAudio.js` 或缺少頁面接線。

- [ ] **Step 3: Write minimal implementation**

建立 `src/composables/UseButtonClickAudio.js`：

```js
import { usePreGameAudio } from "@/composables/UsePreGameAudio";

const BUTTON_CONTROL_SELECTOR = 'button, [role="button"]';

function isDisabledControl(control) {
  return (
    control.matches(":disabled") ||
    control.getAttribute("aria-disabled") === "true"
  );
}

export function useButtonClickAudio() {
  const { playPreGameSound } = usePreGameAudio();

  function handleButtonClick(event) {
    const control = event.target?.closest?.(BUTTON_CONTROL_SELECTOR);

    if (
      !control ||
      !event.currentTarget?.contains(control) ||
      isDisabledControl(control)
    ) {
      return;
    }

    playPreGameSound("login-button-click");
  }

  return { handleButtonClick };
}
```

在 `ProfileShell.vue`、`FriendView.vue` 與 `MallView.vue` 的頁面根節點加入：

```vue
@click.capture="handleButtonClick"
```

並在三個元件的 `<script setup>` 加入：

```js
import { useButtonClickAudio } from "@/composables/UseButtonClickAudio";

const { handleButtonClick } = useButtonClickAudio();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests\pre-game-audio.test.mjs`

Expected: 所有音效測試 PASS。

- [ ] **Step 5: Commit**

```powershell
git add -- src/composables/UseButtonClickAudio.js src/components/profile/ProfileShell.vue src/views/FriendView.vue src/views/MallView.vue tests/pre-game-audio.test.mjs
git commit -m "feat(audio): 套用登入後頁面按鈕音效"
```

### Task 2: 大廳商城入口與打卡下班音效

**Files:**
- Modify: `src/components/menu/LobbyMenu.vue`
- Test: `tests/pre-game-audio.test.mjs`

**Interfaces:**
- Consumes: `usePreGameAudio().playPreGameSound(soundName)`
- Produces: 大廳商城入口與打卡下班在執行原動作前播放 `login-button-click`

- [ ] **Step 1: Write the failing test**

在 `tests/pre-game-audio.test.mjs` 新增：

```js
test('mall entry and leave lobby actions use the shared click sound', async () => {
  const source = await readSource('src/components/menu/LobbyMenu.vue')
  const mallAction = source.match(/function openMallPage\(\) \{[\s\S]*?\n\}/)?.[0] ?? ''
  const leaveAction = source.match(/function leaveLobby\(\) \{[\s\S]*?\n\}/)?.[0] ?? ''

  assert.match(mallAction, /playPreGameSound\("login-button-click"\)/)
  assert.doesNotMatch(mallAction, /playLobbyNavigationSound\(\)/)
  assert.match(leaveAction, /playPreGameSound\("login-button-click"\)/)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests\pre-game-audio.test.mjs`

Expected: FAIL，指出商城入口或打卡下班尚未播放 `login-button-click`。

- [ ] **Step 3: Write minimal implementation**

在 `LobbyMenu.vue` 的 `openMallPage()` 中，將：

```js
playLobbyNavigationSound();
```

改為：

```js
playPreGameSound("login-button-click");
```

並在 `leaveLobby()` 通過轉場防護後、登出前加入：

```js
playPreGameSound("login-button-click");
```

- [ ] **Step 4: Run focused and build verification**

Run: `node tests\pre-game-audio.test.mjs`

Expected: 所有音效測試 PASS。

Run: `node tests\audio-settings-shared-state.test.mjs`

Expected: 共用音效設定測試 PASS。

Run: `npm.cmd run build`

Expected: Vite build 成功；既有 bundle size 警告可接受，但不得有新錯誤。

- [ ] **Step 5: Commit**

```powershell
git add -- src/components/menu/LobbyMenu.vue tests/pre-game-audio.test.mjs
git commit -m "feat(audio): 更新商城與登出按鈕音效"
```
