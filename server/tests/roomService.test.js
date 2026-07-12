import { jest } from "@jest/globals"

const queryMock = jest.fn()
const clientQueryMock = jest.fn()
const releaseMock = jest.fn()
const connectMock = jest.fn()

jest.unstable_mockModule("../src/db/index.js", () => ({
  default: {
    query: queryMock,
    connect: connectMock,
  },
}))

const { kickPlayer } = await import("../src/services/roomService.js")

const room = {
  id: 10,
  room_code: "ROOM01",
  host_player_id: 1,
  status: "waiting",
}

const members = [
  { player_id: 1, role: "host", seat_order: 1 },
  { player_id: 2, role: "player", seat_order: 2 },
  { player_id: 3, role: "player", seat_order: 3 },
  { player_id: 4, role: "player", seat_order: 4 },
]

beforeEach(() => {
  queryMock.mockReset()
  clientQueryMock.mockReset()
  releaseMock.mockReset()
  connectMock.mockReset()
  connectMock.mockResolvedValue({
    query: clientQueryMock,
    release: releaseMock,
  })
})

describe("roomService kickPlayer", () => {
  test.each([undefined, "abc", 0, -1])(
    "Input and resource errors are explicit: requesterPlayerId=%p 回傳 400",
    async (requesterPlayerId) => {
      await expect(
        kickPlayer({ roomCode: "ROOM01", requesterPlayerId, targetPlayerId: 2 })
      ).rejects.toMatchObject({ statusCode: 400 })

      expect(connectMock).not.toHaveBeenCalled()
    }
  )

  test("Input and resource errors are explicit: 查無房間時回傳 404", async () => {
    clientQueryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })

    await expect(
      kickPlayer({ roomCode: "NONE", requesterPlayerId: 1, targetPlayerId: 2 })
    ).rejects.toMatchObject({ statusCode: 404 })

    expect(clientQueryMock).toHaveBeenCalledWith("ROLLBACK")
  })

  test("Kick authorization and membership validation: 非房主回傳 403", async () => {
    clientQueryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [room] })
      .mockResolvedValueOnce({ rows: members })
      .mockResolvedValueOnce({ rows: [] })

    await expect(
      kickPlayer({ roomCode: "ROOM01", requesterPlayerId: 2, targetPlayerId: 3 })
    ).rejects.toMatchObject({ statusCode: 403 })

    expect(clientQueryMock).toHaveBeenCalledWith("ROLLBACK")
  })

  test("Kick authorization and membership validation: 操作者不在房間時回傳 404", async () => {
    clientQueryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [room] })
      .mockResolvedValueOnce({ rows: members })
      .mockResolvedValueOnce({ rows: [] })

    await expect(
      kickPlayer({ roomCode: "ROOM01", requesterPlayerId: 9, targetPlayerId: 2 })
    ).rejects.toMatchObject({ statusCode: 404 })
  })

  test("Kick authorization and membership validation: 目標不在房間時回傳 404", async () => {
    clientQueryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [room] })
      .mockResolvedValueOnce({ rows: members })
      .mockResolvedValueOnce({ rows: [] })

    await expect(
      kickPlayer({ roomCode: "ROOM01", requesterPlayerId: 1, targetPlayerId: 9 })
    ).rejects.toMatchObject({ statusCode: 404 })
  })

  test("Kick authorization and membership validation: 房主不能踢除自己", async () => {
    await expect(
      kickPlayer({ roomCode: "ROOM01", requesterPlayerId: 1, targetPlayerId: 1 })
    ).rejects.toMatchObject({ statusCode: 400 })

    expect(connectMock).not.toHaveBeenCalled()
  })

  test("Kick operation is limited to waiting rooms", async () => {
    clientQueryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ ...room, status: "playing" }] })
      .mockResolvedValueOnce({ rows: members })
      .mockResolvedValueOnce({ rows: [] })

    await expect(
      kickPlayer({ roomCode: "ROOM01", requesterPlayerId: 1, targetPlayerId: 2 })
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  test("Host can remove a waiting-room member and Seat order remains contiguous", async () => {
    const updatedPlayers = [
      { player_id: 1, username: "A", role: "host", seat_order: 1 },
      { player_id: 2, username: "B", role: "player", seat_order: 2 },
      { player_id: 4, username: "D", role: "player", seat_order: 3 },
    ]

    clientQueryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [room] })
      .mockResolvedValueOnce({ rows: members })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
    queryMock
      .mockResolvedValueOnce({ rows: [room] })
      .mockResolvedValueOnce({ rows: updatedPlayers })

    const result = await kickPlayer({
      roomCode: "ROOM01",
      requesterPlayerId: 1,
      targetPlayerId: 3,
    })

    expect(clientQueryMock).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM game_room_players"),
      [10, 3]
    )
    expect(clientQueryMock).toHaveBeenCalledWith(
      expect.stringContaining("SET seat_order = $1"),
      [3, 10, 4]
    )
    expect(clientQueryMock).toHaveBeenCalledWith("COMMIT")
    expect(result.players.map((player) => player.playerId)).toEqual([1, 2, 4])
  })

  test("Removal is atomic: 座位更新失敗時 rollback", async () => {
    clientQueryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [room] })
      .mockResolvedValueOnce({ rows: members })
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce(new Error("seat update failed"))
      .mockResolvedValueOnce({ rows: [] })

    await expect(
      kickPlayer({ roomCode: "ROOM01", requesterPlayerId: 1, targetPlayerId: 3 })
    ).rejects.toThrow("seat update failed")

    expect(clientQueryMock).toHaveBeenCalledWith("ROLLBACK")
    expect(clientQueryMock).not.toHaveBeenCalledWith("COMMIT")
    expect(releaseMock).toHaveBeenCalledTimes(1)
  })
})
