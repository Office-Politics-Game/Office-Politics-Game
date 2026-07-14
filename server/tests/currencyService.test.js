import { jest } from "@jest/globals"

const queryMock = jest.fn()

jest.unstable_mockModule("../src/db/index.js", () => ({
    default: {
        query: queryMock,
    },
}))

const {
    getPlayerCurrency,
    addCurrency,
    spendCurrency,
} = await import("../src/services/currencyService.js")

beforeEach(() => {
    queryMock.mockReset()
})

describe("currencyService", () => {
    test("getPlayerCurrency() 可以回傳玩家遊戲幣餘額", async () => {
        queryMock.mockResolvedValueOnce({
            rows: [
                {
                    id: 1,
                    coins: 100,
                    gems: 5,
                    tickets: 2,
                },
            ],
        })

        const result = await getPlayerCurrency(1)

        expect(result).toEqual({
            playerId: 1,
            coins: 100,
            gems: 5,
            tickets: 2,
        })
    })

    test("addCurrency() 可以增加玩家通貨並寫入流水", async () => {
        queryMock
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: 1,
                        balance_before: 100,
                        balance_after: 150,
                    },
                ],
            })
            .mockResolvedValueOnce({
                rows: [],
            })

        const result = await addCurrency(
            1,
            "coin",
            50,
            "match_reward",
            "對局獎勵"
        )

        expect(result).toEqual({
            playerId: 1,
            currency: "coin",
            amount: 50,
            balanceAfter: 150,
        })

        expect(queryMock).toHaveBeenCalledTimes(2)
        expect(queryMock.mock.calls[0][1]).toEqual([50, 1, 99999])
        expect(queryMock.mock.calls[1][1]).toEqual([
            1,
            "coin",
            50,
            150,
            "match_reward",
            "對局獎勵",
        ])
    })

    test("spendCurrency() 可以扣除玩家通貨並寫入負數流水", async () => {
        queryMock
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: 1,
                        coins: 70,
                    },
                ],
            })
            .mockResolvedValueOnce({
                rows: [],
            })

        const result = await spendCurrency(
            1,
            "coin",
            30,
            "shop_purchase",
            "購買商品"
        )

        expect(result).toEqual({
            playerId: 1,
            currency: "coin",
            amount: -30,
            balanceAfter: 70,
        })

        expect(queryMock).toHaveBeenCalledTimes(2)
        expect(queryMock.mock.calls[1][1]).toEqual([
            1,
            "coin",
            -30,
            70,
            "shop_purchase",
            "購買商品",
        ])
    })

    test("spendCurrency() 餘額不足時不會寫入流水", async () => {
        queryMock.mockResolvedValueOnce({
            rows: [],
        })

        await expect(
            spendCurrency(1, "coin", 999, "shop_purchase", "購買商品")
        ).rejects.toThrow()

        expect(queryMock).toHaveBeenCalledTimes(1)
    })

    test("不支援的 currency 會失敗", async () => {
        await expect(
            addCurrency(1, "banana", 10, "test", "測試")
        ).rejects.toThrow()

        expect(queryMock).not.toHaveBeenCalled()
    })

    test("amount 不是正整數時會失敗", async () => {
        await expect(
            addCurrency(1, "coin", 0, "test", "測試")
        ).rejects.toThrow()

        await expect(
            spendCurrency(1, "coin", -1, "test", "測試")
        ).rejects.toThrow()

        expect(queryMock).not.toHaveBeenCalled()
    })

    test("addCurrency() caps balance at 99999", async () => {
        queryMock
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: 1,
                        balance_before: 99990,
                        balance_after: 99999,
                    },
                ],
            })
            .mockResolvedValueOnce({
                rows: [],
            })

        const result = await addCurrency(
            1,
            "coin",
            50,
            "match_reward",
            "test"
        )

        expect(result).toEqual({
            playerId: 1,
            currency: "coin",
            amount: 9,
            balanceAfter: 99999,
        })

        expect(queryMock).toHaveBeenCalledTimes(2)
        expect(queryMock.mock.calls[0][1]).toEqual([50, 1, 99999])
        expect(queryMock.mock.calls[1][1]).toEqual([
            1,
            "coin",
            9,
            99999,
            "match_reward",
            "test",
        ])
    })

    test("getPlayerCurrency() caps returned balances at 99999", async () => {
        queryMock.mockResolvedValueOnce({
            rows: [
                {
                    id: 1,
                    coins: 99999,
                    gems: 99999,
                    tickets: 99999,
                },
            ],
        })

        const result = await getPlayerCurrency(1)

        expect(result).toEqual({
            playerId: 1,
            coins: 99999,
            gems: 99999,
            tickets: 99999,
        })

        expect(queryMock.mock.calls[0][1]).toEqual([1, 99999])
    })

    test("addCurrency() rejects when balance is already capped", async () => {
        queryMock.mockResolvedValueOnce({
            rows: [
                {
                    id: 1,
                    balance_before: 99999,
                    balance_after: 99999,
                },
            ],
        })

        await expect(
            addCurrency(1, "coin", 50, "match_reward", "test")
        ).rejects.toThrow()

        expect(queryMock).toHaveBeenCalledTimes(1)
    })
})
