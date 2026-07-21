# 人資主管換牌動畫音效設計

## 目標

正式牌桌打出人資主管並執行手牌交換動畫時，在既有 1 秒提示結束、兩張牌開始翻轉與移動的瞬間，播放一次 `game-card-swap-whoosh-04.mp3`，讓音效與換牌動作同步。

## 範圍

### 納入範圍

- 正式牌桌的 `CardSwapAnimation` 換牌動作起點事件。
- `UseGameTableAudio` 的人資主管換牌音效命令。
- `GameStage` 的正式牌桌事件接線。
- 共享音效設定、錯誤防護及聚焦測試。

### 排除範圍

- 不修改人資主管的遊戲規則、Socket.IO 合約或後端交換流程。
- 不修改換牌動畫的視覺、時間長度與 reduced-motion 行為。
- 不讓 `CardPlayTestView` 動畫展示頁播放此音效。
- 不編輯、轉碼或裁切音效素材內容。

## 架構與資料流

`CardSwapAnimation` 維持只負責動畫時序，在一般與 reduced-motion 兩條時間軸中，於 `SWAP_PROMPT_HOLD_SECONDS` 的 1 秒停留結束後送出一次 `swap-motion-start`。事件位於後續翻牌、交換線與卡牌移動開始之前。

正式 `GameStage` 監聽 `swap-motion-start`，直接呼叫 `UseGameTableAudio.playHrCardSwapSound()`。動畫元件不 import 音效控制器，也不接收播放 callback，避免動畫展示頁自動取得正式牌桌音效。

`UseGameTableAudio` 延遲建立單一使用 `game-card-swap-whoosh-04.mp3` 的 Audio 實例。每次播放前將 `currentTime` 重設為 0，音量使用 bounded 共享 `soundVolume × 0.45`，再沿用既有安全播放 helper。

## 行為契約

- 一般動畫：1 秒提示停留結束後，先 emit `swap-motion-start` 一次，再開始兩張牌的翻轉與移動。
- Reduced-motion：同樣在 1 秒提示停留結束後 emit 一次，再套用換牌位置與翻面狀態。
- 每次有效換牌動畫只播放一次；缺少來源或目標矩形、動畫已 stale 或提早結束時不播放。
- `soundEnabled === false`、共享音量為 0、Audio API 不可用或 `play()` 同步拋錯／Promise rejection 時安靜 no-op，動畫照常完成。
- `CardPlayTestView` 不監聽 `swap-motion-start`，因此展示頁保持靜音。

## 測試策略

- 控制器測試驗證資產存在且非空、精確 import、單一 Audio、`playHrCardSwapSound()` 公開介面、從 0 秒播放、0.45 增益與安全防護。
- 動畫測試分別驗證一般與 reduced-motion 時間軸皆為 `1 秒 hold → swap-motion-start → 第一個翻牌／移動操作`，且全檔結果事件恰有兩個 emit 位置。
- 接線測試驗證 `GameStage` 取得命令並監聽事件，`CardPlayTestView` 沒有命令或 listener。
- 回歸執行牌桌音效、卡牌效果動畫測試與 production build，並確認輸出包含 `game-card-swap-whoosh-04-*.mp3`。

## 風險與處理

- 若在 `type === "swap"` 結果到達時播放，音效會比換牌動作早 1 秒；因此由動畫時間軸送出精準語意事件。
- 若直接在動畫元件播放，展示頁也會發聲；因此只讓正式 `GameStage` 接線。
- 一般與 reduced-motion 使用不同 GSAP 操作序列，容易漏掉其中一條；測試分別鎖定兩條時間軸的 emit 順序與數量。
