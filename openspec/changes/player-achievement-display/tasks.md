## 1. 新增 achievements 與 player_achievements schema

- [x] 1.1 在 server/src/db/schema.sql 新增 achievements 與 player_achievements，包含成就代碼、分類、獎勵欄位、解鎖時間與必要唯一限制。

## 2. 新增 achievementService 查詢流程

- [x] 1.2 新增 server/src/services/achievementService.js，處理玩家存在檢查與成就清單查詢。
- [x] 1.3 新增 server/src/controllers/achievementController.js，處理 GET /api/players/:playerId/achievements，符合 Player achievement list API 回傳格式。
- [x] 1.4 新增 server/src/routes/achievementRoutes.js，並在 server/src/app.js 掛上路由。
- [x] 1.5 確認 Achievement reward metadata 只回傳 rewardCurrency 與 rewardAmount，不在查詢時發放 coins、gems 或 tickets。

## 3. 新增 AchievementPanel 顯示流程

- [x] 2.1 新增 src/services/achievementApi.js，使用 apiClient 呼叫成就查詢 API。
- [x] 2.2 新增 src/stores/achievementStore.js，保存 achievements、isLoading、errorMessage，並提供 fetchPlayerAchievements、clearError、resetAchievements。
- [x] 2.3 新增 src/components/profile/AchievementPanel.vue，顯示已解鎖與未解鎖成就。
- [x] 2.4 修改 src/views/ProfileView.vue，在 badges 分頁顯示 AchievementPanel，符合 Profile achievement tab display；訪客維持鎖定狀態且不呼叫 API。

## 4. 測試與驗證

- [x] 3.1 更新 server/tests/schema.test.js，檢查 achievements 與 player_achievements schema。
- [x] 3.2 新增 service 測試，確認玩家可以取得已解鎖與未解鎖成就。
- [x] 3.3 新增測試，確認成就獎勵欄位只回傳 metadata，不會改動 coins、gems、tickets。
- [x] 3.4 執行 server npm test 與 npm run build。
