import { endTurn } from "../src/services/turnService.js"

//假資料
function createState() {
  return {
    deck: [{ id: 1, name: "Intern" }],
    currentTurnPlayerId: 1,
    players: [
      {
        playerId: 1,
        hand: [{ id: 5, name: "PM" }],
        isEliminated: false,
        isProtected: false,
      },
      {
        playerId: 2,
        hand: [{ id: 6, name: "HR" }],
        isEliminated: false,
        isProtected: true,
      },
      {
        playerId: 3,
        hand: [{ id: 1, name: "Intern" }],
        isEliminated: true,
        isProtected: false,
      },
    ],
  }
}

describe("回合輪替邏輯", ()=>{
    test("回合結束會輪到下一位未出局玩家", ()=>{
        const state =  createState()
        endTurn(state, 1)
        
        expect(state.currentTurnPlayerId).toBe(2)
    })

    test("切換回合時會跳過已出局的玩家", ()=>{
        const state = createState()

        state.currentTurnPlayerId = 2
        endTurn(state ,2)

        expect(state.currentTurnPlayerId).toBe(1)
    })

    test("切換下一位玩家時，要清除該玩家保護狀態", ()=>{
        const state = createState()
        endTurn(state, 1)

        expect(state.players[1].isProtected).toBe(false)
    })

    test("找不到目前玩家時，不改變狀態", ()=>{
        const state = createState()
        endTurn(state, 99)

        expect(state.currentTurnPlayerId).toBe(1)
    })

    test("當輪遊戲已結束，不再切換玩家", ()=>{
        const state = createState()

        state.deck = []
        endTurn(state, 1)

        expect(state.currentTurnPlayerId).toBe(1)
    })
})