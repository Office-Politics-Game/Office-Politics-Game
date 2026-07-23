import { jest } from "@jest/globals"

const queryMock = jest.fn()
const unlockAchievementMock = jest.fn()

jest.unstable_mockModule("../src/db/index.js", () => ({
  default: {
    query: queryMock,
  },
}))

jest.unstable_mockModule("../src/services/achievementService.js", () => ({
  appendUnlockedAchievements: (payload, achievements) => {
    const unlockedAchievements = achievements.filter(Boolean)

    if (unlockedAchievements.length === 0) {
      return payload
    }

    return {
      ...payload,
      unlockedAchievements,
    }
  },
  unlockAchievement: unlockAchievementMock,
}))

const {
  acceptFriendRequest,
  blockPlayer,
  getBlockedPlayers,
  getFriends,
  getReceivedFriendRequests,
  getSentFriendRequests,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
  unblockPlayer,
} = await import("../src/services/friendService.js")

beforeEach(()=>{
  queryMock.mockReset()
  unlockAchievementMock.mockReset()
})

describe("sendFriendRequest", ()=>{
  test("不能邀請自己成為好友", async ()=>{
    await expect(
      sendFriendRequest({ playerId: 1, targetPlayerId: 1 })
    ).rejects.toMatchObject({
      message: "不能邀請自己成為好友",
      statusCode: 400,
    })

    expect(queryMock).not.toHaveBeenCalled()
  })

  test("送出好友邀請時新增 pending 紀錄", async ()=>{
    queryMock
      .mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 10,
            player_id: 1,
            friend_id: 2,
            status: "pending",
            created_at: "2026-06-30T00:00:00.000Z",
          },
        ],
      })

    const request = await sendFriendRequest({
      playerId: 1,
      targetPlayerId: 2,
    })

    expect(request).toEqual({
      id: 10,
      playerId: 1,
      friendId: 2,
      status: "pending",
      createdAt: "2026-06-30T00:00:00.000Z",
    })
    expect(queryMock).toHaveBeenLastCalledWith(
      expect.stringContaining("INSERT INTO friends"),
      [1, 2]
    )
  })

  test("已存在 pending 邀請時不重複新增", async ()=>{
    queryMock
      .mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }] })
      .mockResolvedValueOnce({
        rows: [{ id: 10, status: "pending" }],
      })

    await expect(
      sendFriendRequest({ playerId: 1, targetPlayerId: 2 })
    ).rejects.toMatchObject({
      message: "好友邀請已存在",
      statusCode: 409,
    })
  })

  test("已封鎖關係不允許送出好友邀請", async ()=>{
    queryMock
      .mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }] })
      .mockResolvedValueOnce({
        rows: [{ id: 10, status: "blocked" }],
      })

    await expect(
      sendFriendRequest({ playerId: 1, targetPlayerId: 2 })
    ).rejects.toMatchObject({
      message: "無法送出好友邀請",
      statusCode: 403,
    })
  })
})

describe("removeFriend", ()=>{
  test("解除 accepted 好友關係", async ()=>{
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          player_id: 1,
          friend_id: 2,
          status: "accepted",
          created_at: "2026-06-30T00:00:00.000Z",
        },
      ],
    })

    const friendship = await removeFriend({ friendshipId: 10, playerId: 1 })

    expect(friendship.status).toBe("accepted")
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM friends"),
      [10, 1]
    )
    expect(queryMock.mock.calls[0][0]).toContain("status = 'accepted'")
  })

  test("找不到 accepted 關係時回傳錯誤", async ()=>{
    queryMock.mockResolvedValueOnce({ rows: [] })

    await expect(
      removeFriend({ friendshipId: 10, playerId: 1 })
    ).rejects.toMatchObject({
      message: "找不到可解除的好友關係",
      statusCode: 404,
    })
  })
})

describe("blockPlayer", ()=>{
  test("沒有既有關係時新增 blocked 關係", async ()=>{
    queryMock
      .mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 10,
            player_id: 1,
            friend_id: 2,
            status: "blocked",
            created_at: "2026-06-30T00:00:00.000Z",
          },
        ],
      })

    const block = await blockPlayer({ playerId: 1, targetPlayerId: 2 })

    expect(block.status).toBe("blocked")
    expect(queryMock).toHaveBeenLastCalledWith(
      expect.stringContaining("INSERT INTO friends"),
      [1, 2]
    )
  })

  test("既有 pending 或 accepted 關係封鎖後改成 blocked", async ()=>{
    queryMock
      .mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }] })
      .mockResolvedValueOnce({
        rows: [{ id: 10, player_id: 2, friend_id: 1, status: "accepted" }],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 10,
            player_id: 1,
            friend_id: 2,
            status: "blocked",
            created_at: "2026-06-30T00:00:00.000Z",
          },
        ],
      })

    const block = await blockPlayer({ playerId: 1, targetPlayerId: 2 })

    expect(block).toMatchObject({
      id: 10,
      playerId: 1,
      friendId: 2,
      status: "blocked",
    })
    expect(queryMock).toHaveBeenLastCalledWith(
      expect.stringContaining("UPDATE friends"),
      [1, 2, 10]
    )
  })
})

