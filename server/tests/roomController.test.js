import { jest } from "@jest/globals"

const kickPlayerMock = jest.fn()
const leaveRoomMock = jest.fn()
const emitMock = jest.fn()
const toMock = jest.fn(() => ({ emit: emitMock }))

jest.unstable_mockModule("../src/services/roomService.js", () => ({
  createRoom: jest.fn(),
  joinRoom: jest.fn(),
  updateReady: jest.fn(),
  getRoomState: jest.fn(),
  kickPlayer: kickPlayerMock,
  leaveRoom: leaveRoomMock,
  startGame: jest.fn(),
  addComputerPlayer: jest.fn(),
}))

jest.unstable_mockModule("../src/socket/index.js", () => ({
  getSocketServer: jest.fn(() => ({
    to: toMock,
  })),
}))

const { handleKickPlayer, handleLeaveRoom } = await import("../src/controllers/roomController.js")

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
  leaveRoomMock.mockReset()
  emitMock.mockReset()
  toMock.mockReset()
  toMock.mockReturnValue({ emit: emitMock })
})

describe("roomController handleLeaveRoom", () => {
  test("returns the leave result and broadcasts retained room state", async () => {
    const roomState = {
      room: { roomCode: "ROOM01", hostPlayerId: 1, status: "waiting" },
      players: [{ playerId: 1, role: "host", seatOrder: 1 }],
    }
    leaveRoomMock.mockResolvedValueOnce({ dissolved: false, roomState })
    const req = { params: { roomCode: "ROOM01" }, body: { playerId: 2 } }
    const res = createMockResponse()

    await handleLeaveRoom(req, res)

    expect(leaveRoomMock).toHaveBeenCalledWith({ roomCode: "ROOM01", playerId: 2 })
    expect(toMock).toHaveBeenCalledWith("ROOM01")
    expect(emitMock).toHaveBeenCalledWith("room:state", roomState)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ dissolved: false, roomState })
  })

  test("returns dissolved room contract without requesting room state", async () => {
    leaveRoomMock.mockResolvedValueOnce({ dissolved: true, roomCode: "ROOM01" })
    const req = { params: { roomCode: "ROOM01" }, body: { playerId: 1 } }
    const res = createMockResponse()

    await handleLeaveRoom(req, res)

    expect(emitMock).toHaveBeenCalledWith("room:dissolved", { roomCode: "ROOM01" })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ dissolved: true, roomCode: "ROOM01" })
  })
})

describe("roomController handleKickPlayer", () => {
  test("成功移出玩家時回傳 200 並同步房間狀態", async () => {
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
    expect(toMock).toHaveBeenCalledWith("ROOM01")
    expect(emitMock).toHaveBeenCalledWith("room:state", roomState)
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
  ])("參數缺失或格式錯誤時回傳 400", async (params, body) => {
    const req = { params: { roomCode: "ROOM01", ...params }, body }
    const res = createMockResponse()

    await handleKickPlayer(req, res)

    expect(kickPlayerMock).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: "缺少或無效的玩家ID",
    })
  })

  test.each([403, 404, 409])(
    "service 回傳 %i 時透傳原始錯誤訊息",
    async (statusCode) => {
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
    }
  )

  test("未預期錯誤時回傳 500 與預設訊息", async () => {
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
