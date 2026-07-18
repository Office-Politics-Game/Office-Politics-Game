# 牌桌 UI 點擊音效 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓牌桌選單、玩家頭像目標、設定齒輪與設定視窗按鈕統一播放既有 `login-button-click` 音效。

**Architecture:** 沿用 `useButtonClickAudio()` 的 capture 階段事件代理，在 `GameStage` 根節點涵蓋牌桌 DOM 子樹；`GameSettingsModal` 因 `Teleport` 離開牌桌子樹，於 overlay 根節點獨立接上同一處理器。音效啟用狀態、音量、停用控制與播放失敗均由既有共用邏輯處理。

**Tech Stack:** Vue 3 `<script setup>`、Node.js `node:test`、Vite 8。

## Global Constraints

- 沿用 `src/composables/UseButtonClickAudio.js`，不建立重複音效控制器。
- 音量滑桿不播放點擊音效。
- 停用按鈕與 `aria-disabled="true"` 控制不播放。
- 音效關閉時維持靜音；點擊「開啟音效」當下不播放，後續符合條件的點擊才播放。
- 不修改按鈕外觀、版面或既有選擇／導頁／遊戲行為。
- 保留工作區內與本任務無關的既有未提交變更。

---

### Task 1: 接通牌桌與設定視窗的共用點擊音效

**Files:**
- Modify: `tests/pre-game-audio.test.mjs`
- Modify: `src/components/game/ui/GameStage.vue`
- Modify: `src/components/game/ui/GameSettingsModal.vue`

**Interfaces:**
- Consumes: `useButtonClickAudio(): { handleButtonClick(event: MouseEvent): void }` from `@/composables/UseButtonClickAudio`。
- Produces: `GameStage` 根節點與 `GameSettingsModal` overlay 的 `@click.capture="handleButtonClick"` 接線。

- [ ] **Step 1: 寫入失敗測試**

在 `tests/pre-game-audio.test.mjs` 新增：

```js
test('game table selection and settings buttons use the shared click sound', async () => {
  const gameStageSource = await readSource('src/components/game/ui/GameStage.vue')
  const settingsModalSource = await readSource(
    'src/components/game/ui/GameSettingsModal.vue',
  )

  for (const source of [gameStageSource, settingsModalSource]) {
    assert.match(source, /useButtonClickAudio/)
    assert.match(source, /@click\.capture="handleButtonClick"/)
  }
})
```

- [ ] **Step 2: 執行測試並確認 RED**

Run:

```powershell
node --test --test-name-pattern="game table selection and settings buttons" tests/pre-game-audio.test.mjs
```

Expected: FAIL；`GameStage.vue` 尚未包含 `useButtonClickAudio` 或 capture handler。

- [ ] **Step 3: 在 `GameStage` 接上事件代理**

在 import 區加入：

```js
import { useButtonClickAudio } from "@/composables/UseButtonClickAudio";
```

在 `<script setup>` 的其他 composable 初始化附近加入：

```js
const { handleButtonClick } = useButtonClickAudio();
```

在 `.game-stage` 根節點加入：

```vue
@click.capture="handleButtonClick"
```

- [ ] **Step 4: 在 Teleport 設定視窗接上事件代理**

在 `GameSettingsModal.vue` import 區加入：

```js
import { useButtonClickAudio } from "@/composables/UseButtonClickAudio";
```

在 refs 初始化前加入：

```js
const { handleButtonClick } = useButtonClickAudio();
```

將 overlay 開始標籤保留既有 backdrop 關閉行為並加入 capture handler：

```vue
<div
  v-if="isOpen"
  class="settings-overlay"
  @click.capture="handleButtonClick"
  @click.self="requestClose"
>
```

- [ ] **Step 5: 執行聚焦測試並確認 GREEN**

Run:

```powershell
node --test --test-name-pattern="game table selection and settings buttons" tests/pre-game-audio.test.mjs
```

Expected: PASS，1 個匹配測試通過、其餘測試因 name pattern 跳過。

- [ ] **Step 6: 執行音效回歸測試**

Run:

```powershell
node tests/pre-game-audio.test.mjs
node tests/game-table-audio.test.mjs
```

Expected: 兩個測試檔皆為零失敗。

- [ ] **Step 7: 執行 production build**

Run:

```powershell
npm run build
```

Expected: Vite build exit code 0；不得出現 Vue template 或 import 錯誤。

- [ ] **Step 8: 檢查差異並提交本任務檔案**

Run:

```powershell
git diff --check -- tests/pre-game-audio.test.mjs src/components/game/ui/GameStage.vue src/components/game/ui/GameSettingsModal.vue
git add -- tests/pre-game-audio.test.mjs src/components/game/ui/GameStage.vue src/components/game/ui/GameSettingsModal.vue
git commit -m "feat(audio): 加入牌桌 UI 點擊音效"
```

Expected: `git diff --check` 無輸出；commit 只包含本任務相關差異。若 `GameStage.vue` 內已有其他未提交變更，必須只暫存本任務對應的 hunk，不得連帶提交其他內容。
