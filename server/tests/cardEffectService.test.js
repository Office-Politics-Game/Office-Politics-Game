import {
    runCardEffect,
    useIntern,
    useCleaner,
    useManager,
    useVeteran,
    usePm,
    useHr,
    useCeo,
    checkGuess,
} from "../src/services/cardEffectService.js"

function createState() {
    return {
        deck: [
        { id: 2, name: "Cleaner" },
        { id: 1, name: "Intern" },
        ],
        discardPile: [],
        players: [
        {
            playerId: 1,
            username: "玩家一",
            hand: [{ id: 3, name: "Manager" }],
            isProtected: false,
            isEliminated: false,
        },
        {
            playerId: 2,
            username: "玩家二",
            hand: [{ id: 5, name: "PM" }],
            isProtected: false,
            isEliminated: false,
        },
        {
            playerId: 3,
            username: "玩家三",
            hand: [{ id: 5, name: "PM" }],
            isProtected: true,
            isEliminated: false,
        },
        ],
    }
}

describe("useCleaner", () => {
    test("回傳目標玩家手牌", () => {
        const state = createState()
        const hand = useCleaner(state, 2)

        expect(hand).toEqual([{ id: 5, name: "PM" }])
    })

    test("目標玩家受保護時回傳 null", () => {
            const state = createState()
            const hand = useCleaner(state, 3)

            expect(hand).toBeNull()
    })
})

describe("useIntern", () => {
    test("猜中目標玩家手牌時淘汰目標", () => {
        const state = createState()
        const player = useIntern(state, 2, "PM")

        expect(player.isEliminated).toBe(true)
        expect(state.players[1].isEliminated).toBe(true)
    })

    test("猜測 Intern 不合法時回傳 null", () => {
        const state = createState()
        const result = checkGuess("Intern")

        expect(result).toBe(false)
    })

    test("猜測空值不合法", () => {
        expect(checkGuess()).toBe(false)
    })
})

describe("useManager", () => {
    test("比大小時點數小的目標玩家被淘汰", () => {
        const state = createState()
        state.players[1].hand = [{ id: 1, name: "Intern" }]
        const player = useManager(state, 1, 2)

        expect(player.playerId).toBe(2)
        expect(player.isEliminated).toBe(true)
    })

    test("目標玩家受保護時回傳 null", () => {
        const state = createState()
        const result = useManager(state, 1, 3)

        expect(result).toBeNull()
    })
})

describe("useVeteran", () => {
    test("設定自己保護狀態", () => {
        const state = createState()
        const player = useVeteran(state, 1)

        expect(player.isProtected).toBe(true)
    })
})

describe("usePm", () => {
    test("讓目標玩家棄牌並重抽", () => {
        const state = createState()
        const result = usePm(state, 2)

        expect(result.discardedCard).toEqual({ id: 5, name: "PM" })
        expect(result.newCard).toEqual({ id: 2, name: "Cleaner" })
        expect(state.players[1].hand).toEqual([{ id: 2, name: "Cleaner" }])
        expect(state.discardPile).toEqual([{ id: 5, name: "PM" }])
    })
})

describe("useHr", () => {
    test("交換自己與目標玩家手牌", () => {
        const state = createState()

        useHr(state, 1, 2)

        expect(state.players[0].hand).toEqual([{ id: 5, name: "PM" }])
        expect(state.players[1].hand).toEqual([{ id: 3, name: "Manager" }])
    })
})

describe("useCeo", () => {
    test("被迫棄掉 CEO 時淘汰玩家", () => {
        const state = createState()
        const player = useCeo(state, 1, { id: 8, name: "CEO" })

        expect(player.isEliminated).toBe(true)
    })
})

describe("runCardEffect", () => {
    test("根據卡牌名稱執行對應效果", () => {
        const state = createState()
        const result = runCardEffect({
        state,
        card: { id: 4, name: "Senior" },
        playerId: 1,
        })

        expect(result.isProtected).toBe(true)
    })

  test("沒有卡牌時回傳 null", () => {
    const state = createState()
    const result = runCardEffect({ state, card: null, playerId: 1 })

    expect(result).toBeNull()
  })
})
