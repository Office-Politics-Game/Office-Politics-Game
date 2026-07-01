import { jest } from "@jest/globals"

const mockQuery = jest.fn()
const mockCreateUser = jest.fn()
const mockDeleteUser = jest.fn()

jest.unstable_mockModule("../src/db/index.js", () => ({
    default: {
        query: mockQuery,
    }
}))

jest.unstable_mockModule("../src/db/supabaseClient.js", () => ({
    supabaseAdmin: {
        auth: {
            admin: {
                createUser: mockCreateUser,
                deleteUser: mockDeleteUser,
            },
        },
    }
}))

const { registerPlayer } = await import("../src/services/authService.js")

const SELECT_DUPLICATE_PLAYER_SQL = `SELECT username, account
         FROM players
         WHERE username = $1 OR account = $2
         LIMIT 1`

const INSERT_PLAYER_SQL = `INSERT INTO players (auth_user_id, username, account, avatar_id)
            VALUES ($1, $2, $3, $4)
            RETURNING id, auth_user_id, username, account, avatar_id,
                level, exp, coins, gems, tickets,
                win_count, lose_count, total_games,
                is_online, last_login_at, created_at, updated_at`

//假資料庫的玩家資料
function createPlayerRow(overrides = {}) {
    return {
        id: 1,
        auth_user_id: "auth-user-001",
        username: "測試玩家",
        account: "test@example.com",
        avatar_id: 2,
        level: 1,
        exp: 0,
        coins: 0,
        gems: 0,
        tickets: 0,
        win_count: 0,
        lose_count: 0,
        total_games: 0,
        is_online: false,
        last_login_at: null,
        created_at: "2026-07-01T00:00:00.000Z",
        updated_at: "2026-07-01T00:00:00.000Z",
        ...overrides
    }
}

