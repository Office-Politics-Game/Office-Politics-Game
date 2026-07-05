## 1. 前端互動狀態

- [x] 1.1 在 src/views/GameView.vue 或 src/components/game/GameStage.vue 導出未抽牌手牌保護狀態，使 Hand interaction is guarded before draw 在目前玩家輪到自己且 canDraw 為 true 時成立；以手動檢查 Vue props flow 驗證該狀態只在本回合尚未抽牌時為 true。
- [x] 1.2 在 src/components/game/GameStage.vue 將未抽牌手牌保護狀態納入手牌互動鎖定，使 pointerdown 不會建立 activeCard、draggingCardId 或拖曳預覽；以手動操作遊戲桌驗證未抽牌按住手牌不會開始拖曳。

## 2. 手牌提示與禁用呈現

- [x] 2.1 在 src/components/game/PlayerHand.vue 支援整體手牌 disabled title，讓保護狀態下每張可見手牌都有原生 title「請先抽下一張牌」；以瀏覽器 hover 手動驗證 title 文字顯示。
- [x] 2.2 在 src/components/game/PlayerHand.vue 讓保護狀態下所有手牌呈現禁止游標並停用 pointerdown emit，且保留既有 advisor 規則 disabled card 行為；以手動操作驗證未抽牌時不能拖曳，抽牌完成後合格手牌可恢復拖曳。
- [x] 2.3 在 src/components/game/PlayerHand.vue 將未抽牌提示調整為 hover 後直接顯示「請先抽下一張牌」文字，並移除該狀態的原生 title 與 not-allowed 游標；以 node tests\player-hand.test.mjs 和 npm.cmd run build 驗證。

## 3. 驗證

- [x] 3.1 執行 npm run build，驗證 Vue template、props 與樣式修改可成功建置。
- [x] 3.2 手動測試一局目前玩家回合：未抽牌 hover 手牌顯示「請先抽下一張牌」且不能拖曳；點牌堆抽牌後 hover 不再顯示該提示，手牌可用既有拖曳出牌流程。
