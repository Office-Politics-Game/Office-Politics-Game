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

    test("uses injected random to select any eligible target", () => {
        const state = createState()
        const player = getCurrentTurnPlayer(state)
        const card = { id: 1, name: "Intern" }

        expect(chooseTargetPlayerId(state, player, card, { random: () => 0 })).toBe(2)
        expect(chooseTargetPlayerId(state, player, card, { random: () => 0.999 })).toBe(3)
    })

    test("excludes the acting player and eliminated players for opponent cards", () => {
        const state = createState()
        const player = getCurrentTurnPlayer(state)

        state.players[1].isEliminated = true

        expect(chooseTargetPlayerId(
            state,
            player,
            { id: 1, name: "Intern" },
            { random: () => 0 }
        )).toBe(3)
    })

    test("allows PM to select the acting computer player", () => {
        const state = createState()
        const player = getCurrentTurnPlayer(state)

        expect(chooseTargetPlayerId(
            state,
            player,
            { id: 5, name: "PM" },
            { random: () => 0 }
        )).toBe(1)
    })

    test("returns undefined when no eligible target exists", () => {
        const state = createState({
            players: [
                {
                    playerId: 1,
                    isComputer: true,
                    isEliminated: false,
                    hand: [{ id: 1, name: "Intern" }],
                },
            ],
        })
        const player = getCurrentTurnPlayer(state)

        expect(chooseTargetPlayerId(
            state,
            player,
            { id: 1, name: "Intern" },
            { random: () => 0 }
        )).toBeUndefined()
    })

    test.each([
        ["CEO", { id: 8, name: "CEO" }, ["Adviser", "HR", "PM", "Senior", "Manager", "Cleaner"]],
        ["Adviser", { id: 7, name: "Adviser" }, ["CEO", "HR", "PM", "Senior", "Manager", "Cleaner"]],
        ["HR", { id: 6, name: "HR" }, ["CEO", "Adviser", "PM", "Senior", "Manager", "Cleaner"]],
        ["Manager", { id: 3, name: "Manager" }, ["CEO", "Adviser", "HR", "PM", "Senior", "Manager", "Cleaner"]],
        ["PM", { id: 5, name: "PM" }, ["CEO", "Adviser", "HR", "PM", "Senior", "Manager", "Cleaner"]],
        ["Intern", { id: 1, name: "Intern" }, ["CEO", "Adviser", "HR", "PM", "Senior", "Manager", "Cleaner"]],
    ])(
        "randomizes Intern guesses while respecting a held %s card",
        (_cardName, heldCard, expectedNames) => {
            const state = createState()
            state.players[0].hand = [
                { id: 1, name: "Intern" },
                heldCard,
            ]
            const player = getCurrentTurnPlayer(state)
            const guesses = expectedNames.map((_, index) => {
                return buildPlayPayload(
                    state,
                    player,
                    { id: 1, name: "Intern" },
                    { random: () => (index + 0.5) / expectedNames.length }
                ).guessedCardName
            })

            expect(new Set(guesses)).toEqual(new Set(expectedNames))
        }
    )
})
