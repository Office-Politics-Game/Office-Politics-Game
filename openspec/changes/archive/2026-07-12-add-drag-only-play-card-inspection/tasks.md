## 1. 手勢與權限

- [x] 1.1 實作「以六像素手勢門檻延遲拖曳」與「Hand card gestures distinguish inspection from play」：短點擊只切換檢視，超過 6px 才拖曳，且手牌拖曳落點外復位；以 `node tests\card-play-interaction.test.mjs` 驗證。
- [x] 1.2 實作「檢視權限與出牌權限分離」與「Inspection remains available when play is blocked」：禁止出牌時仍可開啟檢視但不產生拖曳預覽、動畫或 emit；以 `node tests\player-hand.test.mjs` 與 card-play interaction blocked-state cases 驗證。

## 2. 中央檢視與視覺

- [x] 2.1 依「中央檢視由獨立 overlay 呈現」完成「Centered card inspection is dismissible and draggable」：再次點牌、遮罩、Escape 可關閉，中央拖曳失敗回中央、成功走既有流程；以 overlay source assertions 與 `node tests\card-play-interaction.test.mjs` 驗證。
- [x] 2.2 依「CSS 變數驅動中央景深」完成「Inspected card provides layered pointer depth」：中央卡輸出正規化 pointer 變數、不同背景／框架 transform，並提供 reduced-motion neutral fallback；以 `node tests\player-hand.test.mjs` 與 `npm run build` 驗證。

## 3. 整合與回歸

- [x] 3.1 依「共用既有出牌管線」完成「Game stage refactor preserves runtime contract」：維持 `GameStage` 公開契約、目標／猜牌流程與 `play-card` payload，並處理卡片移除、pending choice 與卸載清理；以 `node tests\cardplay-target-selection.test.mjs`、`node tests\card-play-interaction.test.mjs` 與 `npm run build` 驗證。

## 4. 放大互動游標

- [x] 4.1 依「放大 pointer 與 grab 自訂游標」完成「Hand cards use enlarged interaction cursors」：提供 32×32 pointer、grab、grabbing SVG 游標與原生 fallback，依抽牌前、可拖曳、按下狀態切換，且不縮放卡牌；以 `node tests\player-hand.test.mjs` 與 `npm run build` 驗證。
