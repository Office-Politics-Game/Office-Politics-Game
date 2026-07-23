import { readFile } from "node:fs/promises"
import { jest } from "@jest/globals"

const queryMock = jest.fn()
const connectMock = jest.fn()
const clientQueryMock = jest.fn()
const clientReleaseMock = jest.fn()

jest.unstable_mockModule("../src/db/index.js", () => ({
  default: {
    query: queryMock,
    connect: connectMock,
  },
}))

const {
  acceptRoomInvitation,
  getPendingRoomInvitations,
  rejectRoomInvitation,
  sendRoomInvitation,
} = await import("../src/services/roomInvitationService.js")

beforeEach(()=>{
  queryMock.mockReset()
  connectMock.mockReset()
  clientQueryMock.mockReset()
  clientReleaseMock.mockReset()
  connectMock.mockResolvedValue({
    query: clientQueryMock,
    release: clientReleaseMock,
  })
})

describe("sendRoomInvitation", ()=>{
  test("房主可以邀請 accepted 好友加入等待中房間", async ()=>{
    clientQueryMock
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: [
          {
            id: 8,
            room_code: "ABCD12",
            host_player_id: 1,
            status: "waiting",
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ player_count: 1, invitee_in_room: false }],
      })
      .mockResolvedValueOnce({ rows: [{ id: 3 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 10,
            room_id: 8,
            inviter_player_id: 1,
            invitee_player_id: 2,
            status: "pending",
            expires_at: "2026-07-02T12:10:00.000Z",
            responded_at: null,
            created_at: "2026-07-02T12:00:00.000Z",
          },
        ],
      })
      .mockResolvedValueOnce({})

    const invitation = await sendRoomInvitation({
      roomCode: "ABCD12",
      inviterPlayerId: 1,
      inviteePlayerId: 2,
    })

    expect(invitation).toMatchObject({
      id: 10,
      roomCode: "ABCD12",
      inviterPlayerId: 1,
      inviteePlayerId: 2,
      status: "pending",
    })
    expect(clientQueryMock).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO room_invitations"),
      [8, 1, 2, 10]
    )
    expect(clientQueryMock).toHaveBeenLastCalledWith("COMMIT")
    expect(clientReleaseMock).toHaveBeenCalled()
  })

  test("非房主不能送出房間邀請", async ()=>{
    clientQueryMock
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: [
          {
            id: 8,
            room_code: "ABCD12",
            host_player_id: 1,
            status: "waiting",
          },
        ],
      })
      .mockResolvedValueOnce({})

    await expect(
      sendRoomInvitation({
        roomCode: "ABCD12",
        inviterPlayerId: 2,
        inviteePlayerId: 3,
      })
    ).rejects.toMatchObject({
      message: "只有房主可以邀請好友",
      statusCode: 403,
    })

    expect(clientQueryMock).toHaveBeenLastCalledWith("ROLLBACK")
  })

  test("不能邀請非好友加入房間", async ()=>{
    clientQueryMock
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: [
          {
            id: 8,
            room_code: "ABCD12",
            host_player_id: 1,
            status: "waiting",
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ player_count: 1, invitee_in_room: false }],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({})

    await expect(
      sendRoomInvitation({
        roomCode: "ABCD12",
        inviterPlayerId: 1,
        inviteePlayerId: 2,
      })
    ).rejects.toMatchObject({
      message: "只能邀請好友加入房間",
      statusCode: 403,
    })

    expect(clientQueryMock).toHaveBeenLastCalledWith("ROLLBACK")
  })
})

describe("getPendingRoomInvitations", ()=>{
  test("查詢玩家待處理且未過期的房間邀請", async ()=>{
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          room_id: 8,
          inviter_player_id: 1,
          invitee_player_id: 2,
          status: "pending",
          expires_at: "2026-07-02T12:10:00.000Z",
          responded_at: null,
          created_at: "2026-07-02T12:00:00.000Z",
          room_code: "ABCD12",
          room_status: "waiting",
          inviter_id: 1,
          inviter_username: "房主",
          inviter_avatar_id: 4,
          inviter_level: 7,
          inviter_is_online: true,
          player_count: 2,
        },
      ],
    })

    const invitations = await getPendingRoomInvitations({ playerId: 2 })

    expect(invitations[0]).toMatchObject({
      id: 10,
      roomCode: "ABCD12",
      inviter: {
        playerId: 1,
        username: "房主",
      },
      room: {
        playerCount: 2,
      },
    })
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("ri.invitee_player_id = $1"),
      [2]
    )
  })

  test("query filters rooms that are not joinable or lack a valid human host", async ()=>{
    queryMock.mockResolvedValueOnce({ rows: [] })

    await getPendingRoomInvitations({ playerId: 2 })

    const [sql] = queryMock.mock.calls[0]
    expect(sql).toContain("gr.status = 'waiting'")
    expect(sql).toMatch(/SELECT COUNT\(\*\)[\s\S]*\) < 4/)
    expect(sql).toContain("host_member.role = 'host'")
    expect(sql).toContain("host_member.is_computer = false")
  })
})

