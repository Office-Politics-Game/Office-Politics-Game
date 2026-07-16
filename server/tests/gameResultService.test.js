import { jest } from "@jest/globals"

const queryMock = jest.fn()

jest.unstable_mockModule("../src/db/index.js", () => ({
  default: {
    query: queryMock,
  },
}))

const { getRoomGameResult } = await import("../src/services/gameResultService.js")

beforeEach(() => {
  queryMock.mockReset()
})

function createMatchRow(overrides = {}) {
  return {
    id: 10,
    room_id: 3,
    room_code: "ROOM01",
    winner_player_id: 2,
    started_at: "2026-07-15T01:00:00.000Z",
    ended_at: "2026-07-15T01:30:00.000Z",
    ...overrides,
  }
}

function createParticipantRows() {
  return [
    {
      player_id: 2,
      username_snapshot: "贏家",
      avatar_id_snapshot: 2,
      level: 4,
      round_wins: 3,
      result: "win",
      exp_gained: 300,
      coins_gained: 1000,
    },
    {
      player_id: 1,
      username_snapshot: "玩家一",
      avatar_id_snapshot: 1,
      level: 2,
      round_wins: 1,
      result: "lose",
      exp_gained: 100,
      coins_gained: 500,
    },
  ]
}

describe("gameResultService", () => {
  test("getRoomGameResult() 會回傳結算頁需要的排名、贏家、獎勵與成就", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [createMatchRow()],
      })
      .mockResolvedValueOnce({
        rows: createParticipantRows(),
      })
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
            unlocked_at: "2026-07-15T01:31:00.000Z",
          },
        ],
      })

    const result = await getRoomGameResult({
      roomCode: "ROOM01",
      playerId: 2,
    })

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("FROM matches"),
      ["ROOM01"]
    )
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("FROM match_participants"),
      [10]
    )
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("FROM player_achievements"),
      [10, 2]
    )

    expect(result).toEqual({
      result: {
        matchId: 10,
        roomId: 3,
        roomCode: "ROOM01",
        winnerPlayerId: 2,
        winner: {
          id: 2,
          playerId: 2,
          username: "贏家",
          name: "贏家",
          avatarId: 2,
          level: 4,
          roundWins: 3,
          result: "win",
          expGained: 300,
          coinsGained: 1000,
          isWinner: true,
        },
        currentPlayer: {
          id: 2,
          playerId: 2,
          username: "贏家",
          name: "贏家",
          avatarId: 2,
          level: 4,
          roundWins: 3,
          result: "win",
          expGained: 300,
          coinsGained: 1000,
          isWinner: true,
        },
        players: [
          {
            id: 2,
            playerId: 2,
            username: "贏家",
            name: "贏家",
            avatarId: 2,
            level: 4,
            roundWins: 3,
            result: "win",
            expGained: 300,
            coinsGained: 1000,
            isWinner: true,
          },
          {
            id: 1,
            playerId: 1,
            username: "玩家一",
            name: "玩家一",
            avatarId: 1,
            level: 2,
            roundWins: 1,
            result: "lose",
            expGained: 100,
            coinsGained: 500,
            isWinner: false,
          },
        ],
        participants: [
          {
            id: 2,
            playerId: 2,
            username: "贏家",
            name: "贏家",
            avatarId: 2,
            level: 4,
            roundWins: 3,
            result: "win",
            expGained: 300,
            coinsGained: 1000,
            isWinner: true,
          },
          {
            id: 1,
            playerId: 1,
            username: "玩家一",
            name: "玩家一",
            avatarId: 1,
            level: 2,
            roundWins: 1,
            result: "lose",
            expGained: 100,
            coinsGained: 500,
            isWinner: false,
          },
        ],
        achievements: [
          {
            id: 3,
            code: "first_game_win",
            name: "初次勝利",
            title: "初次勝利",
            description: "第一次遊戲勝利",
            category: "game",
            rewardCurrency: null,
            rewardAmount: 0,
            unlockedAt: "2026-07-15T01:31:00.000Z",
          },
        ],
        achievement: {
          id: 3,
          code: "first_game_win",
          name: "初次勝利",
          title: "初次勝利",
          description: "第一次遊戲勝利",
          category: "game",
          rewardCurrency: null,
          rewardAmount: 0,
          unlockedAt: "2026-07-15T01:31:00.000Z",
        },
        expGained: 300,
        coinsGained: 1000,
        rewards: {
          exp: 300,
          coins: 1000,
        },
        startedAt: "2026-07-15T01:00:00.000Z",
        endedAt: "2026-07-15T01:30:00.000Z",
      },
    })
  })

  test("查不到已結束對局時回傳 404", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [],
    })

    await expect(
      getRoomGameResult({
        roomCode: "NONE01",
        playerId: 1,
      })
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "尚未找到結算資料",
    })
  })

  test("playerId 不在本場對局中時回傳 403", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [createMatchRow()],
      })
      .mockResolvedValueOnce({
        rows: createParticipantRows(),
      })

    await expect(
      getRoomGameResult({
        roomCode: "ROOM01",
        playerId: 99,
      })
    ).rejects.toMatchObject({
      statusCode: 403,
      message: "玩家不在本場對局中",
    })

    expect(queryMock).toHaveBeenCalledTimes(2)
  })

  test("playerId 格式錯誤時不查資料庫並回傳 400", async () => {
    await expect(
      getRoomGameResult({
        roomCode: "ROOM01",
        playerId: "abc",
      })
    ).rejects.toMatchObject({
      statusCode: 400,
    })

    expect(queryMock).not.toHaveBeenCalled()
  })
})
