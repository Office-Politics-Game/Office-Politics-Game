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

## 9. 訊息來源方向與身分標示

- [x] 9.1 先擴充 tests/friend-chat-layout.test.mjs 覆蓋 Scrollable direct chat layout and speech bubble presentation 與「以訊息擁有者控制視覺方向與身分標示」，驗證本人訊息整組靠左、白色泡泡、左向尾巴且泡泡上方顯示「我」，對方訊息整組靠右、`--gray-100` 淺灰泡泡、右向尾巴且泡泡上方只渲染 `friend.playerId`；執行 node tests/friend-chat-layout.test.mjs 並確認現有相反方向與顏色會產生預期失敗。
- [x] 9.2 實作「以訊息擁有者控制視覺方向與身分標示」，在 src/components/friend/FriendChatPanel.vue 以語意文字節點將身分標示放在泡泡外上方，維持 `isMine(message)` 判斷與既有資料流程，讓本人靠左白色並顯示「我」、對方靠右淺灰色並只顯示實際玩家 ID，三角尾巴依所在側朝外且時間維持泡泡內右下角；執行 node tests/friend-chat-layout.test.mjs 驗證新的方向、顏色、標示與 Square UI 契約通過。
- [ ] 9.3 執行 node tests/friend-chat-layout.test.mjs、node tests/friend-chat-realtime.test.mjs、npm.cmd run build 與 git diff --check，並人工確認本人／對方訊息在桌面與小螢幕都維持左白「我」／右灰好友暱稱、泡泡最大寬度 62%／82%、輸入區固定與訊息區可捲動；不得修改 Socket、REST 或 chatStore 資料結構，自動跟隨最新訊息另依 11.5 驗證。

## 10. 好友私訊鍵盤送出

- [x] 10.1 先新增 tests/friend-chat-keyboard.test.mjs 覆蓋 Keyboard-friendly direct message submission 與「使用鍵盤事件區分送出、換行與輸入法組字」的純函式契約，驗證無修飾 Enter 為送出手勢，而 Shift／Ctrl／Alt／Meta+Enter、非 Enter 按鍵與 `isComposing === true` 皆不是送出手勢；執行 node tests/friend-chat-keyboard.test.mjs 並確認因 src/utils/FriendChatKeyboard.js 尚不存在而產生預期失敗。
- [x] 10.2 實作 `isFriendChatSubmitShortcut(event)`，只讀取 `key`、`shiftKey`、`ctrlKey`、`altKey`、`metaKey` 與 `isComposing` 並回傳 boolean，不存取 Vue、DOM 或聊天狀態；執行 node tests/friend-chat-keyboard.test.mjs 驗證純 Enter 通過、所有修飾鍵與輸入法組字案例皆被排除。
- [x] 10.3 擴充 tests/friend-chat-keyboard.test.mjs 覆蓋 FriendChatPanel 鍵盤接線，驗證 textarea 綁定 `handleMessageKeydown`、送出手勢先呼叫 `preventDefault()`、`sendDisabled` 為 true 時不送出、可送出時只沿用一次 `submitMessage()`，並確認現有尚未綁定鍵盤事件的元件產生預期失敗。
- [x] 10.4 在 src/components/friend/FriendChatPanel.vue 實作 `handleMessageKeydown(event)` 並使用 `isFriendChatSubmitShortcut(event)`，讓 Enter 送出、Shift+Enter 保留換行、輸入法組字不誤送、空白或送出中不重複送出；執行 node tests/friend-chat-keyboard.test.mjs、node tests/friend-chat-layout.test.mjs 與 node tests/friend-chat-realtime.test.mjs 驗證鍵盤操作不影響既有版面與即時聊天。
- [ ] 10.5 執行 node tests/friend-chat-keyboard.test.mjs、node tests/friend-chat-layout.test.mjs、node tests/friend-chat-realtime.test.mjs、npm.cmd run build 與 git diff --check，並人工確認純 Enter 送出一次、Shift+Enter 可輸入換行、中文輸入法 Enter 選字不送出；不得修改 REST、Socket、chatStore 或訊息身分判斷契約。

