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

const { addComputerPlayer, getRoomState, kickPlayer, leaveRoom } = await import(
  "../src/services/roomService.js"
)

const room = {
  id: 10,
  room_code: "ROOM01",
  host_player_id: 1,
  status: "waiting",
}

const members = [
  { player_id: 1, role: "host", seat_order: 1, is_computer: false },
  { player_id: 2, role: "player", seat_order: 2, is_computer: false },
  { player_id: 3, role: "player", seat_order: 3, is_computer: false },
  { player_id: 4, role: "player", seat_order: 4, is_computer: false },
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
  test("waiting-room state includes the equipped achievement title", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [room] })
      .mockResolvedValueOnce({
        rows: [
          {
            player_id: 1,
            username: "A",
            title: "First Win",
            avatar_id: 1,
            role: "host",
            seat_order: 1,
            is_ready: true,
            is_alive: true,
            is_computer: false,
            card_skin_overrides: {},
          },
        ],
      })

    const result = await getRoomState({ roomCode: "ROOM01" })

    expect(queryMock.mock.calls[1][0]).toContain("p.title")
    expect(result.players[0]).toMatchObject({
      playerId: 1,
      title: "First Win",
    })
  })

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

    await expect(
      kickPlayer({ roomCode: "ROOM01", requesterPlayerId: 9, targetPlayerId: 2 })
    ).rejects.toMatchObject({ statusCode: 404 })
  })

  test("Kick authorization and membership validation: 目標不在房間時回傳 404", async () => {
    clientQueryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [room] })
      .mockResolvedValueOnce({ rows: members })

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

    await expect(
      kickPlayer({ roomCode: "ROOM01", requesterPlayerId: 1, targetPlayerId: 2 })
    ).rejects.toMatchObject({ statusCode: 409 })
  })

  test("Host can remove a waiting-room member and Seat order remains contiguous", async () => {
    const updatedPlayers = [
      {
        player_id: 1,
        username: "A",
        avatar_id: 1,
        role: "host",
        seat_order: 1,
        is_ready: true,
        is_alive: true,
        is_computer: false,
      },
      {
        player_id: 2,
        username: "B",
        avatar_id: 2,
        role: "player",
        seat_order: 2,
        is_ready: false,
        is_alive: true,
        is_computer: false,
      },
      {
        player_id: 4,
        username: "D",
        avatar_id: 4,
        role: "player",
        seat_order: 3,
        is_ready: false,
        is_alive: true,
        is_computer: false,
      },
    ]

    clientQueryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [room] })
      .mockResolvedValueOnce({ rows: members })
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
    expect(result.players.map((player) => player.seatOrder)).toEqual([1, 2, 3])
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

describe("roomService addComputerPlayer", () => {
  test("電腦暱稱重複時不會中止交易並能以新名稱重試", async () => {
    clientQueryMock
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [room] })
      .mockResolvedValueOnce({ rows: [members[0]] })
      .mockResolvedValueOnce({ rows: [] }) // username conflict
      .mockResolvedValueOnce({
        rows: [{ id: 20, username: "CPU-abcd", avatar_id: 1 }],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] }) // COMMIT

    queryMock
      .mockResolvedValueOnce({ rows: [room] })
      .mockResolvedValueOnce({
        rows: [
          {
            player_id: 1,
            username: "Host",
            avatar_id: 1,
            role: "host",
            seat_order: 1,
            is_ready: true,
            is_alive: true,
            is_computer: false,
          },
          {
            player_id: 20,
            username: "CPU-abcd",
            avatar_id: 1,
            role: "computer",
            seat_order: 2,
            is_ready: true,
            is_alive: true,
            is_computer: true,
          },
        ],
      })

    const result = await addComputerPlayer({
      roomCode: "ROOM01",
      hostPlayerId: 1,
      username: "CPU",
    })

    const playerInsertCalls = clientQueryMock.mock.calls.filter(([sql]) =>
      String(sql).includes("INSERT INTO players"),
    )

    expect(playerInsertCalls).toHaveLength(2)
    expect(playerInsertCalls[0][0]).toContain("ON CONFLICT DO NOTHING")
    expect(clientQueryMock).toHaveBeenCalledWith("COMMIT")
    expect(result.players.at(-1)).toMatchObject({
      playerId: 20,
      username: "CPU-abcd",
      isComputer: true,
    })
  })
})

