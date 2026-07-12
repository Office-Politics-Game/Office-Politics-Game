## Why

目前玩家完成重要行為後沒有成就回饋，個人頁也缺少可展示的長期進度。需要建立最小可用的成就解鎖流程，讓後端在指定行為成功時寫入玩家成就，前端能顯示新解鎖提示，之後個人頁可以展示已解鎖徽章。

## What Changes

- 建立初始成就資料：社交起步、主持新人、完整出勤、初次勝利、資本進場。
- 建立 achievement service，統一處理玩家成就解鎖與避免重複解鎖。
- 在加好友、建立房間、完成一局、遊戲勝利、儲值成功流程中觸發成就檢查。
- API 回傳本次新解鎖的 `unlockedAchievements`。
- 前端收到新解鎖成就時顯示提示框。
- 個人頁只顯示玩家已解鎖成就。

## Non-Goals

- 不建立完整成就列表頁。
- 不顯示尚未解鎖成就。
- 不處理成就獎勵發放。
- 不新增 Socket.IO 即時推播。

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `player-achievements`: 新增玩家成就解鎖、重複解鎖防護、解鎖提示與個人頁已解鎖成就展示。

## Impact

- Affected specs: player-achievements
- Affected code:
  - New: server/src/db/seedAchievements.js
  - New: src/components/common/AchievementUnlockNotice.vue
  - Modified: server/src/services/achievementService.js
  - Modified: server/src/services/friendService.js
  - Modified: server/src/services/roomService.js
  - Modified: server/src/services/topUpService.js
  - Modified: server/src/services/winnerService.js
  - Modified: src/stores/achievementStore.js
  - Modified: src/components/profile/AchievementPanel.vue
  - Modified: src/App.vue
  - Removed: none
