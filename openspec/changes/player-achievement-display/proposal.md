## Why

目前個人資料頁已有成就分頁，但還沒有真正的成就資料來源。這個 change 先建立玩家成就的第一版顯示流程，讓前端可以從後端取得成就清單並顯示解鎖狀態。

## What Changes

- 新增成就資料表與玩家成就解鎖資料表。
- 新增玩家成就查詢 API。
- 新增前端 achievement API、Pinia store 與個人資料頁成就顯示元件。
- 成就資料先保留獎勵欄位，但這個 change 不發放獎勵。

## Non-Goals

- 不處理對局結算後自動解鎖成就。
- 不發放 coins、gems 或 tickets。
- 不新增公開的手動解鎖 API。
- 不新增後台管理畫面。

## Capabilities

### New Capabilities

- player-achievements: 玩家可以在個人資料頁查看成就清單與解鎖狀態。

### Modified Capabilities

(none)

## Impact

- Affected specs: player-achievements
- Affected code:
  - New: server/src/services/achievementService.js
  - New: server/src/controllers/achievementController.js
  - New: server/src/routes/achievementRoutes.js
  - New: src/services/achievementApi.js
  - New: src/stores/achievementStore.js
  - New: src/components/profile/AchievementPanel.vue
  - Modified: server/src/app.js
  - Modified: server/src/db/schema.sql
  - Modified: src/views/ProfileView.vue
  - Removed: none
