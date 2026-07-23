## 1. 後端好友 Socket 訂閱

- [x] 1.1 以測試先行完成 Authenticated friend realtime subscription 與「使用獨立的好友 Cookie 訂閱與個人房間」決策：有效 Cookie 加入 friend:player:<playerId>、無效 Cookie 被拒絕、換身分先離房、unsubscribe 冪等且 server 註冊 handler；先執行 server/tests/friendSocket.test.js 觀察缺少功能的失敗，再完成 server/src/socket/friendHandlers.js 與 Socket 初始化接線並確認該測試通過。

## 2. 後端關係失效通知

- [x] 2.1 以測試先行完成 Counterparty friend data invalidation 與「REST 成功後向另一位玩家發出通用失效事件」決策：六種成功異動只向另一位玩家 emit friend:data-invalidated {}、service 失敗不 emit、Socket 不可用或 emit 例外仍保留既有 REST 結果；先執行 server/tests/friendController.test.js 觀察失敗，再修改 controller 並確認該測試通過。

## 3. 前端好友頁即時恢復

- [x] 3.1 以測試先行完成 Friend page realtime recovery 與「friendStore 管理好友頁限定的即時生命週期」決策：startRealtime 冪等訂閱、失效事件重載、connect 重訂閱補載、停止只移除好友 listener、未登入不啟動且訂閱失敗保留 REST；先執行 tests/friend-realtime-sync.test.mjs 觀察失敗，再修改 friendStore 並確認該測試通過。
- [x] 3.2 讓 FriendView 只在已登入且頁面掛載時啟動好友即時同步，卸載或登入失效時停止，且不建立全站常駐訂閱；由 tests/friend-realtime-sync.test.mjs 的 FriendView lifecycle 斷言與 npm run build 驗證。

## 4. 整體驗證

- [ ] 4.1 重新核對 Implementation Contract 的 observable behavior、interface、failure modes 與 scope boundaries，執行 spectra analyze fix-friend-realtime-sync、spectra validate fix-friend-realtime-sync、server 目錄 npm test、node tests/friend-realtime-sync.test.mjs、npm run build，確認全部通過且未修改 AddFriendForm.vue 與 InviteFriendModal.vue 的既有使用者變更。
