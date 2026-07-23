# 牌桌 UI 點擊音效設計

## 目標

牌桌開始後，所有屬於選擇或設定操作的可用按鈕，統一播放既有的 `login-button-click` 音效，包括選單選項、玩家頭像目標、右上角設定齒輪，以及設定視窗內的按鈕。

## 範圍

- 牌桌內可點選的選單項目與確認／取消操作。
- 選擇玩家目標時可點選的頭像區域。
- 右上角設定齒輪。
- 設定視窗的關閉、音樂／音效開關、返回大廳、重新開始，以及確認／取消按鈕。
- 音量滑桿不是按鈕，不播放點擊音效。
- 停用按鈕與 `aria-disabled="true"` 控制不播放音效。
- 音效設定關閉時維持靜音；點擊「開啟音效」當下不播放，後續符合條件的點擊才播放。

## 實作方式

沿用 `UseButtonClickAudio` 的事件代理，不在每個按鈕重複呼叫播放函式：

1. 在 `GameStage` 的牌桌根節點掛載 capture click handler，涵蓋牌桌子樹內的按鈕與 `role="button"` 控制。
2. `GameSettingsModal` 使用 `Teleport` 掛到 `body`，不在牌桌根節點的 DOM 子樹內，因此在設定視窗 overlay 另掛同一個 capture click handler。
3. 共用 handler 仍呼叫 `playPreGameSound("login-button-click")`，沿用既有音效啟用狀態、音量與安全播放處理。

這個邊界可涵蓋目前與未來在上述兩個 UI 子樹新增的按鈕，同時避免把牌桌音效需求擴散成全站監聽。

## 失敗與邊界行為

- 點擊非按鈕元素不播放。
- 點擊停用控制不播放。
- 音效關閉、音量為零、瀏覽器不支援 Audio，或播放 Promise 被拒絕時，沿用共用音效控制器的安靜 no-op 行為。
- 單次點擊只由所屬 UI 根節點處理一次；設定視窗因 Teleport 與牌桌根節點互斥，不會重複播放。

## 測試與驗收

採 Red-Green-Refactor：

1. 先新增聚焦測試，要求 `GameStage` 與 `GameSettingsModal` 都使用 `UseButtonClickAudio` 並掛上 capture handler。
2. 執行聚焦測試，確認因接線尚未存在而失敗。
3. 加入最小接線後重新執行，確認測試通過。
4. 執行既有前置音效測試與牌桌音效測試。
5. 執行 `npm run build`，確認 Vue production build 成功。

驗收結果應為：上述可用按鈕各在單次點擊播放一次 `login-button-click`，且不改變既有選擇、設定、導頁或遊戲操作行為。
