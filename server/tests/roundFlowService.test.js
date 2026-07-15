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

        const result = finishTurn(state, 1)

        expect(state.currentTurnPlayerId).toBe(2)
        expect(state.phase).toBe("playing")
        expect(result.state).toBe(state)
        expect(result.showdownResult).toBeNull()
    })

    test("牌庫耗盡時會在開始下一小局前保存攤牌快照", ()=>{
        const state = createState()
        state.deck = []

        const result = finishTurn(state, 1)

        expect(state.phase).toBe("playing")
        expect(state.winnerPlayerId).toBeNull()
        expect(state.roundWinnerPlayerId).toBeNull()
        expect(state.players[1].roundWins).toBe(1)
        expect(state.players[0].hand).toHaveLength(1)
        expect(state.players[1].hand).toHaveLength(1)
        expect(result.showdownResult).toEqual({
            reason: "deck-empty",
            winnerPlayerId: 2,
            players: [
                { playerId: 1, card: { id: 5, name: "PM" } },
                { playerId: 2, card: { id: 8, name: "CEO" } },
            ],
        })
    })

    test("攤牌快照只包含未淘汰玩家", ()=>{
        const state = createState()
        state.deck = []
        state.players.push({
            playerId: 3,
            seatOrder: 3,
            hand: [{ id: 7, name: "Advisor" }],
            isProtected: false,
            isEliminated: true,
            discardedCards: [],
            roundWins: 0,
        })

        const result = finishTurn(state, 1)

        expect(result.showdownResult.players).toHaveLength(2)
        expect(result.showdownResult.players.map((player)=>player.playerId)).toEqual([1, 2])
    })

    test("最高點數同點時沿用既有玩家順序選出的勝者", ()=>{
        const state = createState()
        state.deck = []
        state.players[0].hand = [{ id: 8, name: "CEO" }]

        const result = finishTurn(state, 1)

        expect(result.showdownResult.winnerPlayerId).toBe(1)
        expect(result.showdownResult.players).toEqual([
            { playerId: 1, card: { id: 8, name: "CEO" } },
            { playerId: 2, card: { id: 8, name: "CEO" } },
        ])
    })

    test("只剩一名玩家存活時不建立攤牌快照", ()=>{
        const state = createState()
        state.players[1].isEliminated = true

        const result = finishTurn(state, 1)

        expect(result.showdownResult).toBeNull()
    })

    test("玩家滿3勝時，整場遊戲結束且不開始下一小局", ()=>{
        const state = createState()
        state.deck = []
        state.players[1].roundWins = 2
        
        const result = finishTurn(state, 1)

        expect(state.phase).toBe("finished")
        expect(state.roundWinnerPlayerId).toBe(2)
        expect(state.winnerPlayerId).toBe(2)
        expect(state.players[1].roundWins).toBe(3)
        expect(result.showdownResult.winnerPlayerId).toBe(2)
    })
})
