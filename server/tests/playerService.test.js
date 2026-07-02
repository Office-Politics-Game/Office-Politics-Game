import { jest } from "@jest/globals"

const queryMock = jest.fn()

jest.unstable_mockModule("../src/db/index.js", () => ({
  default: {
    query: queryMock,
  },
}))

const { createGuest, searchPlayers } = await import("../src/services/playerService.js")

beforeEach(()=>{
  queryMock.mockReset()
})

describe("createGuest", ()=>{
  test("暱稱重複時回傳可讀的服務錯誤", async ()=>{
    queryMock.mockRejectedValueOnce({ code: "23505" })

    await expect(
      createGuest({ username: "jay", avatarId: 1 })
    ).rejects.toMatchObject({
      message: "暱稱已被使用，請換一個暱稱",
      statusCode: 409,
    })
  })
})

describe("searchPlayers", ()=>{
  test("用玩家ID或暱稱搜尋並帶回好友關係狀態", async ()=>{
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 2,
          username: "策略大雄",
          avatar_id: 3,
          level: 5,
          is_online: true,
          friendship_id: 10,
          relation_status: "pending",
          created_at: "2026-06-30T00:00:00.000Z",
        },
      ],
    })

    const players = await searchPlayers({
      keyword: "2",
      viewerPlayerId: 1,
    })

    expect(players).toEqual([
      {
        id: 2,
        username: "策略大雄",
        avatarId: 3,
        level: 5,
        isOnline: true,
        friendshipId: 10,
        relationStatus: "pending",
        createdAt: "2026-06-30T00:00:00.000Z",
      },
    ])
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("(p.id = $2 OR p.username ILIKE $3)"),
      [1, 2, "%2%"]
    )
  })

  test("缺少搜尋關鍵字時回傳服務錯誤", async ()=>{
    await expect(
      searchPlayers({ keyword: " ", viewerPlayerId: 1 })
    ).rejects.toMatchObject({
      message: "請輸入玩家暱稱或玩家ID",
      statusCode: 400,
    })

    expect(queryMock).not.toHaveBeenCalled()
  })
})
