import { checkRoundEnd, checkWinner } from "../src/services/winnerService.js"

//假資料
function createState() {
  return {
    phase: "playing",
    deck: [{ id: 1, name: "Intern" }],
    roundWinnerPlayerId: null,
    winnerPlayerId: null,
    players: [
      {
        playerId: 1,
        hand: [{ id: 5, name: "PM" }],
        isEliminated: false,
        roundWins: 0,
      },
      {
        playerId: 2,
        hand: [{ id: 8, name: "CEO" }],
        isEliminated: false,
        roundWins: 0,
      },
      {
        playerId: 3,
        hand: [{ id: 1, name: "Intern" }],
        isEliminated: true,
        roundWins: 0,
      },
    ],
  }
}

describe("贏家判定邏輯", ()=>{
    test("只剩一名未出局玩家時，當輪遊戲結束", ()=>{
        const state = createState()
        state.players[1].isEliminated = true

        expect(checkRoundEnd(state)).toBe(true)
    })

    test("當牌庫抽完時，當輪遊戲結束", ()=>{
        const state = createState()
        state.deck = []

        expect(checkRoundEnd(state)).toBe(true)
    })

    test("還有多名玩家存活，且牌庫未空時，當輪遊戲繼續", ()=>{
        const state = createState()

        expect(checkRoundEnd(state)).toBe(false)
    })

    test("還未滿足遊戲勝利條件時，不回傳贏家", ()=>{
        const state = createState()

        expect(checkWinner(state)).toBeNull()
    })

    test("當輪只剩一名玩家未出局時，該玩家獲勝", ()=>{
        const state = createState()
        state.players[1].isEliminated = true

        const winner = checkWinner(state)

        expect(winner.playerId).toBe(1)
        expect(winner.roundWins).toBe(1)
        expect(state.phase).toBe("roundEnded")
    })

    test("當牌庫被抽完時，剩餘玩家手牌點數最高者獲得當輪勝利", ()=>{
        const state = createState()
        state.deck = []

        const winner = checkWinner(state)

        expect(winner.playerId).toBe(2)
        expect(winner.roundWins).toBe(1)
        expect(state.phase).toBe("roundEnded")
    })

    test("重複呼叫checkWinner時，不會重複增加勝場", ()=>{
      const state = createState()
      state.deck = []

      const first = checkWinner(state)
      const second = checkWinner(state)

      const winnerPlayer = state.players.find((player)=>{
        return player.playerId === 2
      })

      expect(first.playerId).toBe(2)
      expect(second.playerId).toBe(2)
      expect(winnerPlayer.roundWins).toBe(1)
      expect(state.roundWinnerPlayerId).toBe(2)
    })

    test("當玩家取得3輪遊戲勝利時，整場遊戲結束", ()=>{
        const state = createState()
        state.deck = []
        state.players[1].roundWins = 2

        const winner = checkWinner(state)

        expect(winner.playerId).toBe(2)
        expect(winner.roundWins).toBe(3)
        expect(state.phase).toBe("finished")
        expect(state.winnerPlayerId).toBe(2)
    })
})