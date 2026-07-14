import { jest } from "@jest/globals"

const mockQuery = jest.fn()

jest.unstable_mockModule("../src/db/index.js", () => ({
  default: {
    query: mockQuery,
  },
}))

const {
  getProfile,
  updateProfile,
  getProfileMatches,
} = await import("../src/services/profileService.js")

function createPlayerRow(overrides = {}) {
  return {
    id: 1,
    username: "測試玩家",
    account: "test@example.com",
    auth_user_id: "auth-user-001",
    avatar_id: 2,
    bio: "測試自我介紹",
    level: 7,
    exp: 1800,
    win_count: 8,
    lose_count: 2,
    total_games: 10,
    created_at: "2026-07-01T00:00:00.000Z",
    updated_at: "2026-07-01T03:30:00.000Z",
    ...overrides,
  }
}

describe("profileService", () => {
  beforeEach(() => {
    mockQuery.mockReset()
  })

  test("getProfile 回傳頁面安全的 profile DTO", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [createPlayerRow()],
    })

    const profile = await getProfile(1)

    expect(mockQuery).toHaveBeenCalledTimes(1)
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("FROM players"),
      [1],
    )

    expect(profile).toEqual({
      id: 1,
      username: "測試玩家",
      avatarId: 2,
      bio: "測試自我介紹",
      level: 7,
      exp: 1800,
      winCount: 8,
      loseCount: 2,
      totalGames: 10,
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedAt: "2026-07-01T03:30:00.000Z",
    })

    expect(profile.account).toBeUndefined()
    expect(profile.authUserId).toBeUndefined()
  })

  test("找不到玩家資料時回傳 404", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [],
    })

    await expect(getProfile(999)).rejects.toMatchObject({
      message: "找不到玩家資料",
      statusCode: 404,
    })
  })

  test("updateProfile 可更新暱稱、自我介紹與頭像", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        createPlayerRow({
          username: "新暱稱",
          bio: "新的自我介紹",
          avatar_id: 3,
        }),
      ],
    })

    const profile = await updateProfile(1, {
      username: " 新暱稱 ",
      bio: " 新的自我介紹 ",
      avatarId: 3,
    })

    expect(mockQuery).toHaveBeenCalledTimes(1)
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE players"),
      ["新暱稱", "新的自我介紹", 3, 1],
    )

    expect(profile.username).toBe("新暱稱")
    expect(profile.bio).toBe("新的自我介紹")
    expect(profile.avatarId).toBe(3)
  })

  test("updateProfile 未提供更新欄位時會回傳目前 profile", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [createPlayerRow()],
    })

    const profile = await updateProfile(1, {})

    expect(mockQuery).toHaveBeenCalledTimes(1)
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("FROM players"),
      [1],
    )
    expect(profile.username).toBe("測試玩家")
  })

  test("updateProfile 不接受非法 avatarId", async () => {
    await expect(updateProfile(1, { avatarId: 99 })).rejects.toMatchObject({
      message: "頭像選項不正確",
      statusCode: 400,
    })

    expect(mockQuery).not.toHaveBeenCalled()
  })

  test("updateProfile 暱稱為空時回傳 400", async () => {
    await expect(updateProfile(1, { username: "   " })).rejects.toMatchObject({
      message: "請輸入暱稱",
      statusCode: 400,
    })

    expect(mockQuery).not.toHaveBeenCalled()
  })

  test("暱稱重複時回傳 409", async () => {
    const error = new Error("duplicate key")
    error.code = "23505"

    mockQuery.mockRejectedValueOnce(error)

    await expect(updateProfile(1, { username: "已存在暱稱" })).rejects.toMatchObject({
      message: "暱稱已被使用",
      statusCode: 409,
    })
  })

  test("getProfileMatches 目前回傳空陣列", async () => {
    const matches = await getProfileMatches(1, { limit: "20" })

    expect(matches).toEqual([])
  })
})
