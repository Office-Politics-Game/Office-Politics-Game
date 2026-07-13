import { jest } from "@jest/globals"

const queryMock = jest.fn()
const endMock = jest.fn()

jest.unstable_mockModule("../src/db/index.js", () => ({
    default: {
        query: queryMock,
        end: endMock,
    },
}))

const { achievementSeeds, seedAchievements } = await import(
    "../src/db/seedAchievements.js"
)

beforeEach(() => {
    queryMock.mockReset()
    endMock.mockReset()
})

describe("seedAchievements", () => {
    test("upserts achievement seed data idempotently", async () => {
        queryMock.mockResolvedValue({ rows: [] })

        await seedAchievements()

        expect(queryMock).toHaveBeenCalledTimes(achievementSeeds.length)
        expect(queryMock.mock.calls[0][0]).toContain(
            "ON CONFLICT (code) DO UPDATE"
        )
        expect(queryMock.mock.calls.map(([, values]) => values[0])).toEqual([
            "first_friend",
            "first_room_create",
            "first_game_win",
            "first_top_up",
        ])
    })
})
