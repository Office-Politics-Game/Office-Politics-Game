import { jest } from "@jest/globals"

const mockGetProfile = jest.fn()
const mockGetProfileMatches = jest.fn()
const mockSetProfileTitle = jest.fn()
const mockUpdateProfile = jest.fn()
const mockSocketEmit = jest.fn()
const mockGetSocketServer = jest.fn()

jest.unstable_mockModule("../src/services/profileService.js", () => ({
  getProfile: mockGetProfile,
  getProfileMatches: mockGetProfileMatches,
  setProfileTitle: mockSetProfileTitle,
  updateProfile: mockUpdateProfile,
}))

jest.unstable_mockModule("../src/socket/index.js", () => ({
  getSocketServer: mockGetSocketServer,
}))

const {
  handleGetProfile,
  handleGetProfileMatches,
  handleSetProfileTitle,
  handleUpdateProfile,
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
    mockGetProfileMatches.mockReset()
    mockSetProfileTitle.mockReset()
    mockUpdateProfile.mockReset()
    mockSocketEmit.mockReset()
    mockGetSocketServer.mockReset()
    mockGetSocketServer.mockReturnValue({ emit: mockSocketEmit })
  })

  test("returns profile for authenticated player", async () => {
    const profile = {
      id: 1,
      username: "Test Player",
      avatarId: 2,
      bio: "hello",
      title: "First Win",
    }

    mockGetProfile.mockResolvedValueOnce(profile)

    const req = { player: { id: 1 } }
    const res = createMockResponse()

    await handleGetProfile(req, res)

    expect(mockGetProfile).toHaveBeenCalledWith(1)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ profile })
  })

  test("updates profile with player id and request body", async () => {
    const profile = {
      id: 1,
      username: "New Name",
      avatarId: 3,
      bio: "new bio",
    }

    mockUpdateProfile.mockResolvedValueOnce(profile)

    const req = {
      player: { id: 1 },
      body: {
        username: "New Name",
        bio: "new bio",
        avatarId: 3,
      },
    }
    const res = createMockResponse()

    await handleUpdateProfile(req, res)

    expect(mockUpdateProfile).toHaveBeenCalledWith(1, req.body)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ profile })
  })

  test("returns profile matches with player id and query", async () => {
    const matches = [{ id: 10, result: "win" }]

    mockGetProfileMatches.mockResolvedValueOnce(matches)

    const req = {
      player: { id: 1 },
      query: { limit: "20" },
    }
    const res = createMockResponse()

    await handleGetProfileMatches(req, res)

    expect(mockGetProfileMatches).toHaveBeenCalledWith(1, req.query)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ matches })
  })

  test("sets profile title with player id and achievement code", async () => {
    const profile = {
      id: 1,
      username: "Test Player",
      title: "First Win",
    }

    mockSetProfileTitle.mockResolvedValueOnce(profile)

    const req = {
      player: { id: 1 },
      body: { achievementCode: "first_game_win" },
    }
    const res = createMockResponse()

    await handleSetProfileTitle(req, res)

    expect(mockSetProfileTitle).toHaveBeenCalledWith(1, "first_game_win")
    expect(mockSocketEmit).toHaveBeenCalledWith("player:title-updated", {
      playerId: 1,
      title: "First Win",
    })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ profile })
  })

  test("forwards service status codes", async () => {
    const error = new Error("找不到玩家資料")
    error.statusCode = 404
    mockGetProfile.mockRejectedValueOnce(error)

    const req = { player: { id: 999 } }
    const res = createMockResponse()

    await handleGetProfile(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: "找不到玩家資料",
    })
  })
})
