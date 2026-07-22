import { jest } from "@jest/globals"

const serviceMocks = {
  acceptFriendRequest: jest.fn(),
  blockPlayer: jest.fn(),
  getBlockedPlayers: jest.fn(),
  getFriends: jest.fn(),
  getReceivedFriendRequests: jest.fn(),
  getSentFriendRequests: jest.fn(),
  rejectFriendRequest: jest.fn(),
  removeFriend: jest.fn(),
  sendFriendRequest: jest.fn(),
  unblockPlayer: jest.fn(),
}
const getSocketServerMock = jest.fn()

jest.unstable_mockModule("../src/services/friendService.js", () => serviceMocks)
jest.unstable_mockModule("../src/socket/index.js", () => ({
  getFriendPlayerRoom: (playerId) => `friend:player:${playerId}`,
  getSocketServer: getSocketServerMock,
}))

const {
  handleAcceptFriendRequest,
  handleBlockPlayer,
  handleRemoveFriend,
  handleRejectFriendRequest,
  handleSendFriendRequest,
  handleUnblockPlayer,
} = await import("../src/controllers/friendController.js")

function createMockResponse() {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  }

  res.status.mockReturnValue(res)
  res.json.mockReturnValue(res)

  return res
}

function installSocketServer() {
  const emit = jest.fn()
  const to = jest.fn(() => ({ emit }))
  getSocketServerMock.mockReturnValue({ to })
  return { emit, to }
}

const friendship = {
  id: 10,
  playerId: 1,
  friendId: 2,
  status: "pending",
  createdAt: "2026-07-22T10:00:00.000Z",
}

beforeEach(() => {
  Object.values(serviceMocks).forEach((mock) => mock.mockReset())
  getSocketServerMock.mockReset()
  getSocketServerMock.mockReturnValue(null)
})

describe("friendController realtime invalidation", () => {
  test("sending a friend request invalidates the receiver", async () => {
    const { emit, to } = installSocketServer()
    serviceMocks.sendFriendRequest.mockResolvedValueOnce(friendship)
    const req = { body: { playerId: 1, targetPlayerId: 2 } }
    const res = createMockResponse()

    await handleSendFriendRequest(req, res)

    expect(to).toHaveBeenCalledWith("friend:player:2")
    expect(emit).toHaveBeenCalledWith("friend:data-invalidated", {})
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({ request: friendship })
  })

  test.each([
    ["accepting", handleAcceptFriendRequest, serviceMocks.acceptFriendRequest],
    ["rejecting", handleRejectFriendRequest, serviceMocks.rejectFriendRequest],
  ])("%s a request invalidates the original requester", async (_name, handler, serviceMock) => {
    const { emit, to } = installSocketServer()
    serviceMock.mockResolvedValueOnce(friendship)
    const req = { params: { id: "10" }, body: { playerId: 2 } }
    const res = createMockResponse()

    await handler(req, res)

    expect(to).toHaveBeenCalledWith("friend:player:1")
    expect(emit).toHaveBeenCalledWith("friend:data-invalidated", {})
    expect(res.status).toHaveBeenCalledWith(200)
  })

  test.each([
    [
      "removing a friend",
      handleRemoveFriend,
      serviceMocks.removeFriend,
      { params: { id: "10" }, body: { playerId: 1 } },
    ],
    [
      "blocking a player",
      handleBlockPlayer,
      serviceMocks.blockPlayer,
      { body: { playerId: 1, targetPlayerId: 2 } },
    ],
    [
      "unblocking a player",
      handleUnblockPlayer,
      serviceMocks.unblockPlayer,
      { params: { id: "10" }, body: { playerId: 1 } },
    ],
  ])("%s invalidates the other player", async (_name, handler, serviceMock, req) => {
    const { emit, to } = installSocketServer()
    serviceMock.mockResolvedValueOnce(friendship)
    const res = createMockResponse()

    await handler(req, res)

    expect(to).toHaveBeenCalledWith("friend:player:2")
    expect(emit).toHaveBeenCalledWith("friend:data-invalidated", {})
    expect(res.status).toHaveBeenCalledWith(200)
  })

  test("service failure preserves its status and emits nothing", async () => {
    const error = new Error("好友邀請已存在")
    error.statusCode = 409
    serviceMocks.sendFriendRequest.mockRejectedValueOnce(error)
    const req = { body: { playerId: 1, targetPlayerId: 2 } }
    const res = createMockResponse()

    await handleSendFriendRequest(req, res)

    expect(getSocketServerMock).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith({
      message: "好友邀請已存在",
      error: "好友邀請已存在",
    })
  })

  test("missing Socket server keeps the existing REST success", async () => {
    serviceMocks.sendFriendRequest.mockResolvedValueOnce(friendship)
    const req = { body: { playerId: 1, targetPlayerId: 2 } }
    const res = createMockResponse()

    await handleSendFriendRequest(req, res)

    expect(serviceMocks.sendFriendRequest).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({ request: friendship })
  })

  test("Socket emit failure is logged without changing REST success", async () => {
    const emitError = new Error("socket unavailable")
    const emit = jest.fn(() => {
      throw emitError
    })
    getSocketServerMock.mockReturnValue({
      to: jest.fn(() => ({ emit })),
    })
    serviceMocks.sendFriendRequest.mockResolvedValueOnce(friendship)
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    const req = { body: { playerId: 1, targetPlayerId: 2 } }
    const res = createMockResponse()

    await handleSendFriendRequest(req, res)

    expect(serviceMocks.sendFriendRequest).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({ request: friendship })
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "好友關係即時同步失敗",
      emitError,
    )
    consoleErrorSpy.mockRestore()
  })
})
