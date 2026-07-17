import {
    buildPlayPayload,
    chooseCardToPlay,
    chooseTargetPlayerId,
    getCurrentTurnPlayer,
} from "../src/services/computerPlayerService.js"

function createState(overrides = {}) {
    return {
        phase: "playing",
        roomCode: "ROOM01",
        currentTurnPlayerId: 1,
        players: [
            {
                playerId: 1,
                username: "Computer 1",
                isComputer: true,
                isEliminated: false,
                hand: [
                    { id: 8, name: "CEO" },
                    { id: 1, name: "Intern" },
                ],
            },
            {
                playerId: 2,
                username: "Human 1",
                isComputer: false,
                isEliminated: false,
                isProtected: false,
                hand: [{ id: 4, name: "Senior" }],
            },
            {
                playerId: 3,
                username: "Human 2",
                isComputer: false,
                isEliminated: false,
                isProtected: false,
                hand: [{ id: 5, name: "PM" }],
            },
        ],
        ...overrides,
    }
}

describe("computerPlayerService decision helpers", () => {
    test("finds the current computer turn player", () => {
        const state = createState()

        expect(getCurrentTurnPlayer(state).playerId).toBe(1)
    })

    test("prioritizes low cards and keeps CEO as the last choice", () => {
        const state = createState()
        const player = getCurrentTurnPlayer(state)

        expect(chooseCardToPlay(state, player)).toEqual({ id: 1, name: "Intern" })
    })

    test("prefers the drawn card when it is playable", () => {
        const state = createState({
            players: [
                {
                    playerId: 1,
                    username: "Computer 1",
                    isComputer: true,
                    isEliminated: false,
                    hand: [
                        { id: 4, name: "Senior" },
                        { id: 1, name: "Intern" },
                    ],
                },
                {
                    playerId: 2,
                    isEliminated: false,
                    hand: [{ id: 8, name: "CEO" }],
                },
            ],
        })
        const player = getCurrentTurnPlayer(state)

        expect(chooseCardToPlay(state, player, 4)).toEqual({ id: 4, name: "Senior" })
    })

    test("obeys Advisor rule when Advisor is held with PM or HR", () => {
        const state = createState({
            players: [
                {
                    playerId: 1,
                    isComputer: true,
                    isEliminated: false,
                    hand: [
                        { id: 7, name: "Adviser" },
                        { id: 5, name: "PM" },
                    ],
                },
                {
                    playerId: 2,
                    isEliminated: false,
                    hand: [{ id: 4, name: "Senior" }],
                },
            ],
        })
        const player = getCurrentTurnPlayer(state)

        expect(chooseCardToPlay(state, player)).toEqual({ id: 7, name: "Adviser" })
    })

    test("selects the first legal target for target cards", () => {
        const state = createState()
        const player = getCurrentTurnPlayer(state)

        expect(chooseTargetPlayerId(state, player, { id: 1, name: "Intern" })).toBe(2)
    })

    test("skips eliminated targets", () => {
        const state = createState()
        state.players[1].isEliminated = true
        const player = getCurrentTurnPlayer(state)

        expect(chooseTargetPlayerId(state, player, { id: 1, name: "Intern" })).toBe(3)
    })

    test("builds Intern play payload with fixed CEO guess", () => {
        const state = createState()
        const player = getCurrentTurnPlayer(state)

        expect(buildPlayPayload(state, player, { id: 1, name: "Intern" })).toMatchObject({
            roomCode: "ROOM01",
            playerId: 1,
            cardId: 1,
            targetPlayerId: 2,
            guessedCardName: "CEO",
        })
    })
})
