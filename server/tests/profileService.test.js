import { jest } from "@jest/globals"

const mockVerifyToken = jest.fn()
const queryMock = jest.fn()

jest.unstable_mockModule("../src/services/authService.js", () => ({
  verifyToken: mockVerifyToken,
}))

jest.unstable_mockModule("../src/db/index.js", () => ({
  default: {
    query: queryMock,
  },
}))

const { getCurrentProfile, setProfileTitle } = await import(
  "../src/services/profileService.js"
)

function createPlayer(overrides = {}) {
  return {
    id: 1,
    authUserId: "auth-user-001",
    username: "Test Player",
    account: "test@example.com",
    avatarId: 2,
    level: 7,
    exp: 1800,
    coins: 120,
    gems: 5,
    tickets: 3,
    winCount: 8,
    loseCount: 2,
    totalGames: 10,
    title: "First Win",
    isOnline: true,
    lastLoginAt: "2026-07-01T03:30:00.000Z",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T03:30:00.000Z",
    ...overrides,
  }
}

describe("profileService", () => {
  beforeEach(() => {
    mockVerifyToken.mockReset()
    queryMock.mockReset()
  })

  test("returns display-safe profile DTO from a valid token", async () => {
    mockVerifyToken.mockResolvedValueOnce(createPlayer())

    const profile = await getCurrentProfile("valid-token")

    expect(mockVerifyToken).toHaveBeenCalledWith("valid-token")
    expect(profile).toEqual({
      id: 1,
      username: "Test Player",
      avatarId: 2,
      level: 7,
      exp: 1800,
      coins: 120,
      gems: 5,
      tickets: 3,
      winCount: 8,
      loseCount: 2,
      totalGames: 10,
      title: "First Win",
      createdAt: "2026-07-01T00:00:00.000Z",
    })
    expect(profile.account).toBeUndefined()
    expect(profile.authUserId).toBeUndefined()
  })

  test("returns null title when player has not selected one", async () => {
    mockVerifyToken.mockResolvedValueOnce(createPlayer({ title: null }))

    const profile = await getCurrentProfile("valid-token")

    expect(profile.title).toBeNull()
  })

  test("forwards token verification failures", async () => {
    const error = new Error("Invalid token")
    error.statusCode = 401
    mockVerifyToken.mockRejectedValueOnce(error)

    await expect(getCurrentProfile("invalid-token")).rejects.toMatchObject({
      message: "Invalid token",
      statusCode: 401,
    })
  })

  test("forwards missing player failures", async () => {
    const error = new Error("Player not found")
    error.statusCode = 404
    mockVerifyToken.mockRejectedValueOnce(error)

    await expect(getCurrentProfile("valid-token")).rejects.toMatchObject({
      message: "Player not found",
      statusCode: 404,
    })
  })

  test("setProfileTitle saves an unlocked achievement title", async () => {
    mockVerifyToken.mockResolvedValueOnce(createPlayer({ title: null }))
    queryMock
      .mockResolvedValueOnce({
        rows: [{ name: "First Win", unlocked_player_id: 1 }],
      })
      .mockResolvedValueOnce({ rows: [] })

    const profile = await setProfileTitle("valid-token", "first_game_win")

    expect(queryMock.mock.calls[0][1]).toEqual(["first_game_win", 1])
    expect(queryMock.mock.calls[1][1]).toEqual(["First Win", 1])
    expect(profile.title).toBe("First Win")
  })

  test("setProfileTitle rejects a locked achievement without updating title", async () => {
    mockVerifyToken.mockResolvedValueOnce(createPlayer({ title: "Old Title" }))
    queryMock.mockResolvedValueOnce({
      rows: [{ name: "First Win", unlocked_player_id: null }],
    })

    await expect(
      setProfileTitle("valid-token", "first_game_win"),
    ).rejects.toMatchObject({
      message: "Achievement has not been unlocked",
      statusCode: 403,
    })
    expect(queryMock).toHaveBeenCalledTimes(1)
  })

  test("setProfileTitle rejects an unknown achievement without updating title", async () => {
    mockVerifyToken.mockResolvedValueOnce(createPlayer({ title: "Old Title" }))
    queryMock.mockResolvedValueOnce({ rows: [] })

    await expect(
      setProfileTitle("valid-token", "bad_code"),
    ).rejects.toMatchObject({
      message: "Achievement not found",
      statusCode: 404,
    })
    expect(queryMock).toHaveBeenCalledTimes(1)
  })

  test("setProfileTitle rejects invalid tokens before querying achievements", async () => {
    const error = new Error("Invalid token")
    error.statusCode = 401
    mockVerifyToken.mockRejectedValueOnce(error)

    await expect(
      setProfileTitle("invalid-token", "first_game_win"),
    ).rejects.toMatchObject({
      message: "Invalid token",
      statusCode: 401,
    })
    expect(queryMock).not.toHaveBeenCalled()
  })
})
