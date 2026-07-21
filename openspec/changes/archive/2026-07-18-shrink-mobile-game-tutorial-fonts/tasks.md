## 1. 小型橫向字級與六步教學實作

- [x] 1.1 實作 `Tutorial presentation follows Square UI and responsive rules` 與「僅調整小型橫向預設字級」：在 `src/assets/styles/game-tutorial.css` 將低於 1024px 的標題設為 14px，「略過」、內文與導覽按鈕設為 12px，且不變更 `@media (min-width: 1024px)` 的標題與略過 22px、內文 18px、導覽按鈕 15px；以 CSS 差異檢查確認四個預設 `font-size` 宣告分別符合 14px／12px／12px／12px。
- [x] 1.2 實作 `Tutorial fails safely when UI targets are unavailable` 與「以元件公開方法提供設定與規則教學目標」：讓 `GameSettingsIcon` expose `getButtonElement()`、`GameRulesModal` expose `getTriggerElement()`，並由 `GameStage` 將兩個 HTMLElement 傳入教學 targets；以 `node tests/game-tutorial.test.mjs` 驗證公開介面存在，且缺少任一新目標時教學不啟動。
- [x] 1.3 實作 `Tutorial follows the gameplay-area sequence` 與「將設定與規則加入既有步驟建構及完整目標驗證」：在 `UseGameTutorial.js` 將 tour 固定擴充為六步，第 5 步使用「設定按鍵／調整音效與配樂，或投降離開遊戲。」，第 6 步使用「規則側邊欄／隨時查看遊戲規則。」，且不自動開啟兩個介面；以 `node tests/game-tutorial.test.mjs` 驗證順序、文案、錨定元素數量與完整目標驗證。
- [x] 1.4 實作「以 viewport 底部安全距離定位第 4 步」：在 `src/assets/styles/game-tutorial.css` 將小型橫向 `game-tutorial--opponents` tooltip 固定於 viewport 底部 10px 並水平置中，移除向下 120px 位移且不影響標準橫向 floating 定位；以 `node tests/game-tutorial.test.mjs` 驗證 bottom、水平置中、定位覆寫與不存在 `translateY(120px)`。
- [x] 1.5 實作「高亮框只保留單一實心邊框」：在 `src/assets/styles/game-tutorial.css` 移除 `.introjs-helperLayer` 的 `0 0 0 2px rgba(134, 179, 224, 0.72)` 藍灰色外環，保留 2px 藍色 border、藍色 glow 與 overlay；以 `node tests/game-tutorial.test.mjs` 驗證外環宣告不存在且其餘三項效果仍存在。
- [x] 1.6 實作「其他玩家框只保留單一 outline」：在 `src/assets/styles/game-tutorial.css` 移除 `.game-tutorial-opponent-highlight` 的 `0 0 0 4px rgba(134, 179, 224, 0.56)` 藍灰色外環，保留 2px 藍色 outline 與藍色 glow；以 `node tests/game-tutorial.test.mjs` 驗證三個玩家框共用樣式不再包含外環且 outline、glow 仍存在。
- [x] 1.7 實作「其他玩家說明欄置中」：在小型橫向 `.game-tutorial--opponents` 清除 Intro.js 預設 margin，搭配既有 `left: 50%` 與 `translateX(-50%)` 精確水平置中，並維持 viewport 底部 10px；以 `node tests/game-tutorial.test.mjs` 驗證 margin 歸零與置中定位。
- [x] 1.8 實作「其他玩家 outline 與 glow 尺寸一致」：將 `.game-tutorial-opponent-highlight` 的藍色 glow spread 由 8px 改為 2px，與 2px 藍色 outline 一致並保留 30px 模糊半徑；以 `node tests/game-tutorial.test.mjs` 驗證新舊尺寸宣告。
- [x] 1.9 實作「outline 位於 glow spread 內層」：將 `.game-tutorial-opponent-highlight` 的 `outline-offset` 改為 -2px，使 2px 實線收進框內、外側 2px glow 包覆實線；以 `node tests/game-tutorial.test.mjs` 驗證新舊 offset 宣告。

## 2. 驗證

- [x] 2.1 執行 `node tests/game-tutorial.test.mjs` 與 `npm run build`，確認六步教學及樣式可成功測試與建置；再以小型橫向與至少 1024px 畫面檢查六個步驟無文字、按鈕或 tooltip 溢出重疊，第 4 步與 viewport 底部保持 10px、略過維持單行，新步驟正確指向設定與規則按鍵，且桌面字級與呈現不變。
