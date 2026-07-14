## Context

目前 `PlayerHand` 只轉送 pointerdown，`useGameStageCardPlay` 立即隱藏原牌並開始 window 級拖曳。出牌落點已由 `TableCardPiles` 的 play zone rectangle 定義；新功能必須重用該契約，並維持後續目標選擇、猜牌與 `play-card` payload。

## Goals / Non-Goals

**Goals:**

- 明確區分短點擊與拖曳，避免點擊誤出牌。
- 提供中央卡牌檢視、關閉操作、視差景深及由中央拖曳出牌。
- 禁止出牌時仍可閱讀卡面，並符合 Square UI、RWD 與 reduced-motion。

**Non-Goals:**

- 不修改後端規則、Socket/API、play-card payload 或目標／猜牌流程。
- 不將視差套用至一般手牌、棄牌堆或其他動畫卡牌。
- 不變更既有 play zone 幾何來源。

## Decisions

### 以六像素手勢門檻延遲拖曳

pointerdown 僅記錄候選卡牌、起點與來源；移動距離超過 6px 才進入拖曳並隱藏來源卡牌。pointerup 前未超過門檻視為點擊並切換中央檢視。相較以 click 與 pointerdown 同時監聽，此作法可避免瀏覽器合成 click 與拖曳競態。

### 中央檢視由獨立 overlay 呈現

`CardInspectionOverlay` 負責固定定位、遮罩、Esc、卡外關閉、pointer 視差與中央卡 pointer 事件；`GameStage` 綁定 composable 狀態。相較直接把手牌 DOM 移到中央，overlay clone 不會破壞扇形排列與抽牌動畫的 rectangle 量測。

### 共用既有出牌管線

手牌與中央檢視都呼叫相同 gesture handler，並攜帶 `hand` 或 `inspection` 來源。成功落入 play zone 均呼叫既有 `playActiveCard`；失敗則依來源回手牌或保留中央檢視。中央來源使用 overlay 卡牌 rectangle 作為動畫起點。

### 檢視權限與出牌權限分離

只要卡牌仍在手牌就可開啟檢視；回合、抽牌要求、動畫鎖定與 Advisor 規則只阻止拖曳進入 active play。若狀態在 pointerdown 後變為不可出牌，pointer move/up 取消拖曳但保留適當檢視狀態。

### CSS 變數驅動中央景深

overlay 根據卡牌中心計算 -1 至 1 的 pointer 座標並輸出 `--pointer-x`、`--pointer-y`。外層限制 rotateX/rotateY，`GameCard` 在 inspection 模式將背景層反向平移並以較低 translateZ 呈現，框架使用較高 translateZ。reduced-motion 將變數與旋轉歸零。

### 放大 pointer 與 grab 自訂游標

瀏覽器無法用 CSS 放大原生系統游標，因此新增 32×32 SVG pointer、grab、grabbing 游標資產，並在 `PlayerHand` 以 `url(...) hotspot, native-keyword` 提供 fallback。抽牌前 interaction-disabled 狀態使用較大的 pointer，正常可拖曳狀態使用 grab，按下時使用 grabbing；不對卡牌本身套用 hover scale。

## Implementation Contract

- 短點擊卡牌只開啟或關閉中央檢視，絕不啟動出牌動畫或送出 `play-card`。
- pointer 從起點移動距離必須大於 6px 才進入拖曳；放開時 pointer 必須位於既有 play zone rectangle 內才可出牌。
- 手牌拖曳失敗須回復手牌；中央檢視拖曳失敗須回復中央檢視。成功後沿用既有 animation、pending choices、discard preview 與 payload。
- 中央檢視可由再次點牌、遮罩點擊或 Escape 關閉；卡牌離開手牌、成功出牌、進入 pending choice 或元件卸載時亦須清理。
- 禁止出牌狀態仍允許點擊檢視，但不得顯示拖曳預覽、播放出牌動畫或 emit `play-card`。
- 中央卡才啟用 pointer CSS variables、傾斜及背景／框架雙層錯位；reduced-motion 停用即時視差。
- 尚未抽牌時的手牌必須顯示 32×32 pointer 自訂游標；可拖曳與按下狀態分別顯示 32×32 grab 與 grabbing 自訂游標，載入失敗時回退至對應原生 cursor，且卡牌本身不得因這項調整縮放。
- `GameStage` props/emits/expose 與 `play-card` payload 不變；後端與 Socket 不在範圍內。
- 驗收必須通過 player-hand、card-play-interaction、cardplay-target-selection 測試及 `npm run build`。

## Risks / Trade-offs

- [Risk] overlay 與全域 pointer listeners 同時處理事件造成重複關閉 → overlay 卡牌阻止遮罩 click 冒泡，composable 集中清理 listener。
- [Risk] 拖曳開始前仍顯示手牌會有輕微延遲 → 6px 門檻刻意換取可靠點擊辨識。
- [Risk] viewport resize 使量測失效 → pointer move/up 時重新取得 play zone，中央拖曳起點在 pointerdown 當下量測。
