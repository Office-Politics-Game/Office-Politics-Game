# 正式牌桌抽牌音效設計

## 背景

正式牌桌已使用 `src/assets/audio/game-card-draw.mp3` 為初始發牌逐張播放音效，但玩家在回合中透過共用 `playDrawAnimation()` 抽牌時仍沒有音效。這次將相同音效擴充到正式牌桌內所有實際開始的抽牌動畫。

## 範圍

### 包含

- 初始發牌時，每張牌開始飛行前播放一次。
- 正式牌桌中自己或其他玩家的一般抽牌，在牌開始飛行前播放一次。
- 沿用 `soundEnabled`、`soundVolume` 與 `0.35` 增益。
- Audio API 不可用或 `play()` 被拒絕時，抽牌動畫繼續執行。

### 不包含

- `CardPlayTestView.vue` 動畫測試頁的自己抽牌／對手抽牌按鈕。
- 角色效果自行管理的動畫與音效。
- 更換音檔、調整音量增益或修改抽牌動畫速度。

## 方案比較

1. 將觸發點移入正式牌桌的共用 `playDrawAnimation()`。所有初始發牌與一般抽牌自然共用同一路徑，最不容易漏掉或重複播放。
2. 保留初始發牌觸發，並替 `playDrawAnimation()` 增加是否播放音效的旗標。控制較細，但呼叫端需要維護額外狀態，容易重複播放。
3. 在初始發牌與 socket 抽牌 handler 分別播放。觸發點分散，未來新增抽牌入口時容易漏接。

採用方案 1。

## 設計

`GameStage.vue` 繼續將 `playGameCardDealSound()` 注入 `useGameStageDrawSequence()`。`playDrawAnimation()` 先完成重入檢查、卡牌資料檢查、DOM 更新及來源／目標矩形解析；只有來源與目標都有效、確定即將呼叫 `CardDrawAnimation` 時，才播放一次音效。

`playInitialRoundDrawSequence()` 移除玩家迴圈中的直接音效呼叫，改由每次呼叫 `playDrawAnimation()` 自然觸發，確保初始發牌不會播放兩次。由 socket 觸發的自己或對手一般抽牌也會走同一函式，因此各播放一次。

動畫測試頁使用自己的 `playDrawAnimation()`，沒有注入 `playGameCardDealSound()`，所以不受影響。

## 錯誤處理

- `soundEnabled` 為 false、`soundVolume` 為 0 或 Audio API 不可用時，音效控制器維持安靜 no-op。
- `play()` Promise rejection 由既有 `playAudio()` 吸收，不等待音效完成，也不阻塞抽牌。
- 缺少來源或目標矩形時，不播放音效，並維持既有抽牌失敗回傳。

## 測試

- 更新 `tests/game-table-audio.test.mjs`，先要求共用 `playDrawAnimation()` 在矩形驗證後、實際動畫前觸發一次音效。
- 確認初始發牌玩家迴圈不再直接呼叫音效，避免雙重播放。
- 確認 `CardPlayTestView.vue` 沒有接入 `playGameCardDealSound()`。
- 執行牌桌音效、抽牌動畫、socket 動畫與 pre-game 音訊回歸測試。
- 執行 `npm run build`，確認 production build 仍輸出 `game-card-draw-*.mp3`。
