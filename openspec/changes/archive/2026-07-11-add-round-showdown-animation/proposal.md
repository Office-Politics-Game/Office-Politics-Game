## Why

牌庫耗盡後若仍有多位玩家存活，目前系統會直接判定勝者、重置下一小局並播放勝者廣播，玩家無法看見各存活者最後手牌及點數比較過程。需要在回合結果公布前加入一致的攤牌動畫，使勝負原因清楚可見，且所有玩家看到相同的動畫與廣播順序。

## What Changes

- 牌庫耗盡且最後一位玩家完成出牌後，若存活玩家多於一位，後端在重置下一小局前建立只包含存活玩家手牌與勝者的攤牌快照。
- Socket.IO 出牌 action 與 HTTP 備援回應傳遞攤牌快照，出牌確認回應以 action ID 納入既有動畫佇列，避免出牌者提早套用結果。
- 遊戲舞台在原手牌位置同步翻開存活玩家手牌，將後端指定勝者的手牌放大至 2 倍，完成放大後維持 5000 毫秒。
- 攤牌動畫完成後才套用下一小局或整場結束 state，使既有回合勝利廣播在攤牌結果展示完畢後才出現。
- 同點時沿用現行後端玩家順序判定，只強調並廣播既有規則選出的唯一勝者。

## Capabilities

### New Capabilities

- `round-showdown-animation`: 定義牌庫耗盡且多位玩家存活時的攤牌資料、動畫順序、勝者強調與延後廣播行為。

### Modified Capabilities

(none)

## Impact

- Affected specs: round-showdown-animation
- Affected code:
  - New: src/components/game/animations/RoundShowdownAnimation.vue, tests/round-showdown-animation.test.mjs
  - Modified: server/src/services/roundFlowService.js, server/src/services/gameActionService.js, server/src/controllers/actionController.js, server/src/socket/gameHandlers.js, src/composables/useGameSocketActions.js, src/components/game/ui/GameStage.vue, server/tests/roundFlowService.test.js, tests/socket-game-animation.test.mjs
  - Removed: none
- Public runtime contract: play-card action and HTTP response gain an optional showdownResult payload and play-card acknowledgements gain afterActionId; existing consumers remain compatible when these fields are absent.
- Dependencies: no new package dependency.
