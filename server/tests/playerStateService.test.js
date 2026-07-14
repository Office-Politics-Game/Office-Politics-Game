import {
    findPlayer,
    killPlayer,
    protectPlayer,
    clearProtection,
    clearPlayerProtection,
} from "../src/services/playerStateService.js"

function createState() {
    return {
        discardPile: [],
        players: [
        {
            playerId: 1,
            username: "玩家一",
            isProtected: false,
            isEliminated: false,
            hand: [{ id: 1, name: "Intern" }],
            discardedCards: [],
        },
        {
            playerId: 2,
            username: "玩家二",
            isProtected: true,
            isEliminated: false,
            hand: [{ id: 5, name: "PM" }],
            discardedCards: [],
        },
        ],
    }
}

describe("findPlayer", () => {
    test("用 playerId 找到玩家", () => {
        const state = createState()
        const player = findPlayer(state, 1)

        expect(player.username).toBe("玩家一")
    })

    test("找不到玩家時回傳 undefined", () => {
        const state = createState()
        const player = findPlayer(state, 999)

        expect(player).toBeUndefined()
    })
})

describe("killPlayer", () => {
    test("淘汰指定玩家", () => {
        const state = createState()
        const player = killPlayer(state, 1)

        expect(player.isEliminated).toBe(true)
        expect(state.players[0].isEliminated).toBe(true)
        expect(state.players[0].hand).toEqual([])
        expect(state.players[0].discardedCards).toEqual([{ id: 1, name: "Intern" }])
        expect(state.discardPile).toEqual([{ id: 1, name: "Intern" }])
    })

    test("淘汰時依序棄掉所有剩餘手牌", () => {
        const state = createState()
        state.players[0].hand = [
            { id: 1, name: "Intern" },
            { id: 5, name: "PM" },
        ]

        killPlayer(state, 1)

        expect(state.players[0].hand).toEqual([])
        expect(state.players[0].discardedCards).toEqual([
            { id: 1, name: "Intern" },
            { id: 5, name: "PM" },
        ])
        expect(state.discardPile).toEqual([
            { id: 1, name: "Intern" },
            { id: 5, name: "PM" },
        ])
    })

    test("重複淘汰不會重複加入棄牌", () => {
        const state = createState()

        killPlayer(state, 1)
        killPlayer(state, 1)

        expect(state.players[0].hand).toEqual([])
        expect(state.players[0].discardedCards).toEqual([{ id: 1, name: "Intern" }])
        expect(state.discardPile).toEqual([{ id: 1, name: "Intern" }])
    })

    test("找不到玩家時回傳 null", () => {
        const state = createState()
        const player = killPlayer(state, 999)

        expect(player).toBeNull()
    })
})

describe("protectPlayer", () => {
    test("設定指定玩家保護狀態", () => {
        const state = createState()
        const player = protectPlayer(state, 1)

        expect(player.isProtected).toBe(true)
        expect(state.players[0].isProtected).toBe(true)
    })
})

describe("clearProtection", () => {
    test("清除所有玩家的保護狀態", () => {
        const state = createState()

        clearProtection(state)

        expect(state.players[0].isProtected).toBe(false)
        expect(state.players[1].isProtected).toBe(false)
    })
})

describe("clearPlayerProtection", () => {
    test("只清除指定玩家的保護狀態", () => {
        const state = createState()
        state.players[0].isProtected = true

        clearPlayerProtection(state, 2)

        expect(state.players[0].isProtected).toBe(true)
        expect(state.players[1].isProtected).toBe(false)
    })
})
