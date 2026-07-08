import { jest } from "@jest/globals"

const queryMock = jest.fn()

jest.unstable_mockModule("../src/db/index.js", () => ({
  default: {
    query: queryMock,
  },
}))

const {
  getDirectMessages,
  sendDirectMessage,
} = await import("../src/services/chatService.js")

beforeEach(() => {
  queryMock.mockReset()
})

describe("sendDirectMessage", () => {
  test("accepted friends can send a trimmed direct message", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }] })
      .mockResolvedValueOnce({
        rows: [{ id: 10, status: "accepted" }],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 99,
            sender_player_id: 1,
            receiver_player_id: 2,
            content: "hello",
            created_at: "2026-07-06T10:00:00.000Z",
          },
        ],
      })

    const message = await sendDirectMessage({
      playerId: 1,
      friendId: 2,
      content: " hello ",
    })

    expect(message).toEqual({
      id: 99,
      senderPlayerId: 1,
      receiverPlayerId: 2,
      content: "hello",
      createdAt: "2026-07-06T10:00:00.000Z",
    })
    expect(queryMock).toHaveBeenLastCalledWith(
      expect.stringContaining("INSERT INTO direct_messages"),
      [1, 2, "hello"],
    )
  })

  test("non-friends cannot send a direct message", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 3 }] })
      .mockResolvedValueOnce({ rows: [] })

    await expect(
      sendDirectMessage({ playerId: 1, friendId: 3, content: "hello" }),
    ).rejects.toMatchObject({
      message: "只能和好友傳送訊息",
      statusCode: 403,
    })
    expect(queryMock).toHaveBeenCalledTimes(2)
  })

  test("blocked relationships cannot send a direct message", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }] })
      .mockResolvedValueOnce({
        rows: [{ id: 10, status: "blocked" }],
      })

    await expect(
      sendDirectMessage({ playerId: 1, friendId: 2, content: "hello" }),
    ).rejects.toMatchObject({
      message: "無法傳送訊息給此玩家",
      statusCode: 403,
    })
    expect(queryMock).toHaveBeenCalledTimes(2)
  })

  test("blank direct messages are rejected", async () => {
    await expect(
      sendDirectMessage({ playerId: 1, friendId: 2, content: "   " }),
    ).rejects.toMatchObject({
      message: "訊息內容不可為空",
      statusCode: 400,
    })
    expect(queryMock).not.toHaveBeenCalled()
  })
})

describe("getDirectMessages", () => {
  test("accepted friends can read chronological direct message history", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }] })
      .mockResolvedValueOnce({
        rows: [{ id: 10, status: "accepted" }],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 50,
            sender_player_id: 1,
            receiver_player_id: 2,
            content: "first",
            created_at: "2026-07-06T10:00:00.000Z",
          },
          {
            id: 51,
            sender_player_id: 2,
            receiver_player_id: 1,
            content: "second",
            created_at: "2026-07-06T10:01:00.000Z",
          },
        ],
      })

    const messages = await getDirectMessages({ playerId: 1, friendId: 2 })

    expect(messages).toEqual([
      {
        id: 50,
        senderPlayerId: 1,
        receiverPlayerId: 2,
        content: "first",
        createdAt: "2026-07-06T10:00:00.000Z",
      },
      {
        id: 51,
        senderPlayerId: 2,
        receiverPlayerId: 1,
        content: "second",
        createdAt: "2026-07-06T10:01:00.000Z",
      },
    ])
    expect(queryMock).toHaveBeenLastCalledWith(
      expect.stringContaining("ORDER BY created_at ASC, id ASC"),
      [1, 2],
    )
  })

  test("non-friends cannot read direct message history", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 3 }] })
      .mockResolvedValueOnce({ rows: [] })

    await expect(
      getDirectMessages({ playerId: 1, friendId: 3 }),
    ).rejects.toMatchObject({
      message: "只能讀取好友聊天紀錄",
      statusCode: 403,
    })
    expect(queryMock).toHaveBeenCalledTimes(2)
  })

  test("blocked relationships cannot read direct message history", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }] })
      .mockResolvedValueOnce({
        rows: [{ id: 10, status: "blocked" }],
      })

    await expect(
      getDirectMessages({ playerId: 1, friendId: 2 }),
    ).rejects.toMatchObject({
      message: "無法讀取此聊天紀錄",
      statusCode: 403,
    })
    expect(queryMock).toHaveBeenCalledTimes(2)
  })
})
