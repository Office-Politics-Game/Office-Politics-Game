import { readFile } from "node:fs/promises"
import { getPublicState } from "../src/services/gameStateService.js"

function createState(hasAnyCardBeenPlayed){
    return {
        phase: "playing",
        deck: [],
        discardPile: [],
        hasAnyCardBeenPlayed,
        currentTurnPlayerId: 1,
        roundWinnerPlayerId: null,
        winnerPlayerId: null,
        players: [{
            playerId: 1,
            username: "玩家",
            level: 7,
            seatOrder: 1,
            hand: [],
            discardedCards: [],
            roundWins: 0,
        }],
    }
}

describe("教學出牌狀態", ()=>{
    test("公開狀態將舊資料缺值正規化為 false", ()=>{
        expect(getPublicState(createState(undefined), 1).hasAnyCardBeenPlayed).toBe(false)
    })

    test("公開狀態保留成功出牌旗標", ()=>{
        expect(getPublicState(createState(true), 1).hasAnyCardBeenPlayed).toBe(true)
    })

    test("playCardAction 只在棄牌成功檢查之後設定旗標", async ()=>{
        const source = await readFile(
            new URL("../src/services/gameActionService.js", import.meta.url),
            "utf8",
        )
        const failureGuard = source.indexOf("if (!discardedCard)")
        const flagAssignment = source.indexOf("state.hasAnyCardBeenPlayed = true")

        expect(failureGuard).toBeGreaterThan(-1)
        expect(flagAssignment).toBeGreaterThan(failureGuard)
    })
})

describe("public game state player profile data", ()=>{
    test("keeps player levels", ()=>{
        expect(getPublicState(createState(true), 1).players[0].level).toBe(7)
    })
})
