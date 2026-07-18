import { jest } from "@jest/globals"

const queryMock = jest.fn()

jest.unstable_mockModule("../src/db/index.js", () => ({
    default: {
        query: queryMock,
    },
}))

const { getPlayerAchievements, unlockAchievement, unlockMatchAchievements } = await import(
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

    test("unlockAchievement() 首次解鎖時會回傳成就資料", async () => {
        queryMock
            .mockResolvedValueOnce({
                rows: [{ id: 1 }],
            })
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: 10,
                        code: "first_friend",
                        name: "社交新人",
                        description: "第一次加好友",
                        category: "social",
                        reward_currency: null,
                        reward_amount: 0,
                        unlocked_at: null,
                    },
                ],
            })
            .mockResolvedValueOnce({
                rows: [{ unlocked_at: "2026-07-12T00:00:00.000Z" }],
            })

        const achievement = await unlockAchievement(1, "first_friend")

        expect(achievement).toMatchObject({
            code: "first_friend",
            isUnlocked: true,
            unlockedAt: "2026-07-12T00:00:00.000Z",
        })
        expect(queryMock.mock.calls[2][0]).toContain(
            "ON CONFLICT (player_id, achievement_id) DO NOTHING"
        )
    })

    test("unlockAchievement() 已解鎖時會回傳 null", async () => {
        queryMock
            .mockResolvedValueOnce({
                rows: [{ id: 1 }],
            })
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: 10,
                        code: "first_friend",
                        name: "社交新人",
                        description: "第一次加好友",
                        category: "social",
                        reward_currency: null,
                        reward_amount: 0,
                        unlocked_at: null,
                    },
                ],
            })
            .mockResolvedValueOnce({
                rows: [],
            })

        await expect(unlockAchievement(1, "first_friend")).resolves.toBeNull()
    })

    test("unlockAchievement() 找不到成就代碼時會拋出 404", async () => {
        queryMock
            .mockResolvedValueOnce({
                rows: [{ id: 1 }],
            })
            .mockResolvedValueOnce({
                rows: [],
            })

        await expect(unlockAchievement(1, "bad_code")).rejects.toMatchObject({
            statusCode: 404,
        })
    })

    test("unlockMatchAchievements() 會解鎖既有的首次勝利成就", async () => {
        const clientQueryMock = jest.fn()
        const client = { query: clientQueryMock }

        clientQueryMock
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: 3,
                        code: "first_game_win",
                        name: "初次勝利",
                        description: "第一次遊戲勝利",
                        category: "game",
                        reward_currency: null,
                        reward_amount: 0,
                    },
                ],
            })
            .mockResolvedValueOnce({
                rows: [{ unlocked_at: "2026-07-15T00:01:00.000Z" }],
            })

        const result = await unlockMatchAchievements({
            client,
            matchId: 10,
            playerIds: [1, 2],
            winnerPlayerId: 1,
        })

        expect(clientQueryMock).toHaveBeenCalledWith(
            expect.stringContaining("WHERE code = ANY"),
            [["first_game_win"]]
        )

        expect(clientQueryMock).toHaveBeenCalledWith(
            expect.stringContaining("INSERT INTO player_achievements"),
            [1, 3, 10]
        )

        expect(clientQueryMock).toHaveBeenCalledTimes(2)

        expect(result).toEqual({
            1: [
                {
                    id: 3,
                    code: "first_game_win",
                    name: "初次勝利",
                    description: "第一次遊戲勝利",
                    category: "game",
                    rewardCurrency: null,
                    rewardAmount: 0,
                    isUnlocked: true,
                    unlockedAt: "2026-07-15T00:01:00.000Z",
                },
            ],
            2: [],
        })
    })
})
