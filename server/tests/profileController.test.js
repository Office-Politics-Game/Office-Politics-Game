import { jest } from "@jest/globals"

const mockGetCurrentProfile = jest.fn()

jest.unstable_mockModule("../src/services/profileService.js", () => ({
  getCurrentProfile: mockGetCurrentProfile,
}))

const { handleGetProfile } = await import("../src/controllers/profileController.js")

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
    mockGetCurrentProfile.mockReset()
  })

  test("Authorization Bearer token 有效時回傳 profile", async () => {
    const profile = {
      id: 1,
      username: "測試玩家",
      avatarId: 2,
    }
    mockGetCurrentProfile.mockResolvedValueOnce(profile)

    const req = {
      headers: {
        authorization: "Bearer valid-token",
      },
    }
    const res = createMockResponse()

    await handleGetProfile(req, res)

    expect(mockGetCurrentProfile).toHaveBeenCalledWith("valid-token")
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ profile })
  })

  test("沒有 Authorization header 時回傳 401", async () => {
    const error = new Error("缺少登入驗證token")
    error.statusCode = 401
    mockGetCurrentProfile.mockRejectedValueOnce(error)

    const req = {
      headers: {},
    }
    const res = createMockResponse()

    await handleGetProfile(req, res)

    expect(mockGetCurrentProfile).toHaveBeenCalledWith("")
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      message: "缺少登入驗證token",
    })
  })

  test("玩家資料不存在時回傳 404", async () => {
    const error = new Error("找不到玩家資料")
    error.statusCode = 404
    mockGetCurrentProfile.mockRejectedValueOnce(error)

    const req = {
      headers: {
        authorization: "Bearer valid-token",
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
