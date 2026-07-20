# 實習生猜牌結果音效設計

## 目標

正式牌桌的實習生效果在揭示「猜對啦」或「猜錯啦」結果文字時，分別播放 `intern-guess-correct.mp3` 或 `intern-guess-incorrect.mp3`，讓聲音與視覺結果同步。

## 行為範圍

- `outcome === "correct"` 時播放 `intern-guess-correct.mp3`。
- `outcome === "incorrect"` 時播放 `intern-guess-incorrect.mp3`。
- 播放時機固定在一秒猜測提示結束、結果文字顯示的當下。
- 每次實習生結果動畫只播放一次對應音效。
- 音量沿用共享音效設定，使用 bounded `soundVolume × 0.45`。
- 共享音效停用、音量為 0、未知 outcome、Audio API 不可用或播放遭拒時安靜略過，不中斷動畫。

## 實作方式

`InternAnimation` 在兩條 GSAP 結果時間軸的一秒提示 hold 後、顯示 outcome 元素前 emit `outcome-reveal`，事件 payload 為 `correct` 或 `incorrect`。動畫元件只負責精確揭示時機，不直接依賴全域音效控制器。

`GameStage` 接收 `outcome-reveal`，並呼叫 `UseGameTableAudio` 新增的 `playInternGuessResultSound(outcome)`。控制器延遲建立兩個語意化 Audio 實例，依 outcome 選擇素材，從 0 秒以共享音效音量乘以 0.45 安全播放。

## 資料流

1. 正式牌桌收到實習生動畫結果，其中包含 `outcome`。
2. `InternAnimation` 先顯示猜測提示並 hold 一秒。
3. 結果文字揭示前 emit `outcome-reveal`。
4. `GameStage` 將 outcome 傳給 `playInternGuessResultSound(outcome)`。
5. 控制器依 outcome 播放一次對應音效。

## 驗證

- 先擴充 `tests/game-table-audio.test.mjs`，要求兩個資產、0.45 增益、安全設定行為、控制器介面及 `GameStage` 事件接線。
- 先擴充 `tests/card-play-interaction.test.mjs`，要求 correct 與 incorrect 時間軸都在一秒 hold 後、結果文字顯示前 emit 一次 `outcome-reveal`。
- 確認聚焦測試因功能尚未接線而失敗，再完成最小實作。
- 執行兩個相關 Node 測試與 `npm run build`。

## 不在本次範圍

- 不修改後端 outcome 判定、socket payload 或實習生遊戲規則。
- 不修改實習生動畫的文字、視覺、時長或卡牌移動流程。
- 不讓動畫展示頁自動播放此結果音效。
- 不調整目前工作區內其他牌桌音效的素材、增益或觸發時機。
