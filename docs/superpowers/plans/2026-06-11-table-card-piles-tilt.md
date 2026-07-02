# 牌庫與棄牌區桌面傾斜效果 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 為牌庫與棄牌區加入自然桌面角度、多層陰影與滑鼠跟隨的 GSAP 3D 傾斜效果。

**Architecture:** 互動邏輯封裝在 `TableCardPiles.vue`，透過兩個 template refs 分別管理牌庫與棄牌區。Vue 掛載時使用 GSAP context 與媒體查詢啟用精準游標互動，卸載時統一還原。

**Tech Stack:** Vue 3 Composition API、Tailwind CSS 4、GSAP 3、Node.js test runner

---

### Task 1: 建立互動結構測試

**Files:**
- Create: `tests/table-card-piles.test.mjs`
- Test: `tests/table-card-piles.test.mjs`

- [ ] **Step 1: 寫入失敗測試**

檢查元件具備 GSAP、Vue 生命週期、兩個牌堆 refs、游標事件、減少動態效果判斷、清理流程與桌面陰影 class。

- [ ] **Step 2: 確認測試因功能尚未實作而失敗**

Run: `node --test tests/table-card-piles.test.mjs`

Expected: FAIL，指出缺少 GSAP 或牌堆互動結構。

### Task 2: 實作牌堆傾斜互動

**Files:**
- Modify: `src/components/game/TableCardPiles.vue`
- Test: `tests/table-card-piles.test.mjs`

- [ ] **Step 1: 建立 Vue 與 GSAP 生命週期**

加入 `ref`、`onMounted`、`onUnmounted`、`gsap.context()` 和 `gsap.matchMedia()`，並以元件根節點限制作用範圍。

- [ ] **Step 2: 實作獨立牌堆互動**

以 `pointermove` 將游標位置映射為小幅 `rotationX`、`rotationY` 和 `y`，使用 `gsap.quickTo()` 平滑更新；`pointerleave` 回復預設值。

- [ ] **Step 3: 加入桌面視覺**

牌庫與棄牌區使用不同 `rotationZ`，加入接觸陰影、柔和投影、`perspective`、`transform-style` 與 `will-change`。

- [ ] **Step 4: 加入無動畫替代行為**

媒體條件不符合精準游標，或使用者偏好減少動態效果時，不註冊游標事件，只保留固定桌面角度。

- [ ] **Step 5: 確認測試通過**

Run: `node --test tests/table-card-piles.test.mjs`

Expected: PASS

### Task 3: 完整驗證

**Files:**
- Verify: `src/components/game/TableCardPiles.vue`

- [ ] **Step 1: 執行全部測試**

Run: `node --test tests/*.test.mjs`

Expected: 全部 PASS

- [ ] **Step 2: 執行正式建置**

Run: `npm run build`

Expected: Vite build 成功且無編譯錯誤。

- [ ] **Step 3: 檢查差異**

Run: `git diff --check`

Expected: 無空白字元錯誤。