describe("getReceivedFriendRequests", ()=>{
  test("查詢收到的 pending 邀請", async ()=>{
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          player_id: 1,
          friend_id: 2,
          status: "pending",
          created_at: "2026-06-30T00:00:00.000Z",
          requester_id: 1,
          requester_username: "玩家一",
          requester_avatar_id: 3,
          requester_level: 5,
          requester_is_online: true,
        },
      ],
    })

    const requests = await getReceivedFriendRequests({ playerId: 2 })

    expect(requests).toEqual([
      {
        id: 10,
        playerId: 1,
        friendId: 2,
        status: "pending",
        createdAt: "2026-06-30T00:00:00.000Z",
        requester: {
          playerId: 1,
          username: "玩家一",
          avatarId: 3,
          level: 5,
          isOnline: true,
        },
      },
    ])
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("WHERE f.friend_id = $1"),
      [2]
    )
  })
})

describe("getSentFriendRequests", ()=>{
  test("查詢送出的 pending 邀請", async ()=>{
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          player_id: 1,
          friend_id: 2,
          status: "pending",
          created_at: "2026-06-30T00:00:00.000Z",
          receiver_id: 2,
          receiver_username: "玩家二",
          receiver_avatar_id: 4,
          receiver_level: 6,
          receiver_is_online: false,
        },
      ],
    })

    const requests = await getSentFriendRequests({ playerId: 1 })

    expect(requests[0].receiver).toEqual({
      playerId: 2,
      username: "玩家二",
      avatarId: 4,
      level: 6,
      isOnline: false,
    })
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("WHERE f.player_id = $1"),
      [1]
    )
  })
})

describe("acceptFriendRequest", ()=>{
  test("receiver 接受 pending 邀請時更新為 accepted", async ()=>{
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          player_id: 1,
          friend_id: 2,
          status: "accepted",
          created_at: "2026-06-30T00:00:00.000Z",
        },
      ],
    })
    unlockAchievementMock.mockResolvedValueOnce({
      code: "first_friend",
      name: "First Friend",
    })

    const request = await acceptFriendRequest({ requestId: 10, playerId: 2 })

    expect(request.status).toBe("accepted")
    expect(request.unlockedAchievements).toEqual([
      {
        code: "first_friend",
        name: "First Friend",
      },
    ])
    expect(unlockAchievementMock).toHaveBeenCalledWith(2, "first_friend")
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE friends"),
      [10, 2]
    )
  })
})

describe("rejectFriendRequest", ()=>{
  test("receiver 拒絕 pending 邀請時刪除紀錄", async ()=>{
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          player_id: 1,
          friend_id: 2,
          status: "pending",
          created_at: "2026-06-30T00:00:00.000Z",
        },
      ],
    })

    const request = await rejectFriendRequest({ requestId: 10, playerId: 2 })

    expect(request.status).toBe("pending")
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM friends"),
      [10, 2]
    )
  })
})

describe("getFriends", ()=>{
  test("好友列表查詢 accepted 雙向關係", async ()=>{
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          friendship_id: 10,
          friend_player_id: 2,
          username: "玩家二",
          avatar_id: 4,
          level: 6,
          is_online: true,
          created_at: "2026-06-30T00:00:00.000Z",
        },
      ],
    })

    const friends = await getFriends({ playerId: 1 })

    expect(friends).toEqual([
      {
        friendshipId: 10,
        playerId: 2,
        username: "玩家二",
        avatarId: 4,
        level: 6,
        isOnline: true,
        createdAt: "2026-06-30T00:00:00.000Z",
      },
    ])
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("(f.player_id = $1 OR f.friend_id = $1)"),
      [1]
    )
  })
})

describe("getBlockedPlayers", ()=>{
  test("查詢自己封鎖的玩家名單", async ()=>{
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          block_id: 10,
          blocked_player_id: 2,
          username: "玩家二",
          avatar_id: 4,
          level: 6,
          is_online: false,
          created_at: "2026-06-30T00:00:00.000Z",
        },
      ],
    })

    const blockedPlayers = await getBlockedPlayers({ playerId: 1 })

    expect(blockedPlayers).toEqual([
      {
        blockId: 10,
        playerId: 2,
        username: "玩家二",
        avatarId: 4,
        level: 6,
        isOnline: false,
        createdAt: "2026-06-30T00:00:00.000Z",
      },
    ])
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("WHERE f.player_id = $1"),
      [1]
    )
  })
})

describe("unblockPlayer", ()=>{
  test("封鎖者可以取消封鎖", async ()=>{
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          player_id: 1,
          friend_id: 2,
          status: "blocked",
          created_at: "2026-06-30T00:00:00.000Z",
        },
      ],
    })

    const block = await unblockPlayer({ blockId: 10, playerId: 1 })

    expect(block.status).toBe("blocked")
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("AND player_id = $2"),
      [10, 1]
    )
  })

  test("非封鎖者不能取消封鎖", async ()=>{
    queryMock.mockResolvedValueOnce({ rows: [] })

    await expect(
      unblockPlayer({ blockId: 10, playerId: 2 })
    ).rejects.toMatchObject({
      message: "找不到可取消封鎖的玩家",
      statusCode: 404,
    })
  })
})
