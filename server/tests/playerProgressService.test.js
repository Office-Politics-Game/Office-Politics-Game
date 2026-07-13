import { jest } from "@jest/globals"

const queryMock = jest.fn()
const releaseMock = jest.fn()
const connectMock = jest.fn()

jest.unstable_mockModule("../src/db/index.js", () => ({
  default: {
    connect: connectMock,
  },
}))

const {
  MATCH_COMPLETE_EXP,
  MATCH_WIN_BONUS_EXP,
  applyExperience,
  finalizeMatchProgress,
  getNextExp,
} = await import("../src/services/playerProgressService.js")

function createClient() {
  return {
    query: queryMock,
    release: releaseMock,
  }
}

function createFinishedState() {
  return {
    phase: "finished",
    winnerPlayerId: 2,
    players: [
      { playerId: 1, roundWins: 1 },
      { playerId: 2, roundWins: 3 },
      { playerId: 3, roundWins: 0 },
      { playerId: 4, roundWins: 2 },
    ],
  }
}

beforeEach(() => {
  queryMock.mockReset()
  releaseMock.mockReset()
  connectMock.mockReset()
  connectMock.mockResolvedValue(createClient())
})

describe("playerProgressService", () => {
  test("getNextExp() 使用 level * 400 + 200", () => {
    expect(getNextExp(1)).toBe(600)
    expect(getNextExp(2)).toBe(1000)
    expect(getNextExp(3)).toBe(1400)
  })

  test("applyExperience() 會依照門檻升級並保留目前等級進度", () => {
    const result = applyExperience({
      level: 1,
      exp: 500,
      gainedExp: 300,
    })

    expect(result).toEqual({
      level: 2,
      exp: 200,
    })
  })

  test("finalizeMatchProgress() 會更新勝敗場、XP、等級與對戰參與紀錄", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ id: 10, ended_at: null }],
      })
      .mockResolvedValueOnce({
        rows: [
          { id: 1, username: "玩家一", avatar_id: 1, level: 1, exp: 0 },
          { id: 2, username: "玩家二", avatar_id: 2, level: 1, exp: 500 },
          { id: 3, username: "玩家三", avatar_id: 3, level: 2, exp: 100 },
          { id: 4, username: "玩家四", avatar_id: 4, level: 3, exp: 1200 },
        ],
      })
      .mockResolvedValue({ rows: [] })

    const result = await finalizeMatchProgress({
      matchId: 10,
      state: createFinishedState(),
    })

    expect(result).toEqual({
      finalized: true,
      matchId: 10,
      winnerPlayerId: 2,
      playerIds: [1, 2, 3, 4],
    })

    expect(queryMock).toHaveBeenCalledWith("BEGIN")
    expect(queryMock).toHaveBeenCalledWith("COMMIT")

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE players"),
      [0, 1, 1, MATCH_COMPLETE_EXP, 1]
    )

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE players"),
      [1, 0, 2, 200, 2]
    )

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO match_participants"),
      [10, 2, "玩家二", 2, 3, "win"]
    )

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO match_participants"),
      [10, 1, "玩家一", 1, 1, "lose"]
    )

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE matches"),
      [2, 10]
    )

    expect(releaseMock).toHaveBeenCalledTimes(1)
  })

  test("同一場已結算時不會重複更新玩家戰績", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ id: 10, ended_at: new Date("2026-07-13T00:00:00Z") }],
      })
      .mockResolvedValue({ rows: [] })

    const result = await finalizeMatchProgress({
      matchId: 10,
      state: createFinishedState(),
    })

    expect(result).toEqual({ finalized: false })

    expect(queryMock).toHaveBeenCalledWith("BEGIN")
    expect(queryMock).toHaveBeenCalledWith("COMMIT")
    expect(queryMock).not.toHaveBeenCalledWith(
      expect.stringContaining("UPDATE players"),
      expect.any(Array)
    )
    expect(queryMock).not.toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO match_participants"),
      expect.any(Array)
    )
  })

  test("玩家資料不完整時會 rollback", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ id: 10, ended_at: null }],
      })
      .mockResolvedValueOnce({
        rows: [
          { id: 1, username: "玩家一", avatar_id: 1, level: 1, exp: 0 },
        ],
      })
      .mockResolvedValue({ rows: [] })

    await expect(
      finalizeMatchProgress({
        matchId: 10,
        state: createFinishedState(),
      })
    ).rejects.toThrow("對局玩家資料不完整")

    expect(queryMock).toHaveBeenCalledWith("ROLLBACK")
    expect(releaseMock).toHaveBeenCalledTimes(1)
  })

  test("不是 finished 狀態時不會結算", async () => {
    const result = await finalizeMatchProgress({
      matchId: 10,
      state: {
        phase: "playing",
        players: [],
      },
    })

    expect(result).toEqual({ finalized: false })
    expect(connectMock).not.toHaveBeenCalled()
  })

  test("勝利玩家不在對局中時會失敗", async () => {
    await expect(
      finalizeMatchProgress({
        matchId: 10,
        state: {
          phase: "finished",
          winnerPlayerId: 99,
          players: [{ playerId: 1, roundWins: 0 }],
        },
      })
    ).rejects.toThrow("勝利玩家不在本場對局中")

    expect(connectMock).not.toHaveBeenCalled()
  })
})