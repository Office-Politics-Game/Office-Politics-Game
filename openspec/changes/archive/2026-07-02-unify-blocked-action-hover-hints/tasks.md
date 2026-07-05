## 1. 共用提示元件

- [x] 1.1 在 src/components/game/HoverBlockHint.vue 建立 shared minimal hover hint，使 Blocked-action hover hint is shared and minimal 可由手牌與牌堆共用；以新增或更新 source test 驗證元件存在、hidden-by-default 與 hover-visible class/style contract。
- [x] 1.2 在 src/components/game/PlayerHand.vue 改用 HoverBlockHint 呈現 Hand interaction is guarded before draw 的「請先抽下一張牌」提示，移除本地 disabled-message 樣式與原生 title 依賴；以 node tests\player-hand.test.mjs 驗證 hover hint contract 與 pointerdown guard。

## 2. 牌堆阻擋提示

- [x] 2.1 在 src/components/game/GameStage.vue 區分 deck disabled reason，使 Deck interaction is guarded outside the player's turn 在 viewer 不是 current turn player 時得到「還沒輪到你」訊息，且不影響目前玩家可抽牌狀態；以 source test 驗證 props flow 與 draw guard 條件。
- [x] 2.2 在 src/components/game/TableCardPiles.vue 使用 HoverBlockHint 呈現 blocked deck 訊息，並確保非回合玩家按牌堆不 emit draw；以 node tests\table-card-piles.test.mjs 驗證 blocked hint、非原生 title、非 modal、以及不 emit draw 的 source contract。

## 3. 規格與驗證

- [x] 3.1 修正 openspec/specs/hand-before-draw-guard/spec.md 的 Purpose 與「請先抽下一張牌」亂碼，使主 spec 與本 change 的 Hand interaction is guarded before draw 內容一致；以 spectra validate unify-blocked-action-hover-hints 驗證。
- [x] 3.2 執行 node tests\player-hand.test.mjs、node tests\table-card-piles.test.mjs、npm.cmd run build，驗證 shared hint、hand guard、deck guard 與 Vue build 全部通過。
