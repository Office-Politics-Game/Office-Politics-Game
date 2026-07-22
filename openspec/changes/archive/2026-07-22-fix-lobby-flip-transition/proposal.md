## Problem

Lobby 已使用同一張 3D 卡片呈現主選單與遊戲選單，預期從 `/lobby` 前往 `/lobby/game-menu` 時正向翻面，返回時反向翻面；目前切換子路由會直接重建整個 Lobby，導致雙向翻面動畫無法播放。

## Root Cause

`src/App.vue` 的頂層 `RouterView` 以 `route.fullPath` 作為動態元件 key。Lobby 子路由切換時 full path 改變，即使頂層 matched route 仍是 `Lobby`，Vue 仍會銷毀舊實例並建立新實例，使 `Lobby.vue` 的 `is-flipped` class 沒有可供 CSS transition 過渡的前一狀態。

## Proposed Solution

將頂層 RouterView key 改為穩定的頂層 matched route 識別值，並在 matched route 不存在時依序退回目前 route name 與 path。`/lobby` 與 `/lobby/game-menu` 因而共用同一個 Lobby 實例；其他頂層頁面仍使用不同 key，並保留由 `route.query.transition` 控制的遊戲結算頁滑入轉場。

## Non-Goals

- 不調整 Lobby 既有 700ms 翻面時間、旋轉軸、緩動曲線或 reduced-motion 行為。
- 不修改 `LobbyHome`、`LobbyGameMenu` 等路由名稱、路徑或公開介面。
- 不變更好友、個人資料、商城等 Lobby 按鈕各自的頁面轉場。
- 不在此變更處理路由 lazy loading 或其他載入效能優化。

## Success Criteria

- 從 `/lobby` 前往 `/lobby/game-menu` 時保留同一個 `Lobby.vue` 實例並播放 700ms 正向翻面。
- 從 `/lobby/game-menu` 返回 `/lobby` 時保留同一個 `Lobby.vue` 實例並播放 700ms 反向翻面。
- 系統啟用 reduced motion 時仍依現有 CSS 直接切換，不播放翻面 transition。
- 從遊戲進入帶有 `transition=game-end` 的結算頁時，`result-page-slide` 轉場仍然存在。
- 新增的回歸測試與正式環境建置皆通過。

## Capabilities

### New Capabilities

- `lobby-flip-transition`: 定義 Lobby 父層實例在子路由切換期間的保留規則，以及雙向翻面與 reduced-motion 行為。

### Modified Capabilities

（無）

## Impact

- Affected specs: `lobby-flip-transition`
- Affected code:
  - Modified: `src/App.vue`
  - New: `tests/lobby-flip-transition.test.mjs`
  - Removed: （無）
- Public APIs: 無變更
- Dependencies: 無新增或升級
