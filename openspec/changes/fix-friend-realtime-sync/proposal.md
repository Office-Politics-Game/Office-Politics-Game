## Why

好友邀請與關係異動目前只透過 REST 寫入資料庫，另一位玩家的好友頁不會在資料改變後即時更新，必須重新整理或重新進入頁面才能看到最新狀態。

## What Changes

- 新增以 HttpOnly Cookie 驗證的好友 Socket 訂閱與每位玩家的個人好友房間。
- 好友邀請、接受、拒絕、解除好友、封鎖及解除封鎖成功後，向另一位玩家發出通用資料失效事件。
- 好友頁啟動與停止好友即時訂閱，收到事件或 Socket 重連後重新載入好友資料。
- 保留既有 REST 寫入、資料庫結構與 HTTP 回應格式，Socket 推播失敗不得改變 REST 成功結果。

## Capabilities

### New Capabilities

- `friend-realtime-sync`: 好友關係異動的個人 Socket 訂閱、資料失效通知、重新連線恢復與生命週期清理。

### Modified Capabilities

(none)

## Impact

- Affected specs: friend-realtime-sync
- Affected code:
  - New: server/src/socket/friendHandlers.js, server/tests/friendSocket.test.js, server/tests/friendController.test.js, tests/friend-realtime-sync.test.mjs
  - Modified: server/src/socket/index.js, server/src/controllers/friendController.js, src/stores/friendStore.js, src/views/FriendView.vue
  - Removed: none
