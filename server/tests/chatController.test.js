import { jest } from "@jest/globals"

const getDirectMessagesMock = jest.fn()
const sendDirectMessageMock = jest.fn()

jest.unstable_mockModule("../src/services/chatService.js", () => ({
  getDirectMessages: getDirectMessagesMock,
  sendDirectMessage: sendDirectMessageMock,
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
      params: { friendId: "2" },
      body: {
        playerId: 1,
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

  test("handleSendDirectMessage() rejects invalid request payload", async () => {
    const req = {
      params: { friendId: "2" },
      body: {
        content: "hello",
      },
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
      params: { friendId: "2" },
      query: { playerId: "1" },
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
      params: { friendId: "2" },
      body: {
        playerId: 1,
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
  })
})
