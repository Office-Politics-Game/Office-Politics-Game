## Why

小型橫向畫面的遊戲教學文字偏大，且目前四步流程只介紹牌桌核心區域，未告知新玩家遊戲設定與規則側邊欄的位置。需要在縮小手機橫向字級的同時，將教學擴充為完整六步，使玩家知道如何調整音效、離開遊戲及隨時查閱規則。

## What Changes

- 將低於 1024px 的教學標題字級由 18px 調整為 14px。
- 將低於 1024px 的「略過」字級由 18px 調整為 12px。
- 將低於 1024px 的說明內文字級由 16px 調整為 12px。
- 將低於 1024px 的上一步、下一步與完成按鈕字級由 14px 調整為 12px。
- 將既有抽牌區、手牌區、棄牌區、其他玩家的四步流程擴充為六步。
- 第 5 步錨定設定按鍵，說明可調整音效與配樂，或投降離開遊戲。
- 第 6 步錨定規則側邊欄觸發按鍵，說明可隨時查看遊戲規則。
- 小型橫向的第 4 步 tooltip 改以 viewport 底部 10px 安全距離固定定位，避免內容超出畫面下緣。
- 清除第 4 步 tooltip 的 Intro.js 預設外距，使「其他玩家」說明欄精確水平置中。
- 移除教學目標高亮框外層較粗的藍灰色實心環，只保留單一藍色 border 與藍色 glow。
- 同步移除第 4 步三個其他玩家框各自的 4px 藍灰色外環，只保留藍色 outline 與 glow。
- 將三個其他玩家框的藍色 glow spread 調整為 2px，與 2px 藍色 outline 尺寸一致。
- 將其他玩家框的 outline 向內偏移 2px，使實線位於外側 glow spread 的內層。
- 由設定與規則元件暴露 component-owned element interfaces，讓教學安全取得實際按鍵元素。
- 保留至少 1024px 的既有桌面字級，以及教學觸發條件和其他遊戲 UI 行為。
- 記錄使用者已核准小型橫向「略過」與教學導覽按鈕採用 12px，作為 Square UI 一般按鈕 14px 建議及既有「略過」與標題同字級規則的限定例外。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `all-computer-game-tutorial`: 將教學流程擴充為六步，新增設定與規則入口，並明確指定兩個橫向斷點的教學字級。

## Impact

- Affected specs: all-computer-game-tutorial
- Affected code:
  - Modified: src/composables/UseGameTutorial.js
  - Modified: src/components/game/ui/GameStage.vue
  - Modified: src/components/game/ui/GameSettingsIcon.vue
  - Modified: src/components/game/ui/GameRulesModal.vue
  - Modified: src/assets/styles/game-tutorial.css
  - Modified: tests/game-tutorial.test.mjs
  - New: none
  - Removed: none
- APIs：新增元件內部教學目標元素的 expose 介面，不變更後端或公開網路 API
- 依賴與資料模型：無變更
