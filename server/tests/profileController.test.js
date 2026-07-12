import { jest } from "@jest/globals"

const mockGetProfile = jest.fn()
const mockUpdateProfile = jest.fn()
const mockGetProfileMatches = jest.fn()

jest.unstable_mockModule("../src/services/profileService.js", () => ({
  getProfile: mockGetProfile,
  updateProfile: mockUpdateProfile,
  getProfileMatches: mockGetProfileMatches,
}))

const {
  handleGetProfile,
  handleUpdateProfile,
  handleGetProfileMatches,
} = await import("../src/controllers/profileController.js")

function createMockResponse() {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  }

  res.status.mockReturnValue(res)
  res.json.mockReturnValue(res)

  return res
}

describe("profileController", () => {
  beforeEach(() => {
    mockGetProfile.mockReset()
    mockUpdateProfile.mockReset()
    mockGetProfileMatches.mockReset()
  })

  test("已登入玩家可取得 profile", async () => {
    const profile = {
      id: 1,
      username: "測試玩家",
      avatarId: 2,
      bio: "測試自我介紹",
    }

    mockGetProfile.mockResolvedValueOnce(profile)

    const req = {
      player: {
        id: 1,
      },
    }
    const res = createMockResponse()

    await handleGetProfile(req, res)

    expect(mockGetProfile).toHaveBeenCalledWith(1)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ profile })
  })

  test("更新 profile 時會使用 req.player.id 與 request body", async () => {
    const profile = {
      id: 1,
      username: "新暱稱",
      avatarId: 3,
      bio: "新的自我介紹",
    }

    mockUpdateProfile.mockResolvedValueOnce(profile)

    const req = {
      player: {
        id: 1,
      },
      body: {
        username: "新暱稱",
        bio: "新的自我介紹",
        avatarId: 3,
      },
    }
    const res = createMockResponse()

    await handleUpdateProfile(req, res)

    expect(mockUpdateProfile).toHaveBeenCalledWith(1, req.body)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ profile })
  })

  test("取得對戰紀錄時會使用 req.player.id 與 query", async () => {
    const matches = [
      {
        id: 10,
        result: "win",
      },
    ]

    mockGetProfileMatches.mockResolvedValueOnce(matches)

    const req = {
      player: {
        id: 1,
      },
      query: {
        limit: "20",
      },
    }
    const res = createMockResponse()

    await handleGetProfileMatches(req, res)

    expect(mockGetProfileMatches).toHaveBeenCalledWith(1, req.query)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ matches })
  })

  test("service 回傳自訂 statusCode 時 controller 會沿用", async () => {
    const error = new Error("找不到玩家資料")
    error.statusCode = 404
    mockGetProfile.mockRejectedValueOnce(error)

    const req = {
      player: {
        id: 999,
      },
    }
    const res = createMockResponse()

    await handleGetProfile(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: "找不到玩家資料",
    })
  })
})