describe("註冊玩家服務", () => {
    beforeEach(() => {
        mockQuery.mockReset()
        mockCreateUser.mockReset()
        mockDeleteUser.mockReset()
    })

    test("未輸入用戶名稱時，丟出錯誤", async () => {
        await expect(
            registerPlayer({
                username: "",
                account: "test@example.com",
                password: "123456",
                avatarId: 1
            })
        ).rejects.toThrow("請輸入用戶名稱")

        expect(mockQuery).not.toHaveBeenCalled()
        expect(mockCreateUser).not.toHaveBeenCalled()
        expect(mockDeleteUser).not.toHaveBeenCalled()
    })

    test("未輸入Email帳號時，丟出錯誤", async () => {
        await expect(
            registerPlayer({
                username: "測試玩家",
                account: "",
                password: "123456",
                avatarId: 1,
            })
        ).rejects.toThrow("請輸入Email帳號")

        expect(mockQuery).not.toHaveBeenCalled()
        expect(mockCreateUser).not.toHaveBeenCalled()
        expect(mockDeleteUser).not.toHaveBeenCalled()
    })

    test("Email格式不正確時，丟出錯誤", async () => {
        await expect(
            registerPlayer({
                username: "測試玩家",
                account: "test001",
                password: "123456",
                avatarId: 1
            })
        ).rejects.toThrow("Email格式不正確")

        expect(mockQuery).not.toHaveBeenCalled()
        expect(mockCreateUser).not.toHaveBeenCalled()
        expect(mockDeleteUser).not.toHaveBeenCalled()
    })

    test("未輸入密碼時，丟出錯誤", async () => {
        await expect(
            registerPlayer({
                username: "測試玩家",
                account: "test@example.com",
                password: "",
                avatarId: 1
            })
        ).rejects.toThrow("請輸入密碼")

        expect(mockQuery).not.toHaveBeenCalled()
        expect(mockCreateUser).not.toHaveBeenCalled()
        expect(mockDeleteUser).not.toHaveBeenCalled()
    })

    test("用戶名稱重複時，丟出錯誤且不建立Supabase user", async () => {
        mockQuery.mockResolvedValueOnce({
            rows: [
                {
                    username: "測試玩家",
                    account: "other@example.com"
                }
            ]
        })

        await expect(
            registerPlayer({
                username: "測試玩家",
                account: "test@example.com",
                password: "123456",
                avatarId: 1
            })
        ).rejects.toThrow("用戶名稱已被使用")

        expect(mockQuery).toHaveBeenCalledTimes(1)
        expect(mockQuery).toHaveBeenNthCalledWith(
            1,
            SELECT_DUPLICATE_PLAYER_SQL,
            ["測試玩家", "test@example.com"]
        )
        expect(mockCreateUser).not.toHaveBeenCalled()
        expect(mockDeleteUser).not.toHaveBeenCalled()
    })

    test("Email帳號重複時，丟出錯誤且不建立Supabase user", async () => {
        mockQuery.mockResolvedValueOnce({
            rows: [
                {
                    username: "其他玩家",
                    account: "test@example.com"
                }
            ]
        })

        await expect(
            registerPlayer({
                username: "測試玩家",
                account: "test@example.com",
                password: "123456",
                avatarId: 1
            })
        ).rejects.toThrow("Email帳號已被使用")

        expect(mockQuery).toHaveBeenCalledTimes(1)
        expect(mockQuery).toHaveBeenNthCalledWith(
            1,
            SELECT_DUPLICATE_PLAYER_SQL,
            ["測試玩家", "test@example.com"]
        )
        expect(mockCreateUser).not.toHaveBeenCalled()
        expect(mockDeleteUser).not.toHaveBeenCalled()
    })

    test("註冊成功時，建立Supabase user並建立玩家資料", async () => {
        mockQuery
            .mockResolvedValueOnce({
                rows: []
            })
            .mockResolvedValueOnce({
                rows: [createPlayerRow()]
            })

        mockCreateUser.mockResolvedValueOnce({
            data: {
                user: {
                    id: "auth-user-001",
                },
            },
            error: null
        })

        const player = await registerPlayer({
            username: "測試玩家",
            account: "test@example.com",
            password: "123456",
            avatarId: 2
        })

        expect(mockQuery).toHaveBeenCalledTimes(2)
        expect(mockQuery).toHaveBeenNthCalledWith(
            1,
            SELECT_DUPLICATE_PLAYER_SQL,
            ["測試玩家", "test@example.com"]
        )

        expect(mockQuery).toHaveBeenNthCalledWith(
            2,
            INSERT_PLAYER_SQL,
            ["auth-user-001", "測試玩家", "test@example.com", 2]
        )

        expect(player).toEqual({
            id: 1,
            authUserId: "auth-user-001",
            username: "測試玩家",
            account: "test@example.com",
            avatarId: 2,
            level: 1,
            exp: 0,
            coins: 0,
            gems: 0,
            tickets: 0,
            winCount: 0,
            loseCount: 0,
            totalGames: 0,
            isOnline: false,
            lastLoginAt: null,
            createdAt: "2026-07-01T00:00:00.000Z",
            updatedAt: "2026-07-01T00:00:00.000Z"
        })

        expect(player.password).toBeUndefined()
        expect(player.passwordHash).toBeUndefined()
        expect(mockDeleteUser).not.toHaveBeenCalled()
    })

    test("未傳avatarId時，使用預設頭像 1", async () => {
        mockQuery
            .mockResolvedValueOnce({
                rows: []
            })
            .mockResolvedValueOnce({
                rows: [
                    createPlayerRow({
                        avatar_id: 1
                    })
                ]
            })

        mockCreateUser.mockResolvedValueOnce({
            data: {
                user: {
                    id: "auth-user-001"
                },
            },
            error: null
        })

        await registerPlayer({
            username: "測試玩家",
            account: "test@example.com",
            password: "123456"
        })

        expect(mockCreateUser).toHaveBeenCalledWith({
            email: "test@example.com",
            password: "123456",
            email_confirm: true,
            user_metadata: {
                username: "測試玩家",
                avatarId: 1
            }
        })

        expect(mockQuery).toHaveBeenNthCalledWith(
            2,
            INSERT_PLAYER_SQL,
            ["auth-user-001", "測試玩家", "test@example.com", 1]
        )
    })

    test("用戶名稱會去除前後空白，Email帳號會去除空白並轉小寫", async () => {
        mockQuery
            .mockResolvedValueOnce({
                rows: []
            })
            .mockResolvedValueOnce({
                rows: [createPlayerRow()]
            })

        mockCreateUser.mockResolvedValueOnce({
            data: {
                user: {
                    id: "auth-user-001"
                }
            },
            error: null
        })

        await registerPlayer({
            username: "  測試玩家  ",
            account: "  TEST@EXAMPLE.COM  ",
            password: "123456",
            avatarId: 2
        })

        expect(mockQuery).toHaveBeenNthCalledWith(
            1,
            SELECT_DUPLICATE_PLAYER_SQL,
            ["測試玩家", "test@example.com"]
        )

        expect(mockCreateUser).toHaveBeenCalledWith({
            email: "test@example.com",
            password: "123456",
            email_confirm: true,
            user_metadata: {
                username: "測試玩家",
                avatarId: 2
            }
        })

        expect(mockQuery).toHaveBeenNthCalledWith(
            2,
            INSERT_PLAYER_SQL,
            ["auth-user-001", "測試玩家", "test@example.com", 2]
        )
    })

    test("Supabase建立user失敗時，丟出錯誤且不建立玩家資料", async () => {
        mockQuery.mockResolvedValueOnce({
            rows: []
        })

        mockCreateUser.mockResolvedValueOnce({
            data: {
                user: null
            },
            error: new Error("該用戶已存在")
        })

        await expect(
            registerPlayer({
                username: "測試玩家",
                account: "test@example.com",
                password: "123456",
                avatarId: 1
            })
        ).rejects.toThrow("該用戶已存在")

        expect(mockQuery).toHaveBeenCalledTimes(1)
        expect(mockCreateUser).toHaveBeenCalledTimes(1)
        expect(mockDeleteUser).not.toHaveBeenCalled()
    })

    test("Supabase沒有回傳user id時，丟出錯誤且不建立玩家資料", async () => {
        mockQuery.mockResolvedValueOnce({
            rows: []
        })

        mockCreateUser.mockResolvedValueOnce({
            data: {
                user: null
            },
            error: null
        })

        await expect(
            registerPlayer({
                username: "測試玩家",
                account: "test@example.com",
                password: "123456",
                avatarId: 1
            })
        ).rejects.toThrow("會員建立失敗")

        expect(mockQuery).toHaveBeenCalledTimes(1)
        expect(mockCreateUser).toHaveBeenCalledTimes(1)
        expect(mockDeleteUser).not.toHaveBeenCalled()
    })

    test("players資料寫入失敗時，會刪除已建立的Supabase user", async () => {
        const dbError = new Error("db資料表寫入失敗")

        mockQuery
            .mockResolvedValueOnce({
                rows: []
            })
            .mockRejectedValueOnce(dbError)

        mockCreateUser.mockResolvedValueOnce({
            data: {
                user: {
                    id: "auth-user-001"
                }
            },
            error: null
        })

        mockDeleteUser.mockResolvedValueOnce({
            data: {},
            error: null
        })

        await expect(
            registerPlayer({
                username: "測試玩家",
                account: "test@example.com",
                password: "123456",
                avatarId: 1
            })
        ).rejects.toThrow("db資料表寫入失敗")

        expect(mockCreateUser).toHaveBeenCalledTimes(1)
        expect(mockDeleteUser).toHaveBeenCalledTimes(1)
        expect(mockDeleteUser).toHaveBeenCalledWith("auth-user-001")
    })

    test("刪除Supabase user失敗時，仍丟出原本的DB錯誤", async () => {
        const dbError = new Error("db資料表寫入失敗")

        mockQuery
            .mockResolvedValueOnce({
                rows: []
            })
            .mockRejectedValueOnce(dbError)

        mockCreateUser.mockResolvedValueOnce({
            data: {
                user: {
                    id: "auth-user-001"
                }
            },
            error: null
        })

        mockDeleteUser.mockRejectedValueOnce(new Error("刪除supabase用戶資料失敗"))

        await expect(
            registerPlayer({
                username: "測試玩家",
                account: "test@example.com",
                password: "123456",
                avatarId: 1
            })
        ).rejects.toThrow("db資料表寫入失敗")

        expect(mockDeleteUser).toHaveBeenCalledWith("auth-user-001")
    })
})