## 11. 目前對話自動跟隨最新訊息

- [x] 11.1 先新增 tests/friend-chat-scroll.test.mjs 覆蓋 Automatic latest-message visibility 與「讓目前對話永遠跟隨最新訊息」的純函式契約，以 scrollTop 為 120、scrollHeight 為 640 的容器驗證執行後 scrollTop 等於 640，並驗證 null／undefined 容器不丟出例外；執行 node tests/friend-chat-scroll.test.mjs 並確認因 src/utils/FriendChatScroll.js 尚不存在而產生預期失敗。
- [x] 11.2 實作 `scrollFriendChatToLatest(container)`，容器存在時只執行 `container.scrollTop = container.scrollHeight`，容器不存在時直接返回，不讀寫 Vue、Pinia、REST、Socket 或 conversation；執行 node tests/friend-chat-scroll.test.mjs 驗證捲到底部與空容器安全性全部通過。
- [x] 11.3 擴充 tests/friend-chat-scroll.test.mjs 覆蓋 FriendChatPanel 自動捲動接線，驗證 chat-body 綁定 `chatBodyRef`、元件監聽 `friend.playerId`、目前 conversation 訊息數量與最後一則訊息 ID、等待 `nextTick()` 後呼叫一次 `scrollFriendChatToLatest(chatBodyRef.value)`；執行 node tests/friend-chat-scroll.test.mjs 並確認尚未接線的 FriendChatPanel 產生預期失敗。
- [x] 11.4 在 src/components/friend/FriendChatPanel.vue 實作「讓目前對話永遠跟隨最新訊息」，使自己送出、收到目前好友的即時訊息、切換好友或歷史載入完成後，一律等待 DOM 更新再將目前 chat-body 捲到底部，即使玩家正在閱讀舊訊息也強制顯示最新一則；執行 node tests/friend-chat-scroll.test.mjs、node tests/friend-chat-keyboard.test.mjs、node tests/friend-chat-layout.test.mjs 與 node tests/friend-chat-realtime.test.mjs 驗證不影響鍵盤、版面與即時同步。
- [ ] 11.5 執行 node tests/friend-chat-scroll.test.mjs、node tests/friend-chat-keyboard.test.mjs、node tests/friend-chat-layout.test.mjs、node tests/friend-chat-realtime.test.mjs、npm.cmd run build、git diff --check 與 spectra validate "add-friend-direct-chat-realtime"；再以兩個已登入瀏覽器人工確認發送方與接收方都自動看到最新訊息、切換好友與歷史載入後位於底部，且手動上捲後收到新訊息會強制回到底部，不得修改 REST、Socket、chatStore 或 conversation 資料結構。

## 12. 對方訊息暱稱標示

- [x] 12.1 先擴充 tests/friend-chat-layout.test.mjs 覆蓋 Scrollable direct chat layout and speech bubble presentation 與「以訊息擁有者控制視覺方向與身分標示」的新暱稱契約，驗證本人訊息上方仍顯示「我」，對方訊息上方渲染 `friend.name` 且該身分標示不使用 `friend.playerId`；執行 node tests/friend-chat-layout.test.mjs 並確認現有玩家編號標示產生預期失敗。
- [x] 12.2 在 src/components/friend/FriendChatPanel.vue 將對方訊息身分標示改為既有 `friend.name`，沿用 friendStore 由好友 API `username` 建立的暱稱，不修改資料庫、REST、Socket、directMessage 或本人「我」標示；執行 node tests/friend-chat-layout.test.mjs、node tests/friend-chat-realtime.test.mjs 與 npm.cmd run build 驗證暱稱顯示及既有聊天功能通過。
- [ ] 12.3 執行 node tests/friend-chat-layout.test.mjs、node tests/friend-chat-realtime.test.mjs、npm.cmd run build、git diff --check 與 spectra validate "add-friend-direct-chat-realtime"，並人工確認好友暱稱為「bbb」、玩家 ID 為 446 時，對方訊息上方顯示「bbb」而非「446」，本人訊息仍顯示「我」，聊天標題下方仍保留玩家 ID 與在線狀態。
