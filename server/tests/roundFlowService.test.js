import { finishTurn } from "../src/services/roundFlowService.js"

//假資料
function createState(){
    return {
        phase: "playing",
        deck: [{ id: 1, name: "Intern" }],
        discardPile: [],
        currentTurnPlayerId: 1,
        winnerPlayerId: null,
        roundWinnerPlayerId: null,
        players: [
            {
                playerId: 1,
                seatOrder: 1,
                hand: [{ id: 5, name: "PM" }],
                isProtected: false,
                isEliminated: false,
                discardedCards: [],
                roundWins: 0,
            },
            {
                playerId: 2,
                seatOrder: 2,
                hand: [{ id: 8, name: "CEO" }],
                isProtected: false,
                isEliminated: false,
                discardedCards: [],
                roundWins: 0,
            },
        ],
    }
}

describe("回合結束流程", ()=>{
    test("小局還沒結束時，會正常切換回合", ()=>{
        const state = createState()

        finishTurn(state, 1)

        expect(state.currentTurnPlayerId).toBe(2)
        expect(state.phase).toBe("playing")
    })

    test("小局結束但未有玩家累計3勝時，自動開始下一小局並保留勝場", ()=>{
        const state = createState()
        state.deck = []

        finishTurn(state, 1)

        expect(state.phase).toBe("playing")
        expect(state.winnerPlayerId).toBeNull()
        expect(state.roundWinnerPlayerId).toBeNull()
        expect(state.players[1].roundWins).toBe(1)
        expect(state.players[0].hand).toHaveLength(1)
        expect(state.players[1].hand).toHaveLength(1)
    })

    test("玩家滿3勝時，整場遊戲結束且不開始下一小局", ()=>{
        const state = createState()
        state.deck = []
        state.players[1].roundWins = 2
        
        finishTurn(state, 1)

        expect(state.phase).toBe("finished")
        expect(state.roundWinnerPlayerId).toBe(2)
        expect(state.winnerPlayerId).toBe(2)
        expect(state.players[1].roundWins).toBe(3)
    })
})