import { jest } from "@jest/globals"

const kickPlayerMock = jest.fn()

jest.unstable_mockModule("../src/services/roomService.js", () => ({
  createRoom: jest.fn(),
  joinRoom: jest.fn(),
  updateReady: jest.fn(),
  getRoomState: jest.fn(),
  kickPlayer: kickPlayerMock,
  startGame: jest.fn(),
}))

const { handleKickPlayer } = await import("../src/controllers/roomController.js")

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
  kickPlayerMock.mockReset()
})

describe("roomController handleKickPlayer", () => {
  test("成功時回傳 200 與最新房間狀態", async () => {
    const roomState = {
      room: { id: 10, roomCode: "ROOM01", hostPlayerId: 1, status: "waiting" },
      players: [{ playerId: 1, role: "host", seatOrder: 1 }],
    }
    kickPlayerMock.mockResolvedValueOnce(roomState)
    const req = {
      params: { roomCode: "ROOM01", targetPlayerId: "2" },
      body: { requesterPlayerId: 1 },
    }
    const res = createMockResponse()

    await handleKickPlayer(req, res)

    expect(kickPlayerMock).toHaveBeenCalledWith({
      roomCode: "ROOM01",
      requesterPlayerId: 1,
      targetPlayerId: 2,
    })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      message: "玩家已移出房間",
      roomState,
    })
  })

  test.each([
    [{}, { requesterPlayerId: 1 }],
    [{ targetPlayerId: "abc" }, { requesterPlayerId: 1 }],
    [{ targetPlayerId: "2" }, {}],
    [{ targetPlayerId: "2" }, { requesterPlayerId: 0 }],
  ])("無效 ID 時回傳 400", async (params, body) => {
    const req = { params: { roomCode: "ROOM01", ...params }, body }
    const res = createMockResponse()

    await handleKickPlayer(req, res)

    expect(kickPlayerMock).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: "缺少或無效的玩家ID" })
  })

  test.each([403, 404])("service 指定 %i 時保留錯誤狀態", async (statusCode) => {
    const error = new Error("操作被拒絕")
    error.statusCode = statusCode
    kickPlayerMock.mockRejectedValueOnce(error)
    const req = {
      params: { roomCode: "ROOM01", targetPlayerId: "2" },
      body: { requesterPlayerId: 1 },
    }
    const res = createMockResponse()

    await handleKickPlayer(req, res)

    expect(res.status).toHaveBeenCalledWith(statusCode)
    expect(res.json).toHaveBeenCalledWith({
      message: "操作被拒絕",
      error: "操作被拒絕",
    })
  })

  test("未知錯誤回傳 500 與安全訊息", async () => {
    kickPlayerMock.mockRejectedValueOnce(new Error("database unavailable"))
    const req = {
      params: { roomCode: "ROOM01", targetPlayerId: "2" },
      body: { requesterPlayerId: 1 },
    }
    const res = createMockResponse()

    await handleKickPlayer(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      message: "移出玩家失敗",
      error: "database unavailable",
    })
  })
})