describe("roomService leaveRoom", () => {
  test.each([undefined, "abc", 0, -1])(
    "rejects invalid playerId %p with 400",
    async (playerId) => {
      await expect(leaveRoom({ roomCode: "ROOM01", playerId })).rejects.toMatchObject({
        statusCode: 400,
      })
      expect(connectMock).not.toHaveBeenCalled()
    },
  )

  test("removes a non-host and compacts remaining seats", async () => {
    const nonHostMembers = members.slice(0, 3)
    const roomState = {
      room: { roomCode: "ROOM01", hostPlayerId: 1, status: "waiting" },
      players: [
        { playerId: 1, seatOrder: 1 },
        { playerId: 3, seatOrder: 2 },
      ],
    }

    clientQueryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [room] })
      .mockResolvedValueOnce({ rows: nonHostMembers })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
    queryMock
      .mockResolvedValueOnce({ rows: [room] })
      .mockResolvedValueOnce({
        rows: roomState.players.map((player) => ({
          player_id: player.playerId,
          username: String(player.playerId),
          role: player.playerId === 1 ? "host" : "player",
          seat_order: player.seatOrder,
          is_ready: false,
          is_alive: true,
          is_computer: false,
        })),
      })

    const result = await leaveRoom({ roomCode: "ROOM01", playerId: 2 })

    expect(clientQueryMock).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM game_room_players"),
      [10, 2],
    )
    expect(clientQueryMock).toHaveBeenCalledWith(
      expect.stringContaining("SET seat_order = $1"),
      [2, 10, 3],
    )
    expect(result).toMatchObject({ dissolved: false })
    expect(result.roomState.players.map((player) => player.seatOrder)).toEqual([1, 2])
  })

  test("transfers host to the lowest-seat human and skips computers", async () => {
    const transferMembers = [
      members[0],
      { ...members[1], role: "computer", is_computer: true },
      { ...members[2], player_id: 30 },
      { ...members[3], player_id: 40 },
    ]

    clientQueryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [room] })
      .mockResolvedValueOnce({ rows: transferMembers })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
    queryMock
      .mockResolvedValueOnce({ rows: [{ ...room, host_player_id: 30 }] })
      .mockResolvedValueOnce({
        rows: [
          { player_id: 2, username: "CPU", role: "computer", seat_order: 1, is_computer: true },
          { player_id: 30, username: "C", role: "host", seat_order: 2, is_computer: false },
          { player_id: 40, username: "D", role: "player", seat_order: 3, is_computer: false },
        ],
      })

    const result = await leaveRoom({ roomCode: "ROOM01", playerId: 1 })

    expect(clientQueryMock).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE game_rooms"),
      [30, 10],
    )
    expect(clientQueryMock).toHaveBeenCalledWith(
      expect.stringContaining("role = CASE"),
      [30, 10],
    )
    expect(result).toMatchObject({
      dissolved: false,
      roomState: { room: { hostPlayerId: 30 } },
    })
  })

  test("dissolves the room when the host has no human successor", async () => {
    clientQueryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [room] })
      .mockResolvedValueOnce({
        rows: [members[0], { ...members[1], role: "computer", is_computer: true }],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })

    const result = await leaveRoom({ roomCode: "ROOM01", playerId: 1 })

    const membershipDeleteIndex = clientQueryMock.mock.calls.findIndex(([sql]) =>
      String(sql).includes("DELETE FROM game_room_players"),
    )
    const roomDeleteIndex = clientQueryMock.mock.calls.findIndex(([sql]) =>
      String(sql).includes("DELETE FROM game_rooms"),
    )
    expect(membershipDeleteIndex).toBeGreaterThan(-1)
    expect(roomDeleteIndex).toBeGreaterThan(membershipDeleteIndex)
    expect(result).toEqual({ dissolved: true, roomCode: "ROOM01" })
  })

  test("rejects leave outside a waiting room with 409", async () => {
    clientQueryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ ...room, status: "playing" }] })
      .mockResolvedValueOnce({ rows: [] })

    await expect(leaveRoom({ roomCode: "ROOM01", playerId: 2 })).rejects.toMatchObject({
      statusCode: 409,
    })
    expect(clientQueryMock).toHaveBeenCalledWith("ROLLBACK")
  })

  test("rolls back when seat compaction fails", async () => {
    clientQueryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [room] })
      .mockResolvedValueOnce({ rows: members.slice(0, 3) })
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce(new Error("seat update failed"))
      .mockResolvedValueOnce({ rows: [] })

    await expect(leaveRoom({ roomCode: "ROOM01", playerId: 2 })).rejects.toThrow(
      "seat update failed",
    )
    expect(clientQueryMock).toHaveBeenCalledWith("ROLLBACK")
    expect(clientQueryMock).not.toHaveBeenCalledWith("COMMIT")
  })
})
