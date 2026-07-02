# Card Deal Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立可重播的四人開局發牌動畫展示頁，且不影響既有抽牌流程。

**Architecture:** 以獨立 `CardDealAnimation.vue` 管理 GSAP overlay 與時間軸，玩家元件只提供固定落點及落地後的顯示。Demo 頁持有展示狀態並協調牌庫、四個落點與重播。

**Tech Stack:** Vue 3、GSAP、Vue Router、Tailwind CSS、Node.js test runner

---

### Task 1: 鎖定元件契約

**Files:**
- Create: `tests/card-deal-animation.test.mjs`

- [x] 新增動畫公開 API、stagger、reduced-motion、清理與路由的失敗測試。
- [x] 執行 `node --test tests/card-deal-animation.test.mjs`，確認因檔案與介面尚未存在而失敗。

### Task 2: 建立玩家落點

**Files:**
- Modify: `src/components/game/PlayerHand.vue`
- Modify: `src/components/game/PlayerSeats.vue`

- [x] 為目前玩家新增置中的第一張發牌落點。
- [x] 為三位對手新增可量測牌背槽與玩家 ID 查詢介面。
- [x] 驗證既有玩家及手牌測試仍通過。

### Task 3: 建立發牌動畫

**Files:**
- Create: `src/components/game/CardDealAnimation.vue`

- [x] 建立 `play({ startRect, deals, onCardStart, onCardLanded })` 與 `cancel()`。
- [x] 使用單一 GSAP 主時間軸，以 `0.25s` 間隔播放四張約 `0.55s` 的弧線動畫。
- [x] 加入 reduced-motion、重播取消、卸載清理及未輪到牌卡隱藏。

### Task 4: 建立展示頁

**Files:**
- Create: `src/views/CardDealDemoView.vue`
- Modify: `src/router/index.js`

- [x] 建立 28 張牌庫、固定下左上右順序、播放鎖定與重置流程。
- [x] 每張啟動時扣除牌庫，落地時更新對手牌背或自己的正面手牌。
- [x] 任一座標缺失時完整中止並顯示錯誤。
- [x] 註冊 `/card-deal-demo`。

### Task 5: 驗證

**Files:**
- Create: `docs/superpowers/specs/2026-06-15-card-deal-animation-design.md`
- Create: `docs/superpowers/plans/2026-06-15-card-deal-animation.md`

- [x] 執行 `node --test`。
- [x] 執行 `npm run build`。
- [x] 以瀏覽器檢查一般桌面、平板橫向、低高度橫向與重播流程。
