import { startNextRound } from "../src/services/roundService.js"

//假資料
function createState(){
    return {
        phase: "roundEnded",
        deck: [],
        discardPile: [{ id: 1, name: "Intern" }],
        currentTurnPlayerId: 1,
        winnerPlayerId: null,
        roundWinnerPlayerId: 2,
        players: [
            {
                playerId: 1,
                username: "玩家1",
                seatOrder: 1,
                hand: [{ id: 5, name: "PM" }],
                isProtected: true,
                isEliminated: true,
                discardedCards: [{ id: 2, name: "Cleaner" }],
                roundWins: 0,
            },
            {
                playerId: 2,
                username: "玩家2",
                seatOrder: 2,
                hand: [{ id: 8, name: "CEO" }],
                isProtected: false,
                isEliminated: false,
                discardedCards: [{ id: 1, name: "Intern" }],
                roundWins: 1,
            },
        ],
    }
}

describe("小局重置邏輯",()=>{
    test("開始下一小局時，重設小局狀態但保留勝場", ()=>{
        const state = createState()

        startNextRound(state)

        expect(state.phase).toBe("playing")
        expect(state.roundWinnerPlayerId).toBeNull()
        expect(state.discardPile).toEqual([])
        expect(state.deck.length).toBeGreaterThan(0)
        expect(state.currentTurnPlayerId).toBeTruthy()

        expect(state.players[0].hand).toHaveLength(1)
        expect(state.players[1].hand).toHaveLength(1)

        expect(state.players[0].isProtected).toBe(false)
        expect(state.players[0].isEliminated).toBe(false)
        expect(state.players[0].discardedCards).toEqual([])

        expect(state.players[0].roundWins).toBe(0)
        expect(state.players[1].roundWins).toBe(1)
    })

    test("整場遊戲已結束時，不重開下一小局", ()=>{
        const state = createState()

        state.phase = "finished"
        state.winnerPlayerId = 2

        startNextRound(state)

        expect(state.phase).toBe("finished")
        expect(state.winnerPlayerId).toBe(2)
        expect(state.roundWinnerPlayerId).toBe(2)
    })
})