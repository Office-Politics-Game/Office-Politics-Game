import { jest } from "@jest/globals"

const mockGetCurrentProfile = jest.fn()
const mockSetProfileTitle = jest.fn()

jest.unstable_mockModule("../src/services/profileService.js", () => ({
  getCurrentProfile: mockGetCurrentProfile,
  setProfileTitle: mockSetProfileTitle,
}))

const { handleGetProfile, handleSetProfileTitle } = await import(
  "../src/controllers/profileController.js"
)

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
    mockSetProfileTitle.mockReset()
  })

  test("returns profile for Authorization Bearer token", async () => {
    const profile = {
      id: 1,
      username: "Test Player",
      avatarId: 2,
      title: "First Win",
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

  test("returns 401 for missing Authorization header", async () => {
    const error = new Error("Missing token")
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
      message: "Missing token",
    })
  })

  test("returns 404 when profile player is missing", async () => {
    const error = new Error("Player not found")
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
      message: "Player not found",
    })
  })

  test("sets profile title and returns updated profile", async () => {
    const profile = {
      id: 1,
      username: "Test Player",
      title: "First Win",
    }
    mockSetProfileTitle.mockResolvedValueOnce(profile)

    const req = {
      headers: {
        authorization: "Bearer valid-token",
      },
      body: {
        achievementCode: "first_game_win",
      },
    }
    const res = createMockResponse()

    await handleSetProfileTitle(req, res)

    expect(mockSetProfileTitle).toHaveBeenCalledWith(
      "valid-token",
      "first_game_win",
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ profile })
  })

  test("forwards title service errors", async () => {
    const error = new Error("Achievement has not been unlocked")
    error.statusCode = 403
    mockSetProfileTitle.mockRejectedValueOnce(error)

    const req = {
      headers: {
        authorization: "Bearer valid-token",
      },
      body: {
        achievementCode: "first_game_win",
      },
    }
    const res = createMockResponse()

    await handleSetProfileTitle(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({
      message: "Achievement has not been unlocked",
    })
  })
})
