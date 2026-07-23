## Why

目前 `/friend` 社交頁依賴 viewport 百分比尺寸、768px 重排與窄畫面上下堆疊，和專案只支援兩檔橫向固定畫布的 Square UI 規範不一致，導致不同解析度下的版面、捲動與操作區域不可預期。

## What Changes

- 將 `/friend` 改為 960 x 540px 與 1280 x 720px 兩檔固定橫向畫布。
- viewport 小於目前畫布時等比例縮放整張畫布，大於畫布時保持原尺寸並置中。
- 兩檔畫布都維持左側社交功能區與右側聊天區，不再切換成上下排列。
- 固定各內容區的捲動邊界，讓聊天工具列與輸入區維持可見，長內容不產生頁面級溢出。
- 保留直向旋轉提示、Square UI 視覺狀態與既有好友及聊天功能。
- 新增社交頁 RWD 契約測試，並更新既有聊天版面測試。

## Capabilities

### New Capabilities

- `friend-social-rwd`: 定義好友社交頁的雙尺寸橫向畫布、整體縮放、雙欄配置、內容捲動與互動可用性要求。

### Modified Capabilities

(none)

## Impact

- Affected specs: friend-social-rwd
- Affected code:
  - New: src/composables/UseFriendSocialCanvas.js
  - Modified: src/views/FriendView.vue
  - Modified: src/components/friend/FriendChatPanel.vue
  - Modified: src/components/friend/FriendList.vue
  - Modified: src/components/friend/FriendItem.vue
  - Modified: src/components/friend/AddFriendForm.vue
  - Modified: src/components/friend/FriendRequestList.vue
  - Modified: src/components/friend/BlockedPlayerList.vue
  - Modified: tests/friend-chat-layout.test.mjs
  - New: tests/friend-social-rwd.test.mjs
  - Removed: none
- APIs、Pinia stores、Socket events、routes、backend services、database schema 與 dependencies 維持不變。
