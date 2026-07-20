# 自訂房間等待室按鈕音效設計

## 目標

讓自訂房間等待室內所有可用按鈕統一播放既有的 `login-button-click` 音效，並沿用目前的共享音效設定。

## 行為範圍

- 複製房號、玩家槽操作、邀請好友視窗、返回大廳與開始遊戲等可用按鈕播放點擊音。
- `<button>` 與 `role="button"` 控制項都套用相同行為。
- 已停用或標示 `aria-disabled="true"` 的控制項不播放。
- 輸入框與一般非按鈕內容不播放。
- 不新增或替換音效素材。

## 實作方式

在 `CustomRoomView.vue` 使用既有 `useButtonClickAudio()`，並於等待室頁面的根節點透過 `@click.capture="handleButtonClick"` 進行事件委派。由共用處理器尋找最近的按鈕控制項、排除停用狀態，再透過 `usePreGameAudio()` 播放 `login-button-click`。因此頁面本身、玩家列表與邀請視窗中的按鈕都不需要逐一重複串接。

## 音效設定與錯誤處理

沿用 `UseAudioSettings` 的音效開關與音量。瀏覽器無法播放或拒絕播放時，沿用既有安全播放行為，不阻擋等待室操作。

## 驗證

- 先擴充 `tests/pre-game-audio.test.mjs`，要求 `CustomRoomView.vue` 使用共用按鈕音效處理器並在根節點接上 capture listener。
- 確認測試因等待室尚未接線而失敗，再完成最小實作。
- 執行 `node tests/pre-game-audio.test.mjs` 與 `npm run build`。

## 不在本次範圍

- 修改等待室版面、按鈕樣式或房間流程。
- 為特定按鈕新增不同音效。
- 調整其他頁面的按鈕音效接線。
