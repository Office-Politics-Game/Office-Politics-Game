import { readFile } from "node:fs/promises"
import { jest } from "@jest/globals"

const getDirectMessagesMock = jest.fn()
const sendDirectMessageMock = jest.fn()
const getSocketServerMock = jest.fn()

jest.unstable_mockModule("../src/services/chatService.js", () => ({
  getDirectMessages: getDirectMessagesMock,
  sendDirectMessage: sendDirectMessageMock,
}))

jest.unstable_mockModule("../src/socket/index.js", () => ({
  getChatPlayerRoom: (playerId) => `chat:player:${playerId}`,
  getSocketServer: getSocketServerMock,
}))

const {
  handleGetDirectMessages,
  handleSendDirectMessage,
} = await import("../src/controllers/chatController.js")

function createMockResponse() {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  }

  res.status.mockReturnValue(res)
  res.json.mockReturnValue(res)

  return res
}

beforeEach(() => {
  getDirectMessagesMock.mockReset()
  sendDirectMessageMock.mockReset()
  getSocketServerMock.mockReset()
  getSocketServerMock.mockReturnValue(null)
})

describe("chatController", () => {
  test("handleSendDirectMessage() returns created direct message", async () => {
    const directMessage = {
      id: 99,
      senderPlayerId: 1,
      receiverPlayerId: 2,
      content: "hello",
      createdAt: "2026-07-06T10:00:00.000Z",
    }
    sendDirectMessageMock.mockResolvedValueOnce(directMessage)

    const req = {
      player: { id: 1 },
      params: { friendId: "2" },
      body: {
        playerId: 999,
        content: "hello",
      },
    }
    const res = createMockResponse()

    await handleSendDirectMessage(req, res)

    expect(sendDirectMessageMock).toHaveBeenCalledWith({
      playerId: 1,
      friendId: 2,
      content: "hello",
    })
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({
      message: "訊息已送出",
      directMessage,
    })
  })

  test("handleSendDirectMessage() emits the persisted message to the receiver room", async () => {
    const directMessage = {
      id: 99,
      senderPlayerId: 1,
      receiverPlayerId: 2,
      content: "hello",
      createdAt: "2026-07-06T10:00:00.000Z",
    }
    const emitMock = jest.fn()
    const toMock = jest.fn(() => ({ emit: emitMock }))
    getSocketServerMock.mockReturnValueOnce({ to: toMock })
    sendDirectMessageMock.mockResolvedValueOnce(directMessage)
    const req = {
      player: { id: 1 },
      params: { friendId: "2" },
      body: { playerId: 999, content: "hello" },
    }
    const res = createMockResponse()

    await handleSendDirectMessage(req, res)

    expect(toMock).toHaveBeenCalledWith("chat:player:2")
    expect(emitMock).toHaveBeenCalledWith("chat:message", directMessage)
    expect(res.status).toHaveBeenCalledWith(201)
  })

  test("handleSendDirectMessage() keeps the REST success when no socket server exists", async () => {
    const directMessage = {
      id: 100,
      senderPlayerId: 1,
      receiverPlayerId: 2,
      content: "stored",
      createdAt: "2026-07-06T10:01:00.000Z",
    }
    sendDirectMessageMock.mockResolvedValueOnce(directMessage)
    const req = {
      player: { id: 1 },
      params: { friendId: "2" },
      body: { content: "stored" },
    }
    const res = createMockResponse()

    await handleSendDirectMessage(req, res)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({
      message: "訊息已送出",
      directMessage,
    })
  })

  test("handleSendDirectMessage() keeps the REST success when socket emit throws", async () => {
    const directMessage = {
      id: 101,
      senderPlayerId: 1,
      receiverPlayerId: 2,
      content: "stored once",
      createdAt: "2026-07-06T10:02:00.000Z",
    }
    const emitError = new Error("socket unavailable")
    const emitMock = jest.fn(() => {
      throw emitError
    })
    getSocketServerMock.mockReturnValueOnce({
      to: jest.fn(() => ({ emit: emitMock })),
    })
    sendDirectMessageMock.mockResolvedValueOnce(directMessage)
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    const req = {
      player: { id: 1 },
      params: { friendId: "2" },
      body: { content: "stored once" },
    }
    const res = createMockResponse()

    await handleSendDirectMessage(req, res)

    expect(sendDirectMessageMock).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({
      message: "訊息已送出",
      directMessage,
    })
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "好友私訊即時推播失敗",
      emitError,
    )
    consoleErrorSpy.mockRestore()
  })

  test("handleSendDirectMessage() rejects invalid request payload", async () => {
    const req = {
      player: { id: 1 },
      params: { friendId: "2" },
      body: {},
    }
    const res = createMockResponse()

    await handleSendDirectMessage(req, res)

    expect(sendDirectMessageMock).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: "缺少玩家ID或訊息內容",
    })
  })

  test("handleGetDirectMessages() returns direct message history", async () => {
    const messages = [
      {
        id: 50,
        senderPlayerId: 1,
        receiverPlayerId: 2,
        content: "hello",
        createdAt: "2026-07-06T10:00:00.000Z",
      },
    ]
    getDirectMessagesMock.mockResolvedValueOnce(messages)

    const req = {
      player: { id: 1 },
      params: { friendId: "2" },
      query: { playerId: "999" },
    }
    const res = createMockResponse()

    await handleGetDirectMessages(req, res)

    expect(getDirectMessagesMock).toHaveBeenCalledWith({
      playerId: 1,
      friendId: 2,
    })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ messages })
  })

  test("handleGetDirectMessages() rejects invalid request query", async () => {
    const req = {
      player: null,
      params: { friendId: "2" },
      query: {},
    }
    const res = createMockResponse()

    await handleGetDirectMessages(req, res)

    expect(getDirectMessagesMock).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: "缺少玩家ID或聊天對象ID",
    })
  })

  test("handleSendDirectMessage() preserves service error status", async () => {
    const error = new Error("只能和好友傳送訊息")
    error.statusCode = 403
    sendDirectMessageMock.mockRejectedValueOnce(error)

    const req = {
      player: { id: 1 },
      params: { friendId: "2" },
      body: {
        playerId: 999,
        content: "hello",
      },
    }
    const res = createMockResponse()

    await handleSendDirectMessage(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({
      message: "只能和好友傳送訊息",
      error: "只能和好友傳送訊息",
    })
    expect(getSocketServerMock).not.toHaveBeenCalled()
  })

  test("chat routes require HttpOnly Cookie authentication before controllers", async () => {
    const source = await readFile(
      new URL("../src/routes/chatRoutes.js", import.meta.url),
      "utf8",
    )

    expect(source).toMatch(/router\.use\(requireMemberAuth\)/)
    expect(source).toMatch(
      /router\.get\("\/direct\/:friendId\/messages", handleGetDirectMessages\)/,
    )
    expect(source).toMatch(
      /router\.post\("\/direct\/:friendId\/messages", handleSendDirectMessage\)/,
    )
  })
})
