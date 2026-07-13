## Why

目前 Custom room 的電腦玩家仍是前端本地假資料，遊戲開始與回合推進沒有後端裁判支援。現在已有基本抽牌、出牌、效果與回合 notice 動畫，適合重新開發一套由後端決定電腦行動、前端播放動畫後 ACK 的電腦玩家流程，避免再用固定秒數等待動畫。

## What Changes

- 新增房主在等待房間加入電腦玩家的能力，電腦玩家必須進入後端 room state，不再由 Custom room 建立 local fake player。
- 新增後端電腦玩家決策與自動回合編排：電腦抽牌、選牌、選目標、猜牌與出牌都由後端執行。
- 新增 `game:ready-for-computer-turn` socket ACK 流程，前端在既有動畫與 notice queue 完成後通知後端檢查是否輪到電腦。
- 擴充 `game:action` / `game:state` 事件合約，讓 state 可用 `afterActionId` 綁定對應動畫，前端必須等對應 action 完成後才套用 state。
- 保留 PVP 真人流程，不讓 PVE 電腦思考或動畫等待污染四真人遊戲。

## Capabilities

### New Capabilities

- `computer-player-turns`: 房間可加入後端電腦玩家，且電腦玩家可在前端動畫 ACK 後由後端自動完成抽牌與出牌回合。

### Modified Capabilities

(none)

## Impact

- Affected specs: computer-player-turns
- Affected code:
  - New: server/src/services/computerPlayerService.js, server/tests/computerPlayerService.test.js, tests/computer-player-room-flow.test.mjs, tests/computer-player-animation-ack.test.mjs
  - Modified: server/src/db/schema.sql, server/src/services/roomService.js, server/src/game/initialState.js, server/src/services/gameStateService.js, server/src/socket/roomHandlers.js, server/src/socket/gameHandlers.js, src/services/roomApi.js, src/stores/roomStore.js, src/views/CustomRoomView.vue, src/views/GameView.vue, src/components/game/ui/GameStage.vue
  - Removed: none
