import { jest } from "@jest/globals"

const mockHash = jest.fn()
const mockQuery = jest.fn()

jest.unstable_mockModule("bcryptjs", () => ({
    default: {
        hash: mockHash
    }
}))

jest.unstable_mockModule("../src/db/index.js", () => ({
    default: {
        query: mockQuery
    }
}))

const { registerPlayer } = await import("../src/services/authService.js")

const SELECT_DUPLICATE_PLAYER_SQL = `SELECT username, account
         FROM players
         WHERE username = $1 OR account = $2
         LIMIT 1`

const INSERT_PLAYER_SQL = `INSERT INTO players (username, account, password_hash, avatar_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, username, account, avatar_id, created_at`

describe("註冊玩家服務", () => {
    beforeEach(() => {
        mockHash.mockReset()
        mockQuery.mockReset()
    })

    test("未輸入用戶名稱時，丟出錯誤", async () => {
        await expect(
            registerPlayer({
                username: "",
                account: "test001",
                password: "123456",
                avatarId: 1
            })
        ).rejects.toThrow("請輸入用戶名稱")

        expect(mockQuery).not.toHaveBeenCalled()
        expect(mockHash).not.toHaveBeenCalled()
    })

    test("未輸入帳號時，丟出錯誤", async () => {
        await expect(
            registerPlayer({
                username: "測試玩家",
                account: "",
                password: "123456",
                avatarId: 1,
            })
        ).rejects.toThrow("請輸入帳號")

        expect(mockQuery).not.toHaveBeenCalled()
        expect(mockHash).not.toHaveBeenCalled()
    })

    test("未輸入密碼時，丟出錯誤", async () => {
        await expect(
            registerPlayer({
                username: "測試玩家",
                account: "test001",
                password: "",
                avatarId: 1
            })
        ).rejects.toThrow("請輸入密碼")

        expect(mockQuery).not.toHaveBeenCalled()
        expect(mockHash).not.toHaveBeenCalled()
    })

    test("用戶名稱重複時，丟出錯誤且不建立玩家", async () => {
        mockQuery.mockResolvedValueOnce({
            rows: [
                {
                    username: "測試玩家",
                    account: "other001"
                }
            ]
        })

        await expect(
            registerPlayer({
                username: "測試玩家",
                account: "test001",
                password: "123456",
                avatarId: 1
            })
        ).rejects.toThrow("用戶名稱已被使用")

        expect(mockQuery).toHaveBeenCalledTimes(1)
        expect(mockQuery).toHaveBeenNthCalledWith(
            1,
            SELECT_DUPLICATE_PLAYER_SQL,
            ["測試玩家", "test001"]
        )
        expect(mockHash).not.toHaveBeenCalled()
    })

    test("帳號重複時，丟出錯誤且不建立玩家", async () => {
        mockQuery.mockResolvedValueOnce({
            rows: [
                {
                    username: "其他玩家",
                    account: "test001"
                }
            ]
        })

        await expect(
            registerPlayer({
                username: "測試玩家",
                account: "test001",
                password: "123456",
                avatarId: 1
            })
        ).rejects.toThrow("帳號已被使用")

        expect(mockQuery).toHaveBeenCalledTimes(1)
        expect(mockQuery).toHaveBeenNthCalledWith(
            1,
            SELECT_DUPLICATE_PLAYER_SQL,
            ["測試玩家", "test001"]
        )
        expect(mockHash).not.toHaveBeenCalled()
    })

    test("註冊成功時，加密密碼並建立玩家資料", async () => {
        mockQuery
            .mockResolvedValueOnce({
                rows: []
            })
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: 1,
                        username: "測試玩家",
                        account: "test001",
                        avatar_id: 2,
                        created_at: "2026-06-29T00:00:00.000Z"
                    }
                ]
            })

        mockHash.mockResolvedValue("hashed-password")

        const player = await registerPlayer({
            username: "測試玩家",
            account: "test001",
            password: "123456",
            avatarId: 2
        })

        expect(mockHash).toHaveBeenCalledWith("123456", 12)

        expect(mockQuery).toHaveBeenCalledTimes(2)

        expect(mockQuery).toHaveBeenNthCalledWith(
            1,
            SELECT_DUPLICATE_PLAYER_SQL,
            ["測試玩家", "test001"]
        )

        expect(mockQuery).toHaveBeenNthCalledWith(
            2,
            INSERT_PLAYER_SQL,
            ["測試玩家", "test001", "hashed-password", 2]
        )

        expect(player).toEqual({
            id: 1,
            username: "測試玩家",
            account: "test001",
            avatarId: 2,
            createdAt: "2026-06-29T00:00:00.000Z"
        })

        expect(player.password_hash).toBeUndefined()
    })

    test("未傳 avatarId 時，使用預設頭像 1", async () => {
        mockQuery
            .mockResolvedValueOnce({
                rows: []
            })
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: 1,
                        username: "測試玩家",
                        account: "test001",
                        avatar_id: 1,
                        created_at: "2026-06-29T00:00:00.000Z"
                    }
                ]
            })

        mockHash.mockResolvedValue("hashed-password")

        await registerPlayer({
            username: "測試玩家",
            account: "test001",
            password: "123456"
        })

        expect(mockQuery).toHaveBeenNthCalledWith(
            2,
            INSERT_PLAYER_SQL,
            ["測試玩家", "test001", "hashed-password", 1]
        )
    })

    test("用戶名稱與帳號會先去除前後空白再寫入", async () => {
        mockQuery
            .mockResolvedValueOnce({
                rows: []
            })
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: 1,
                        username: "測試玩家",
                        account: "test001",
                        avatar_id: 1,
                        created_at: "2026-06-29T00:00:00.000Z"
                    }
                ]
            })

        mockHash.mockResolvedValue("hashed-password")

        await registerPlayer({
            username: "  測試玩家  ",
            account: "  test001  ",
            password: "123456",
            avatarId: 1
        })

        expect(mockQuery).toHaveBeenNthCalledWith(
            1,
            SELECT_DUPLICATE_PLAYER_SQL,
            ["測試玩家", "test001"]
        )

        expect(mockQuery).toHaveBeenNthCalledWith(
            2,
            INSERT_PLAYER_SQL,
            ["測試玩家", "test001", "hashed-password", 1]
        )
    })
})