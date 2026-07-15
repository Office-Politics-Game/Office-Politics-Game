import { jest } from "@jest/globals"

const mockQuery = jest.fn()

jest.unstable_mockModule("../src/db/index.js", () => ({
  default: {
    query: mockQuery,
  },
}))

const {
  getProfile,
  getProfileMatches,
  setProfileTitle,
  updateProfile,
} = await import("../src/services/profileService.js")

function createPlayerRow(overrides = {}) {
  return {
    id: 1,
    username: "Test Player",
    account: "test@example.com",
    auth_user_id: "auth-user-001",
    avatar_id: 2,
    bio: "hello",
    level: 7,
    exp: 1800,
    win_count: 8,
    lose_count: 2,
    total_games: 10,
    title: "First Win",
    created_at: "2026-07-01T00:00:00.000Z",
    updated_at: "2026-07-01T03:30:00.000Z",
    ...overrides,
  }
}

function createMatchRow(overrides = {}) {
  return {
    id: 10,
    room_id: 3,
    winner_player_id: 1,
    winner_username: "Test Player",
    result: "win",
    started_at: "2026-07-13T01:00:00.000Z",
    ended_at: "2026-07-13T01:30:00.000Z",
    participants: [
      {
        playerId: 1,
        username: "Test Player",
        avatarId: 2,
        roundWins: 2,
        result: "win",
      },
      {
        playerId: 2,
        username: "Other Player",
        avatarId: 3,
        roundWins: 1,
        result: "lose",
      },
    ],
    ...overrides,
  }
}

describe("profileService", () => {
  beforeEach(() => {
    mockQuery.mockReset()
  })

  test("getProfile returns a display-safe profile DTO", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [createPlayerRow()],
    })

    const profile = await getProfile(1)

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("FROM players"),
      [1],
    )
    expect(profile).toEqual({
      id: 1,
      username: "Test Player",
      avatarId: 2,
      bio: "hello",
      level: 7,
      exp: 1800,
      winCount: 8,
      loseCount: 2,
      totalGames: 10,
      title: "First Win",
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedAt: "2026-07-01T03:30:00.000Z",
    })
    expect(profile.account).toBeUndefined()
    expect(profile.authUserId).toBeUndefined()
  })

  test("getProfile returns 404 when player is missing", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [],
    })

    await expect(getProfile(999)).rejects.toMatchObject({
      message: "找不到玩家資料",
      statusCode: 404,
    })
  })

  test("updateProfile trims editable fields and avatar id", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        createPlayerRow({
          username: "New Name",
          bio: "new bio",
          avatar_id: 3,
        }),
      ],
    })

    const profile = await updateProfile(1, {
      username: " New Name ",
      bio: " new bio ",
      avatarId: 3,
    })

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE players"),
      ["New Name", "new bio", 3, 1],
    )
    expect(profile.username).toBe("New Name")
    expect(profile.bio).toBe("new bio")
    expect(profile.avatarId).toBe(3)
  })

  test("updateProfile returns current profile when payload is empty", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [createPlayerRow()],
    })

    const profile = await updateProfile(1, {})

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("FROM players"),
      [1],
    )
    expect(profile.username).toBe("Test Player")
  })

  test("updateProfile rejects invalid avatar id", async () => {
    await expect(updateProfile(1, { avatarId: 99 })).rejects.toMatchObject({
      message: "頭像選項不正確",
      statusCode: 400,
    })

    expect(mockQuery).not.toHaveBeenCalled()
  })

  test("updateProfile rejects empty username", async () => {
    await expect(updateProfile(1, { username: "   " })).rejects.toMatchObject({
      message: "請輸入暱稱",
      statusCode: 400,
    })

    expect(mockQuery).not.toHaveBeenCalled()
  })

  test("updateProfile maps duplicate username to 409", async () => {
    const error = new Error("duplicate key")
    error.code = "23505"

    mockQuery.mockRejectedValueOnce(error)

    await expect(updateProfile(1, { username: "Taken" })).rejects.toMatchObject({
      message: "暱稱已被使用",
      statusCode: 409,
    })
  })

  test("setProfileTitle saves an unlocked achievement title", async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ name: "First Win", unlocked_player_id: 1 }],
      })
      .mockResolvedValueOnce({
        rows: [createPlayerRow({ title: "First Win" })],
      })

    const profile = await setProfileTitle(1, "first_game_win")

    expect(mockQuery.mock.calls[0][1]).toEqual(["first_game_win", 1])
    expect(mockQuery.mock.calls[1][1]).toEqual(["First Win", 1])
    expect(profile.title).toBe("First Win")
  })

  test("setProfileTitle rejects a locked achievement without updating title", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ name: "First Win", unlocked_player_id: null }],
    })

    await expect(
      setProfileTitle(1, "first_game_win"),
    ).rejects.toMatchObject({
      message: "Achievement has not been unlocked",
      statusCode: 403,
    })
    expect(mockQuery).toHaveBeenCalledTimes(1)
  })

  test("setProfileTitle rejects an unknown achievement without updating title", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })

    await expect(setProfileTitle(1, "bad_code")).rejects.toMatchObject({
      message: "Achievement not found",
      statusCode: 404,
    })
    expect(mockQuery).toHaveBeenCalledTimes(1)
  })

  test("getProfileMatches returns formatted match history", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [createMatchRow()],
    })

    const matches = await getProfileMatches(1, { limit: "20" })

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("FROM matches"),
      [1, 20],
    )
    expect(matches).toEqual([
      {
        id: 10,
        roomId: 3,
        result: "win",
        winnerPlayerId: 1,
        winnerUsername: "Test Player",
        xpGained: 300,
        startedAt: "2026-07-13T01:00:00.000Z",
        endedAt: "2026-07-13T01:30:00.000Z",
        participants: [
          {
            playerId: 1,
            username: "Test Player",
            avatarId: 2,
            roundWins: 2,
            result: "win",
          },
          {
            playerId: 2,
            username: "Other Player",
            avatarId: 3,
            roundWins: 1,
            result: "lose",
          },
        ],
      },
    ])
  })

  test("getProfileMatches caps oversized limit", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [],
    })

    await getProfileMatches(1, { limit: "999" })

    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [1, 40])
  })
})