describe("acceptRoomInvitation", ()=>{
  test("被邀請玩家接受後加入房間並更新邀請狀態", async ()=>{
    clientQueryMock
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: [
          {
            id: 10,
            room_id: 8,
            inviter_player_id: 1,
            invitee_player_id: 2,
            status: "pending",
            expires_at: "2026-07-02T12:10:00.000Z",
            room_code: "ABCD12",
            room_status: "waiting",
            is_expired: false,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{ player_count: 2, player_in_room: false, has_valid_host: true }],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 10,
            room_id: 8,
            inviter_player_id: 1,
            invitee_player_id: 2,
            status: "accepted",
            expires_at: "2026-07-02T12:10:00.000Z",
            responded_at: "2026-07-02T12:02:00.000Z",
            created_at: "2026-07-02T12:00:00.000Z",
          },
        ],
      })
      .mockResolvedValueOnce({})

    const result = await acceptRoomInvitation({
      invitationId: 10,
      playerId: 2,
    })

    expect(result.room.roomCode).toBe("ABCD12")
    expect(result.invitation.status).toBe("accepted")
    expect(clientQueryMock).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO game_room_players"),
      [8, 2, 3]
    )
    expect(clientQueryMock).toHaveBeenLastCalledWith("COMMIT")
  })

  test("rejects acceptance when the room has no valid human host", async ()=>{
    clientQueryMock
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: [{
          id: 10,
          room_id: 8,
          inviter_player_id: 1,
          invitee_player_id: 2,
          status: "pending",
          room_code: "ABCD12",
          room_status: "waiting",
          is_expired: false,
        }],
      })
      .mockResolvedValueOnce({
        rows: [{ player_count: 2, player_in_room: false, has_valid_host: false }],
      })
      .mockResolvedValueOnce({})

    await expect(
      acceptRoomInvitation({ invitationId: 10, playerId: 2 }),
    ).rejects.toMatchObject({ statusCode: 409 })
    expect(clientQueryMock).not.toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO game_room_players"),
      expect.anything(),
    )
  })

  test("過期邀請不能接受", async ()=>{
    clientQueryMock
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: [
          {
            id: 10,
            room_id: 8,
            inviter_player_id: 1,
            invitee_player_id: 2,
            status: "pending",
            room_code: "ABCD12",
            room_status: "waiting",
            is_expired: true,
          },
        ],
      })
      .mockResolvedValueOnce({})

    await expect(
      acceptRoomInvitation({ invitationId: 10, playerId: 2 })
    ).rejects.toMatchObject({
      message: "房間邀請已過期",
      statusCode: 410,
    })

    expect(clientQueryMock).toHaveBeenLastCalledWith("ROLLBACK")
  })
})

test("start game invalidates pending room invitations in the same service transaction", async ()=>{
  const source = await readFile(new URL("../src/services/roomService.js", import.meta.url), "utf8")

  expect(source).toMatch(/UPDATE room_invitations[\s\S]*SET status = 'expired'/)
  expect(source).toMatch(/responded_at = CURRENT_TIMESTAMP/)
})

describe("rejectRoomInvitation", ()=>{
  test("被邀請玩家可以拒絕 pending 邀請", async ()=>{
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          room_id: 8,
          inviter_player_id: 1,
          invitee_player_id: 2,
          status: "rejected",
          expires_at: "2026-07-02T12:10:00.000Z",
          responded_at: "2026-07-02T12:02:00.000Z",
          created_at: "2026-07-02T12:00:00.000Z",
        },
      ],
    })

    const invitation = await rejectRoomInvitation({
      invitationId: 10,
      playerId: 2,
    })

    expect(invitation.status).toBe("rejected")
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("SET status = 'rejected'"),
      [10, 2]
    )
  })
})
