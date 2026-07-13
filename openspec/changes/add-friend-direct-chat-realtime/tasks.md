## 1. 後端聊天訂閱

- [x] 1.1 先在 server/tests/chatSocket.test.js 覆蓋 Authenticated player chat subscription 與 Idempotent player chat unsubscription，包括有效／無效 token、換身分離開舊房間、無身分取消訂閱不影響其他 rooms；執行 npm.cmd test -- chatSocket.test.js --runInBand 並確認因 chat handler 尚未存在而失敗。
- [x] 1.2 實作「使用 token 驗證聊天訂閱而不修改全站 Socket 握手」及「使用每位玩家的個人聊天房間」，新增 chat:subscribe、chat:unsubscribe 並註冊 handler，使 token 衍生的玩家加入 chat:player:<playerId> 且取消訂閱具冪等性；執行 npm.cmd test -- chatSocket.test.js --runInBand 驗證全部通過。

## 2. REST 成功後推播

- [x] 2.1 先擴充 server/tests/chatController.test.js 覆蓋 REST-triggered direct message delivery，包括成功後向接收者 emit、service 失敗不 emit、Socket server 不存在或 emit 丟錯仍回傳 201；執行 npm.cmd test -- chatController.test.js --runInBand 並確認新案例在實作前失敗。
- [x] 2.2 實作「保留 REST 寫入並只用 Socket 推播」與「REST 成功後採非阻塞推播」，讓既有 POST 成功後向 chat:player:<receiverPlayerId> 發送 chat:message，並隔離推播錯誤而不改變 REST response；執行 npm.cmd test -- chatController.test.js chatService.test.js --runInBand 驗證既有授權與新推播案例全部通過。

## 3. 前端 conversation 即時同步

- [x] 3.1 先新增 tests/friend-chat-realtime.test.mjs 覆蓋 Realtime conversation synchronization，包括非目前好友事件寫入正確 conversation、REST／Socket／歷史資料依 id 去重與排序、缺少必要欄位的事件被忽略；執行 node tests/friend-chat-realtime.test.mjs 並確認因 realtime store 行為尚未存在而失敗。
- [x] 3.2 實作「chatStore 依訊息 ID 合併與去重」，讓 set／append／load 與 chat:message 共用 mergeMessages(friendId, messages)，按 createdAt 與 id 穩定排序且不污染其他 conversation；執行 node tests/friend-chat-realtime.test.mjs 驗證同步與去重案例通過。

## 4. 重連與頁面生命週期

- [x] 4.1 先擴充 tests/friend-chat-realtime.test.mjs 覆蓋 Reconnect subscription and selected-conversation recovery 與 Realtime lifecycle preserves REST chat，包括 startRealtime 重複呼叫只綁一次、connect 後重新訂閱與補載 selectedFriendId、沒有選取好友時不載入、stop／clear 移除 chat listeners 但保留其他 Socket listeners；執行測試並確認新案例在生命週期實作前失敗。
- [x] 4.2 實作「重連後重新訂閱並補載目前對話」，新增 startRealtime()、stopRealtime() 與訂閱旗標，在重連 ack 成功後合併目前對話歷史，訂閱失敗時仍保留 REST loadMessages／sendMessage；執行 node tests/friend-chat-realtime.test.mjs 驗證重連、去重及 REST fallback 案例通過。
- [x] 4.3 實作「FriendView 管理好友聊天即時生命週期」，在 canUseFriendSystem 可用時啟動、失效或 clearChatData 時停止並清除、unmount 時只移除 chat-specific handlers；執行 node tests/friend-chat-realtime.test.mjs 與 npm.cmd run build 驗證頁面生命週期及編譯通過。

## 5. 最終驗證

- [x] 5.1 執行 server 目錄的 npm.cmd test -- --runInBand --cacheDirectory=.jest-cache、根目錄的 node tests/friend-chat-realtime.test.mjs 與 npm.cmd run build，確認 Issue #203 的後端、前端與 build 全部通過；另執行 node tests/friend-api-integration.test.mjs 並將既有登入彈窗舊斷言失敗單獨記錄，不在本 change 修改。
- [x] 5.2 進行範圍審查，確認沒有新增 chat:send、全站 Socket auth、未讀／已讀／typing、分頁、附件、其他聊天類型、登入彈窗修正或 UI polish；以 git diff --stat 及 rg 搜尋相關 token 驗證變更只涵蓋 Issue #203。

