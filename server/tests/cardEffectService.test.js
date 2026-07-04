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
        expect(result.newCard).toBeUndefined()
        expect(result.player).toBeUndefined()
        expect(result.deck).toBeUndefined()
        expect(result.newCardDrawn).toBe(true)
        expect(result.targetPlayerId).toBe(2)
        expect(result.targetHandCount).toBe(1)
        expect(result.deckCount).toBe(1)
        expect(state.players[1].hand).toEqual([{ id: 2, name: "Cleaner" }])
        expect(state.discardPile).toEqual([{ id: 5, name: "PM" }])
    })
    test("PM can target self without returning deck order", () => {
        const state = createState()
        const result = usePm(state, 1)

        expect(result.discardedCard).toEqual({ id: 3, name: "Manager" })
        expect(result.newCard).toBeUndefined()
        expect(result.player).toBeUndefined()
        expect(result.deck).toBeUndefined()
        expect(result.newCardDrawn).toBe(true)
        expect(result.targetPlayerId).toBe(1)
        expect(result.targetHandCount).toBe(1)
        expect(result.deckCount).toBe(1)
        expect(state.players[0].hand).toEqual([{ id: 2, name: "Cleaner" }])
    })
    test("棄掉 CEO 時淘汰玩家且不抽新牌", () => {
        const state = createState()
        state.players[1].hand = [{ id: 8, name: "CEO" }]

        const result = usePm(state, 2)

        expect(result.discardedCard).toEqual({ id: 8, name: "CEO" })
        expect(result.newCard).toBeUndefined()
        expect(result.player).toBeUndefined()
        expect(result.deck).toBeUndefined()
        expect(result.newCardDrawn).toBe(false)
        expect(result.targetPlayerId).toBe(2)
        expect(result.targetHandCount).toBe(0)
        expect(result.targetIsEliminated).toBe(true)
        expect(result.deckCount).toBe(2)
        expect(state.players[1].hand).toEqual([])
        expect(state.players[1].isEliminated).toBe(true)
        expect(state.discardPile).toEqual([{ id: 8, name: "CEO" }])
        expect(state.deck).toEqual([
            { id: 2, name: "Cleaner" },
            { id: 1, name: "Intern" },
        ])
    })
})

describe("useHr", () => {
    test("交換自己與目標玩家手牌", () => {
        const state = createState()

        useHr(state, 1, 2)

        expect(state.players[0].hand).toEqual([{ id: 5, name: "PM" }])
        expect(state.players[1].hand).toEqual([{ id: 3, name: "Manager" }])
    })

    test("HR does not swap hands with a protected target", () => {
        const state = createState()

        const result = useHr(state, 1, 3)

        expect(result).toEqual({
            protected: true,
            targetPlayerId: 3,
        })
        expect(state.players[0].hand).toEqual([{ id: 3, name: "Manager" }])
        expect(state.players[2].hand).toEqual([{ id: 5, name: "PM" }])
    })

    test("HR handles string ids when target is protected", () => {
        const state = createState()

        const result = useHr(state, "1", "3")

        expect(result).toEqual({
            protected: true,
            targetPlayerId: 3,
        })
        expect(state.players[0].hand).toEqual([{ id: 3, name: "Manager" }])
        expect(state.players[2].hand).toEqual([{ id: 5, name: "PM" }])
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

describe("protected target effects", () => {
  test("does not apply target effect to protected player", () => {
    const state = createState()
    const result = runCardEffect({
      state,
      card: { id: 5, name: "PM" },
      playerId: 1,
      targetPlayerId: 3,
    })

    expect(result).toBeNull()
    expect(state.players[2].hand).toEqual([{ id: 5, name: "PM" }])
    expect(state.discardPile).toEqual([])
  })
})

describe("CEO effect", () => {
  test("eliminates player who plays CEO", () => {
    const state = createState()
    const player = runCardEffect({
      state,
      card: { id: 8, name: "CEO" },
      playerId: 1,
    })

    expect(player.playerId).toBe(1)
    expect(player.isEliminated).toBe(true)
    expect(state.players[0].isEliminated).toBe(true)
  })
})
