# 商城進出音效設計

## 目標

讓玩家從大廳點擊商城時，先聽到既有的通用按鈕點擊聲；商城畫面完成掛載後，再播放店門鈴。玩家從商城返回大廳時，重新以既有 900ms 漸強效果播放 `pre-game-lobby-theme`。

## 使用者體驗

1. 玩家在大廳點擊「商城」。
2. 立即播放既有的 `login-button-click`。
3. 沿用目前 180ms 的商城路由切換延遲。
4. `MallView` 掛載後等待 200ms，再播放商城店門鈴。
5. 玩家點擊任一「返回大廳」入口時回到 `LobbyHome`。
6. 從 `Mall` 返回 `LobbyHome` 後，`pre-game-lobby-theme` 從零音量漸強到使用者設定的目標音量，漸強時間沿用 900ms。

若使用者關閉音效，店門鈴不播放；若關閉音樂，大廳主題不恢復播放。

## 音效資產

- 來源：`C:/Users/user/Downloads/daviddumaisaudio-store-entrance-bell-188054.mp3`
- 專案檔名：`src/assets/audio/mall-entrance-bell.mp3`
- Downloads 中的來源檔保持不變。
- 既有未追蹤音檔與其他工作區變更不屬於本次範圍。

## 架構與資料流

### 商城入口音效

`UsePreGameAudio.js` 匯入 `mall-entrance-bell.mp3`，並在既有 `soundEffectUrls` 中註冊 `mall-entrance-bell`。`LobbyMenu.vue` 保留目前的通用點擊聲，不直接播放店門鈴。

`MallView.vue` 在 `onMounted` 中設定 200ms timer，透過既有 `playPreGameSound("mall-entrance-bell")` 播放店門鈴。`onBeforeUnmount` 必須清除 timer，避免玩家快速離開時在其他頁面誤播。

### 返回大廳音樂

`MallView.vue` 的所有返回按鈕統一呼叫 `goLobby()`，避免不同裝置版面走不同邏輯。

`App.vue` 的路由監聽同時取得目前與前一個 route name。當 route 從 `Mall` 進入 pre-game 音效路由時，傳入一次性的 `fadeIn` 指示。`UsePreGameAudio.js` 的 `syncPreGameRouteAudio` 接受該指示，並在恢復已啟動的 `pre-game-lobby-theme` 時沿用既有 `fadeInAudio` 與 900ms 設定。

此設計也涵蓋瀏覽器返回鍵等非按鈕導航，只要實際路由是 `Mall` → `LobbyHome`，就會使用漸強恢復。

## 失敗與邊界處理

- 音效播放仍沿用既有 `playAudio()` 的 Promise 錯誤吞吐，避免瀏覽器自動播放限制中斷 Vue lifecycle。
- 商城在 200ms 內被卸載時，取消鈴聲 timer。
- 音效或音樂被停用時，不繞過既有設定強制播放。
- 本次不變更 `PRE_LOGIN_MUSIC_GAIN = 1.0`。
- 本次不調整商城 UI、商品 API、登入驗證或其他頁面的音效策略。

## 測試策略

採 Red-Green-Refactor：

1. 先新增失敗測試，驗證語意化音檔存在並註冊為 `mall-entrance-bell`。
2. 新增失敗測試，驗證商城掛載後延遲播放，卸載時清除 timer。
3. 新增失敗測試，驗證所有商城返回入口統一走 `goLobby()`。
4. 新增失敗測試，驗證 `Mall` → `LobbyHome` 會以 `fadeIn: true` 恢復 pre-game 主題。
5. 實作最小修改使測試通過，再執行音效相關測試與 `npm run build`。

## 驗收條件

- 點擊商城時，通用點擊聲先播放。
- 商城畫面掛載約 200ms 後播放一次店門鈴。
- 快速離開商城不會延遲誤播店門鈴。
- 所有商城返回按鈕都回到大廳。
- 從商城回到大廳時，`pre-game-lobby-theme` 以 900ms 漸強恢復。
- 使用者的音效與音樂開關、音量設定持續有效。
- 前端 build 與相關音效測試通過。
