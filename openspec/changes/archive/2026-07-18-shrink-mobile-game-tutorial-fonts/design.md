## Context

目前 `useGameTutorial` 只接受牌庫、手牌、棄牌與三個對手座位元素，並建立固定四步 Intro.js tour。設定按鍵與規則側邊欄觸發按鍵分別由獨立 Vue 元件擁有，父層 `GameStage` 無法直接取得其內部 DOM。這次變更同時調整小型橫向字級並新增兩個錨定步驟，因此需要界定元件介面、目標驗證與六步順序。

## Goals / Non-Goals

**Goals:**

- 教學固定依序呈現抽牌區、手牌區、棄牌區、其他玩家、設定按鍵與規則側邊欄六步。
- 新增步驟只錨定實際可操作按鍵，且缺少任一必要元素時安全地不啟動教學。
- 小型橫向標題使用 14px，「略過」、內文與導覽按鈕使用已核准的 12px，標準橫向字級維持不變。

**Non-Goals:**

- 不在教學期間自動開啟設定視窗或規則側邊欄。
- 不更改設定、投降、離開遊戲或規則側邊欄本身的行為。
- 不更改教學資格、顯示次數、結算等待或牌局流程。

## Decisions

### 以元件公開方法提供設定與規則教學目標

`GameSettingsIcon` 透過 `defineExpose` 提供 `getButtonElement()`，`GameRulesModal` 提供 `getTriggerElement()`；方法只回傳各元件擁有的實際按鈕元素。`GameStage` 保存兩個 component refs，並在 `getGameTutorialTargets()` 將 `settings` 與 `rules` 交給 composable。相較由父層使用全域 selector，component-owned interfaces 能避免樣式類名或 DOM 結構變更造成隱性耦合。

### 將設定與規則加入既有步驟建構及完整目標驗證

`GAME_TUTORIAL_STEP_CONTENT` 新增 `settings` 與 `rules` 文案，`createGameTutorialSteps()` 依既有四步之後加入兩個錨定步驟。所有單一目標與三個對手元素都通過 HTML element 驗證後才回傳六步陣列；新步驟沿用 Intro.js 自動定位，既有小型橫向牌庫、棄牌與對手定位規則保持不變。

### 僅調整小型橫向預設字級

`game-tutorial.css` 的預設標題改為 14px，「略過」、內文與導覽按鈕改為 12px；`@media (min-width: 1024px)` 內的標題與略過 22px、內文 18px、導覽按鈕 15px 宣告不變。這避免新增第三個 breakpoint，並將小型橫向的 12px「略過」與導覽按鈕限制為使用者核准的教學專用例外。

### 以 viewport 底部安全距離定位第 4 步

小型橫向的第 4 步保留專用 `game-tutorial--opponents` class，但不再使用 `translateY(120px)` 從中央向下推移。該 class 將 tooltip 固定於 viewport 底部 10px，透過 `left: 50%`、`translateX(-50%)` 與歸零 Intro.js 預設 margin 精確水平置中，並覆寫 Intro.js 計算出的 top、bottom、left 與 transform inline 定位；標準橫向仍使用既有 floating 自動定位。

### 高亮框只保留單一實心邊框

`.introjs-helperLayer` 保留 `2px solid var(--brand-hover)` 作為唯一實心邊框，移除 `0 0 0 2px rgba(134, 179, 224, 0.72)` 藍灰色外環；柔和藍色 glow 與深色 overlay shadow 維持不變。

第 4 步的三個 `.game-tutorial-opponent-highlight` 玩家框同樣移除 `0 0 0 4px rgba(134, 179, 224, 0.56)` 藍灰色外環，保留 `2px` 藍色 outline，並將藍色 glow spread 由 `8px` 改為 `2px`，使兩者尺寸一致；outline 使用 `-2px` offset 收進框內，讓外側 glow 包覆實線，`30px` 模糊半徑則維持柔光效果。

## Implementation Contract

- **Behavior:** 符合資格的教學 SHALL 依序顯示六步；第 5 步標題為「設定按鍵」，內容為「調整音效與配樂，或投降離開遊戲。」；第 6 步標題為「規則側邊欄」，內容為「隨時查看遊戲規則。」。
- **Interfaces:** `GameSettingsIcon` SHALL expose `getButtonElement()`；`GameRulesModal` SHALL expose `getTriggerElement()`；兩者回傳其元件內的按鈕 HTMLElement 或尚未掛載時的 null。
- **Failure mode:** 任一牌庫、手牌、棄牌、設定、規則目標不是 HTMLElement，或對手目標不是正好三個 HTMLElement 時，`createGameTutorialSteps()` SHALL 回傳 null，教學 SHALL 不啟動且不拋出例外。
- **Acceptance:** `node tests/game-tutorial.test.mjs` SHALL 驗證六步順序、兩段新文案、缺少新目標時安全失敗、元件公開介面與兩個斷點字級；`npm run build` SHALL 成功。
- **Compact step 4 placement:** 小型橫向的第 4 步 tooltip SHALL 固定於 viewport 底部 10px，清除預設 margin 並水平置中，且 SHALL NOT 使用向下 120px 位移；標準橫向 SHALL 保留 floating 自動定位。
- **Highlight frame:** 教學目標 SHALL 只有一層 2px 藍色實心 border，SHALL NOT 顯示額外 2px 藍灰色實心外環，並 SHALL 保留既有藍色 glow 與 overlay。
- **Opponent highlight frames:** 第 4 步的三個其他玩家框 SHALL 各只有一層向內偏移 2px 的 2px 藍色 outline，使其位於 glow 內層；SHALL NOT 顯示額外 4px 藍灰色外環，藍色 glow spread SHALL 同為 2px 且保留 30px 模糊半徑。
- **In scope:** 教學 composable、`GameStage` 目標接線、兩個元件的 DOM expose、教學 CSS 與相關測試。
- **Out of scope:** 自動點擊或展開 UI、設定與規則功能變更、後端與資料模型變更。

## Risks / Trade-offs

- [新增必要目標可能因元件尚未掛載而延後教學] → 保留既有 watcher 重試機制，只有六類目標完整時才啟動。
- [頂部設定按鍵或右側規則按鍵的 tooltip 空間有限] → 新步驟使用 Intro.js 自動定位，並以兩個橫向斷點做視覺驗證。
- [第 4 步採 viewport 固定定位可能受 Intro.js inline style 影響] → 專用 class 僅在小型橫向套用，並以 `!important` 明確覆寫定位屬性。
- [12px「略過」與導覽按鈕低於一般按鈕建議，且「略過」不再與標題同字級] → 僅套用於小型橫向教學，標準橫向仍維持標題與略過同為 22px，其他按鈕不受影響。
