import { jest } from "@jest/globals"

const mockVerifyToken = jest.fn()

jest.unstable_mockModule("../src/services/authService.js", () => ({
  verifyToken: mockVerifyToken,
}))

const { getCurrentProfile } = await import("../src/services/profileService.js")

function createPlayer(overrides = {}) {
  return {
    id: 1,
    authUserId: "auth-user-001",
    username: "測試玩家",
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
  })

  test("token有效時回傳頁面安全的 profile DTO", async () => {
    mockVerifyToken.mockResolvedValueOnce(createPlayer())

    const profile = await getCurrentProfile("valid-token")

    expect(mockVerifyToken).toHaveBeenCalledWith("valid-token")
    expect(profile).toEqual({
      id: 1,
      username: "測試玩家",
      avatarId: 2,
      level: 7,
      exp: 1800,
      coins: 120,
      gems: 5,
      tickets: 3,
      winCount: 8,
      loseCount: 2,
      totalGames: 10,
      createdAt: "2026-07-01T00:00:00.000Z",
    })
    expect(profile.account).toBeUndefined()
    expect(profile.authUserId).toBeUndefined()
  })

  test("驗證失敗時保留 service 錯誤狀態", async () => {
    const error = new Error("登入驗證失敗")
    error.statusCode = 401
    mockVerifyToken.mockRejectedValueOnce(error)

    await expect(getCurrentProfile("invalid-token")).rejects.toMatchObject({
      message: "登入驗證失敗",
      statusCode: 401,
    })
  })

  test("找不到玩家資料時保留 404 錯誤狀態", async () => {
    const error = new Error("找不到玩家資料")
    error.statusCode = 404
    mockVerifyToken.mockRejectedValueOnce(error)

    await expect(getCurrentProfile("valid-token")).rejects.toMatchObject({
      message: "找不到玩家資料",
      statusCode: 404,
    })
  })
})
