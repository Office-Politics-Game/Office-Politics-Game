import { jest } from "@jest/globals"

const queryMock = jest.fn()

jest.unstable_mockModule("../src/db/index.js", () => ({
    default: {
        query: queryMock,
    },
}))

const { getPlayerAchievements } = await import(
    "../src/services/achievementService.js"
)

beforeEach(() => {
    queryMock.mockReset()
})

describe("achievementService", () => {
    test("returns locked and unlocked achievements", async () => {
        queryMock
            .mockResolvedValueOnce({
                rows: [{ id: 1 }],
            })
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: 1,
                        code: "first_win",
                        name: "First Win",
                        description: "Win one match",
                        category: "match",
                        reward_currency: "coin",
                        reward_amount: 50,
                        unlocked_at: "2026-07-10T00:00:00.000Z",
                    },
                    {
                        id: 2,
                        code: "collector",
                        name: "Collector",
                        description: "Collect one item",
                        category: "collection",
                        reward_currency: "diamond",
                        reward_amount: 5,
                        unlocked_at: null,
                    },
                ],
            })

        const result = await getPlayerAchievements(1)

        expect(result).toEqual({
            achievements: [
                {
                    id: 1,
                    code: "first_win",
                    name: "First Win",
                    description: "Win one match",
                    category: "match",
                    rewardCurrency: "coin",
                    rewardAmount: 50,
                    isUnlocked: true,
                    unlockedAt: "2026-07-10T00:00:00.000Z",
                },
                {
                    id: 2,
                    code: "collector",
                    name: "Collector",
                    description: "Collect one item",
                    category: "collection",
                    rewardCurrency: "diamond",
                    rewardAmount: 5,
                    isUnlocked: false,
                    unlockedAt: null,
                },
            ],
        })
    })

    test("throws 404 when player does not exist", async () => {
        queryMock.mockResolvedValueOnce({
            rows: [],
        })

        await expect(getPlayerAchievements(999)).rejects.toMatchObject({
            statusCode: 404,
        })

        expect(queryMock).toHaveBeenCalledTimes(1)
    })

    test("returns reward metadata without changing player currency", async () => {
        queryMock
            .mockResolvedValueOnce({
                rows: [{ id: 1 }],
            })
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: 3,
                        code: "daily_login",
                        name: "Daily Login",
                        description: "Login once",
                        category: "account",
                        reward_currency: "ticket",
                        reward_amount: 1,
                        unlocked_at: null,
                    },
                ],
            })

        const result = await getPlayerAchievements(1)
        const executedSql = queryMock.mock.calls
            .map(([sql]) => sql)
            .join("\n")

        expect(result.achievements[0]).toMatchObject({
            rewardCurrency: "ticket",
            rewardAmount: 1,
        })
        expect(executedSql).not.toMatch(/UPDATE\s+players/i)
        expect(executedSql).not.toMatch(/player_currency_logs/i)
    })
})