## 6. 好友聊天捲動與泡泡視覺

- [x] 6.1 先新增 tests/friend-chat-layout.test.mjs 覆蓋 Scrollable direct chat layout and speech bubble presentation，驗證 FriendView 與 FriendChatPanel 形成有限高度 flex 鏈、只有 chat-body 使用 overflow-y-auto、chat-composer 固定不縮小、桌面／小螢幕泡泡寬度與左右三角尾巴契約；執行 node tests/friend-chat-layout.test.mjs 並確認在版面修正前失敗。
- [x] 6.2 實作「限制聊天高度並以訊息區獨立捲動」與「使用窄版方形泡泡與 CSS 三角尾巴」，讓長對話僅在 chat-body 捲動、toolbar 與 composer 固定可見，桌面泡泡最大寬度 62%、小螢幕 82%，好友／自己尾巴分別朝左／右且不新增裝飾性 DOM；執行 node tests/friend-chat-layout.test.mjs 與 npm.cmd run build 驗證通過。
- [x] 6.3 進行好友聊天 UI 最終驗證，執行 node tests/friend-chat-layout.test.mjs、node tests/friend-chat-realtime.test.mjs 與 npm.cmd run build，並人工確認長訊息清單可捲動、輸入區不離開可視範圍、泡泡保持 Square UI 且沒有修改自動捲動或其他聊天功能。

## 7. 即時訂閱失敗復原

- [x] 7.1 先擴充 tests/friend-chat-realtime.test.mjs 覆蓋 Recoverable realtime subscription 與「讓未訂閱狀態自動重試並顯示即時狀態」，驗證首次 chat:subscribe 失敗後會自動重試、重複 startRealtime 會立即重試、stopRealtime 取消待執行重試，且 chat:message、connect、disconnect、connect_error 各只保留一個 listener；執行 node tests/friend-chat-realtime.test.mjs 並確認新案例在修正前失敗。
- [x] 7.2 實作 Recoverable realtime subscription 與「讓未訂閱狀態自動重試並顯示即時狀態」，讓 chatStore 最多自動重試 3 次、成功或停止時清除重試狀態、斷線時更新訂閱狀態，並讓 FriendChatPanel 顯示非阻塞即時連線警告與重新連線按鈕；執行 node tests/friend-chat-realtime.test.mjs 與 node tests/friend-chat-layout.test.mjs 驗證通過。
- [x] 7.3 執行 server 目錄的 npm.cmd test -- --runInBand --cacheDirectory=.jest-cache、根目錄的 node tests/friend-chat-realtime.test.mjs、node tests/friend-chat-layout.test.mjs 與 npm.cmd run build，並以 git diff --check 確認沒有格式錯誤；保留既有登入彈窗基線失敗於本 change 範圍外。

## 8. Proxy 穩定即時生命週期

- [x] 8.1 先擴充 tests/friend-chat-realtime.test.mjs 覆蓋 Stable realtime lifecycle identity，使用兩個等價 Vue Proxy 指向同一 raw Pinia store，驗證 startRealtime 建立的 generation 在另一個 Proxy 進入 subscribeRealtime 時仍可取回，且透過另一個 Proxy 呼叫 stopRealtime 可清除相同 handlers；執行 node tests/friend-chat-realtime.test.mjs，確認跨 Proxy 訂閱案例維持通過，但現有以 Proxy 為 WeakMap 鍵的實作無法在 stopRealtime 清除 chat listeners 而產生預期失敗。
- [x] 8.2 實作「以 raw Pinia store 穩定索引即時生命週期」，讓 generation、handler bundle、retry timer 與 retry count 的所有 WeakMap 存取統一使用 `toRaw(store)`，移除 server/src/controllers/chatController.js、server/src/socket/chatHandlers.js、src/services/socketClient.js、src/stores/chatStore.js 與 src/views/FriendView.vue 的暫時診斷碼；執行 node tests/friend-chat-realtime.test.mjs、node tests/friend-chat-layout.test.mjs、server 目錄的 npm.cmd test -- --runInBand --cacheDirectory=.jest-cache、npm.cmd run build 與 git diff --check，並由兩個已登入瀏覽器確認接收者不重新整理即可看到新訊息。
