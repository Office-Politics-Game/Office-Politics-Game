import { jest } from "@jest/globals"

const mockSignUp = jest.fn()
const mockQuery = jest.fn()
const mockDeleteUser = jest.fn()
const mockSignInWithPassword = jest.fn()
const mockGetUser = jest.fn()
const mockResetPasswordForEmail = jest.fn()
const mockUpdateUserById = jest.fn()

const VALID_PASSWORD = "Aa123456!"

jest.unstable_mockModule("../src/db/index.js", () => ({
    default: {
        query: mockQuery,
    }
}))

jest.unstable_mockModule("../src/db/supabaseClient.js", () => ({
    supabaseAdmin: {
        auth: {
            signInWithPassword: mockSignInWithPassword,
            getUser: mockGetUser,
            resetPasswordForEmail: mockResetPasswordForEmail,
            admin: {
                deleteUser: mockDeleteUser,
                updateUserById: mockUpdateUserById
            }
        }
    },
    supabaseAuth: {
        auth: {
            signUp: mockSignUp
        }
    }
}))

const {
    registerPlayer,
    loginPlayer,
    syncOAuthPlayer,
    verifyToken,
    requestPasswordReset,
    resetPlayerPassword
} = await import("../src/services/authService.js")

const SELECT_DUPLICATE_PLAYER_SQL = `SELECT username, account
         FROM players
         WHERE username = $1 OR account = $2
         LIMIT 1`

const PLAYER_SELECT_SQL = `id, auth_user_id, username, account, avatar_id,
    level, exp, coins, gems, tickets,
    win_count, lose_count, total_games,
    is_online, last_login_at, created_at, updated_at`

const INSERT_PLAYER_SQL = `INSERT INTO players (auth_user_id, username, account, avatar_id)
            VALUES ($1, $2, $3, $4)
            RETURNING ${PLAYER_SELECT_SQL}`

function resetMocks() {
    mockQuery.mockReset()
    mockDeleteUser.mockReset()
    mockSignInWithPassword.mockReset()
    mockGetUser.mockReset()
    mockResetPasswordForEmail.mockReset()
    mockUpdateUserById.mockReset()
    mockSignUp.mockReset()

    delete process.env.EMAIL_CONFIRM_REDIRECT_URL
    delete process.env.PASSWORD_RESET_REDIRECT_URL
    delete process.env.CLIENT_ORIGIN
    delete process.env.FRONTEND_URL
}

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
        resetMocks()
    })

    test("未輸入用戶名稱時，丟出錯誤", async () => {
        await expect(
            registerPlayer({
                username: "",
                account: "test@example.com",
                password: VALID_PASSWORD,
                avatarId: 1
            })
        ).rejects.toThrow("請輸入用戶名稱")

        expect(mockQuery).not.toHaveBeenCalled()
        expect(mockSignUp).not.toHaveBeenCalled()
        expect(mockDeleteUser).not.toHaveBeenCalled()
    })

    test("未輸入Email帳號時，丟出錯誤", async () => {
        await expect(
            registerPlayer({
                username: "測試玩家",
                account: "",
                password: VALID_PASSWORD,
                avatarId: 1,
            })
        ).rejects.toThrow("請輸入Email帳號")

        expect(mockQuery).not.toHaveBeenCalled()
        expect(mockSignUp).not.toHaveBeenCalled()
        expect(mockDeleteUser).not.toHaveBeenCalled()
    })

    test("Email格式不正確時，丟出錯誤", async () => {
        await expect(
            registerPlayer({
                username: "測試玩家",
                account: "test001",
                password: VALID_PASSWORD,
                avatarId: 1
            })
        ).rejects.toThrow("Email格式不正確")

        expect(mockQuery).not.toHaveBeenCalled()
        expect(mockSignUp).not.toHaveBeenCalled()
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
        expect(mockSignUp).not.toHaveBeenCalled()
        expect(mockDeleteUser).not.toHaveBeenCalled()
    })

    test("密碼格式不符合規則時，丟出錯誤", async () => {
        await expect(
            registerPlayer({
                username: "測試玩家",
                account: "test@example.com",
                password: "123456",
                avatarId: 1
            })
        ).rejects.toThrow("密碼格式不符合規則")

        expect(mockQuery).not.toHaveBeenCalled()
        expect(mockSignUp).not.toHaveBeenCalled()
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
                password: VALID_PASSWORD,
                avatarId: 1
            })
        ).rejects.toThrow("用戶名稱已被使用")

        expect(mockQuery).toHaveBeenCalledTimes(1)
        expect(mockQuery).toHaveBeenNthCalledWith(
            1,
            SELECT_DUPLICATE_PLAYER_SQL,
            ["測試玩家", "test@example.com"]
        )
        expect(mockSignUp).not.toHaveBeenCalled()
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
                password: VALID_PASSWORD,
                avatarId: 1
            })
        ).rejects.toThrow("Email帳號已被使用")

        expect(mockQuery).toHaveBeenCalledTimes(1)
        expect(mockQuery).toHaveBeenNthCalledWith(
            1,
            SELECT_DUPLICATE_PLAYER_SQL,
            ["測試玩家", "test@example.com"]
        )
        expect(mockSignUp).not.toHaveBeenCalled()
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

        mockSignUp.mockResolvedValueOnce({
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
            password: VALID_PASSWORD,
            avatarId: 2
        })

        expect(mockSignUp).toHaveBeenCalledWith({
            email: "test@example.com",
            password: VALID_PASSWORD,
            options: {
                emailRedirectTo: "http://localhost:5173/?auth=login&notice=email-verified",
                data: {
                    username: "測試玩家",
                    avatarId: 2
                }
            }
        })

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

        mockSignUp.mockResolvedValueOnce({
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
            password: VALID_PASSWORD
        })

        expect(mockSignUp).toHaveBeenCalledWith({
            email: "test@example.com",
            password: VALID_PASSWORD,
            options: {
                emailRedirectTo: "http://localhost:5173/?auth=login&notice=email-verified",
                data: {
                    username: "測試玩家",
                    avatarId: 1
                }
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

        mockSignUp.mockResolvedValueOnce({
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
            password: VALID_PASSWORD,
            avatarId: 2
        })

        expect(mockQuery).toHaveBeenNthCalledWith(
            1,
            SELECT_DUPLICATE_PLAYER_SQL,
            ["測試玩家", "test@example.com"]
        )

        expect(mockSignUp).toHaveBeenCalledWith({
            email: "test@example.com",
            password: VALID_PASSWORD,
            options: {
                emailRedirectTo: "http://localhost:5173/?auth=login&notice=email-verified",
                data: {
                    username: "測試玩家",
                    avatarId: 2
                }
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

        mockSignUp.mockResolvedValueOnce({
            data: {
                user: null
            },
            error: new Error("該用戶已存在")
        })

        await expect(
            registerPlayer({
                username: "測試玩家",
                account: "test@example.com",
                password: VALID_PASSWORD,
                avatarId: 1
            })
        ).rejects.toThrow("該用戶已存在")

        expect(mockQuery).toHaveBeenCalledTimes(1)
        expect(mockSignUp).toHaveBeenCalledTimes(1)
        expect(mockDeleteUser).not.toHaveBeenCalled()
    })

    test("Supabase沒有回傳user id時，丟出錯誤且不建立玩家資料", async () => {
        mockQuery.mockResolvedValueOnce({
            rows: []
        })

        mockSignUp.mockResolvedValueOnce({
            data: {
                user: null
            },
            error: null
        })

        await expect(
            registerPlayer({
                username: "測試玩家",
                account: "test@example.com",
                password: VALID_PASSWORD,
                avatarId: 1
            })
        ).rejects.toThrow("會員建立失敗")

        expect(mockQuery).toHaveBeenCalledTimes(1)
        expect(mockSignUp).toHaveBeenCalledTimes(1)
        expect(mockDeleteUser).not.toHaveBeenCalled()
    })

    test("players資料寫入失敗時，會刪除已建立的Supabase user", async () => {
        const dbError = new Error("db資料表寫入失敗")

        mockQuery
            .mockResolvedValueOnce({
                rows: []
            })
            .mockRejectedValueOnce(dbError)

        mockSignUp.mockResolvedValueOnce({
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
                password: VALID_PASSWORD,
                avatarId: 1
            })
        ).rejects.toThrow("db資料表寫入失敗")

        expect(mockSignUp).toHaveBeenCalledTimes(1)
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

        mockSignUp.mockResolvedValueOnce({
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
                password: VALID_PASSWORD,
                avatarId: 1
            })
        ).rejects.toThrow("db資料表寫入失敗")

        expect(mockSignUp).toHaveBeenCalledTimes(1)
        expect(mockDeleteUser).toHaveBeenCalledWith("auth-user-001")
    })
})

describe("登入玩家服務", () => {
    beforeEach(() => {
        resetMocks()
    })

    test("未輸入Email帳號時，丟出錯誤", async () => {
        await expect(
            loginPlayer({
                account: "",
                password: "123456"
            })
        ).rejects.toThrow("請輸入Email帳號")

        expect(mockQuery).not.toHaveBeenCalled()
        expect(mockSignInWithPassword).not.toHaveBeenCalled()
    })

    test("Email格式不正確時，丟出錯誤", async () => {
        await expect(
            loginPlayer({
                account: "test001",
                password: "123456"
            })
        ).rejects.toThrow("Email格式不正確")

        expect(mockQuery).not.toHaveBeenCalled()
        expect(mockSignInWithPassword).not.toHaveBeenCalled()
    })

    test("未輸入密碼時，丟出錯誤", async () => {
        await expect(
            loginPlayer({
                account: "test@example.com",
                password: ""
            })
        ).rejects.toThrow("請輸入密碼")

        expect(mockQuery).not.toHaveBeenCalled()
        expect(mockSignInWithPassword).not.toHaveBeenCalled()
    })

    test("帳號不存在時，丟出錯誤", async () => {
        mockQuery.mockResolvedValueOnce({
            rows: []
        })

        await expect(
            loginPlayer({
                account: "test@example.com",
                password: "123456"
            })
        ).rejects.toThrow("帳號不存在")

        expect(mockQuery).toHaveBeenCalledTimes(1)
        expect(mockSignInWithPassword).not.toHaveBeenCalled()
    })

    test("密碼錯誤時，丟出錯誤", async () => {
        mockQuery.mockResolvedValueOnce({
            rows: [createPlayerRow()]
        })

        mockSignInWithPassword.mockResolvedValueOnce({
            data: {
                user: null,
                session: null
            },
            error: new Error("Invalid login credentials")
        })

        await expect(
            loginPlayer({
                account: "test@example.com",
                password: "wrong-password"
            })
        ).rejects.toThrow("密碼錯誤")

        expect(mockSignInWithPassword).toHaveBeenCalledWith({
            email: "test@example.com",
            password: "wrong-password",
        })
    })

    test("Email尚未驗證時，登入會丟出錯誤", async () => {
        mockQuery.mockResolvedValueOnce({
            rows: [createPlayerRow()]
        })

        mockSignInWithPassword.mockResolvedValueOnce({
            data: {
                user: null,
                session: null
            },
            error: {
                code: "email_not_confirmed",
                message: "Email not confirmed"
            }
        })

        await expect(
            loginPlayer({
                account: "test@example.com",
                password: VALID_PASSWORD
            })
        ).rejects.toThrow("請先完成信箱驗證後再登入")

        expect(mockSignInWithPassword).toHaveBeenCalledWith({
            email: "test@example.com",
            password: VALID_PASSWORD
        })
    })

    test("登入成功時，回傳會員資料與設定 Cookie 所需 token", async () => {
        mockQuery
            .mockResolvedValueOnce({
                rows: [createPlayerRow()]
            })
            .mockResolvedValueOnce({
                rows: [
                    createPlayerRow({
                        is_online: true,
                        last_login_at: "2026-07-01T03:30:00.000Z",
                        updated_at: "2026-07-01T03:30:00.000Z",
                    })
                ]
            })

        mockSignInWithPassword.mockResolvedValueOnce({
            data: {
                user: {
                    id: "auth-user-001",
                },
                session: {
                    access_token: "mock-access-token",
                    expires_in: 3600,
                },
            },
            error: null
        })

        const result = await loginPlayer({
            account: "test@example.com",
            password: "123456"
        })

        expect(mockSignInWithPassword).toHaveBeenCalledWith({
            email: "test@example.com",
            password: "123456"
        })

        expect(result).toEqual({
            player: {
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
                isOnline: true,
                lastLoginAt: "2026-07-01T03:30:00.000Z",
                createdAt: "2026-07-01T00:00:00.000Z",
                updatedAt: "2026-07-01T03:30:00.000Z",
            },
            token: "mock-access-token",
            expiresIn: 3600
        })

        expect(result.player.password).toBeUndefined()
        expect(result.player.passwordHash).toBeUndefined()
    })
})

describe("忘記密碼服務", () => {
    beforeEach(() => {
        resetMocks()
    })

    test("未輸入Email帳號時，丟出錯誤", async () => {
        await expect(
            requestPasswordReset({
                account: ""
            })
        ).rejects.toThrow("請輸入Email帳號")

        expect(mockResetPasswordForEmail).not.toHaveBeenCalled()
    })

    test("Email格式不正確時，丟出錯誤", async () => {
        await expect(
            requestPasswordReset({
                account: "test001"
            })
        ).rejects.toThrow("Email格式不正確")

        expect(mockResetPasswordForEmail).not.toHaveBeenCalled()
    })

    test("成功時，呼叫Supabase寄出重設密碼信", async () => {
        mockResetPasswordForEmail.mockResolvedValueOnce({
            data: {},
            error: null
        })

        const result = await requestPasswordReset({
            account: "  TEST@EXAMPLE.COM  "
        })

        expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
            "test@example.com",
            {
                redirectTo: "http://localhost:5173/?auth=reset-password"
            }
        )

        expect(result).toEqual({
            message: "重設密碼信已透過電子郵件傳送至您的信箱"
        })
    })

    test("有設定PASSWORD_RESET_REDIRECT_URL時，使用指定的重設密碼網址", async () => {
        process.env.PASSWORD_RESET_REDIRECT_URL =
            "https://office-politics-game-fawn.vercel.app/?auth=reset-password"

        mockResetPasswordForEmail.mockResolvedValueOnce({
            data: {},
            error: null
        })

        await requestPasswordReset({
            account: "test@example.com"
        })

        expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
            "test@example.com",
            {
                redirectTo: "https://office-politics-game-fawn.vercel.app/?auth=reset-password"
            }
        )
    })

    test("未設定PASSWORD_RESET_REDIRECT_URL但有CLIENT_ORIGIN時，使用CLIENT_ORIGIN產生重設密碼網址", async () => {
        process.env.CLIENT_ORIGIN = "https://client.example.com"

        mockResetPasswordForEmail.mockResolvedValueOnce({
            data: {},
            error: null
        })

        await requestPasswordReset({
            account: "test@example.com"
        })

        expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
            "test@example.com",
            {
                redirectTo: "https://client.example.com/?auth=reset-password"
            }
        )
    })

    test("未設定PASSWORD_RESET_REDIRECT_URL與CLIENT_ORIGIN但有FRONTEND_URL時，使用FRONTEND_URL產生重設密碼網址", async () => {
        process.env.FRONTEND_URL = "https://frontend.example.com"

        mockResetPasswordForEmail.mockResolvedValueOnce({
            data: {},
            error: null
        })

        await requestPasswordReset({
            account: "test@example.com"
        })

        expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
            "test@example.com",
            {
                redirectTo: "https://frontend.example.com/?auth=reset-password"
            }
        )
    })

    test("Supabase寄送重設密碼信失敗時，丟出錯誤", async () => {
        mockResetPasswordForEmail.mockResolvedValueOnce({
            data: null,
            error: new Error("rate limit exceeded")
        })

        await expect(
            requestPasswordReset({
                account: "test@example.com"
            })
        ).rejects.toThrow("重設密碼信寄送失敗，請稍後再試")
    })
})

describe("重設密碼服務", () => {
    beforeEach(() => {
        resetMocks()
    })

    test("未提供token時，丟出錯誤", async () => {
        await expect(
            resetPlayerPassword({
                token: "",
                password: VALID_PASSWORD
            })
        ).rejects.toThrow("重設密碼連結已失效，請重新申請")

        expect(mockGetUser).not.toHaveBeenCalled()
        expect(mockUpdateUserById).not.toHaveBeenCalled()
    })

    test("密碼格式不符合規則時，丟出錯誤", async () => {
        await expect(
            resetPlayerPassword({
                token: "valid-reset-token",
                password: "123456"
            })
        ).rejects.toThrow("密碼格式不符合規則")

        expect(mockGetUser).not.toHaveBeenCalled()
        expect(mockUpdateUserById).not.toHaveBeenCalled()
    })

    test("密碼缺少數字時，丟出錯誤", async () => {
        await expect(
            resetPlayerPassword({
                token: "valid-reset-token",
                password: "Aaaaaaaa!"
            })
        ).rejects.toThrow("密碼格式不符合規則")

        expect(mockGetUser).not.toHaveBeenCalled()
        expect(mockUpdateUserById).not.toHaveBeenCalled()
    })

    test("密碼缺少特殊符號時，丟出錯誤", async () => {
        await expect(
            resetPlayerPassword({
                token: "valid-reset-token",
                password: "Aa123456"
            })
        ).rejects.toThrow("密碼格式不符合規則")

        expect(mockGetUser).not.toHaveBeenCalled()
        expect(mockUpdateUserById).not.toHaveBeenCalled()
    })

    test("Supabase驗證token失敗時，丟出錯誤", async () => {
        mockGetUser.mockResolvedValueOnce({
            data: {
                user: null
            },
            error: new Error("token無效")
        })

        await expect(
            resetPlayerPassword({
                token: "invalid-reset-token",
                password: VALID_PASSWORD
            })
        ).rejects.toThrow("重設密碼連結已失效，請重新申請")

        expect(mockGetUser).toHaveBeenCalledWith("invalid-reset-token")
        expect(mockUpdateUserById).not.toHaveBeenCalled()
    })

    test("重設密碼成功時，更新Supabase使用者密碼", async () => {
        mockGetUser.mockResolvedValueOnce({
            data: {
                user: {
                    id: "auth-user-001"
                }
            },
            error: null
        })

        mockUpdateUserById.mockResolvedValueOnce({
            data: {
                user: {
                    id: "auth-user-001"
                }
            },
            error: null
        })

        const result = await resetPlayerPassword({
            token: "valid-reset-token",
            password: VALID_PASSWORD
        })

        expect(mockGetUser).toHaveBeenCalledWith("valid-reset-token")
        expect(mockUpdateUserById).toHaveBeenCalledWith(
            "auth-user-001",
            {
                password: VALID_PASSWORD
            }
        )

        expect(result).toEqual({
            message: "密碼已更新，請重新登入"
        })
    })

    test("Supabase更新密碼失敗時，丟出錯誤", async () => {
        mockGetUser.mockResolvedValueOnce({
            data: {
                user: {
                    id: "auth-user-001"
                }
            },
            error: null
        })

        mockUpdateUserById.mockResolvedValueOnce({
            data: null,
            error: new Error("password update failed")
        })

        await expect(
            resetPlayerPassword({
                token: "valid-reset-token",
                password: VALID_PASSWORD
            })
        ).rejects.toThrow("密碼重設失敗，請稍後再試")

        expect(mockUpdateUserById).toHaveBeenCalledWith(
            "auth-user-001",
            {
                password: VALID_PASSWORD
            }
        )
    })
})

describe("第三方登入玩家同步服務", () => {
    beforeEach(() => {
        resetMocks()
    })

    test("未提供access token時，丟出錯誤", async () => {
        await expect(
            syncOAuthPlayer({
                accessToken: ""
            })
        ).rejects.toThrow("缺少第三方登入憑證")

        expect(mockGetUser).not.toHaveBeenCalled()
        expect(mockQuery).not.toHaveBeenCalled()
    })

    test("Supabase驗證第三方登入token失敗時，丟出錯誤", async () => {
        mockGetUser.mockResolvedValueOnce({
            data: {
                user: null
            },
            error: new Error("oauth token invalid")
        })

        await expect(
            syncOAuthPlayer({
                accessToken: "invalid-oauth-token"
            })
        ).rejects.toThrow("第三方登入驗證失敗")

        expect(mockGetUser).toHaveBeenCalledWith("invalid-oauth-token")
        expect(mockQuery).not.toHaveBeenCalled()
    })

    test("第三方登入未提供Email時，丟出錯誤", async () => {
        const oauthUserId = "33333333-3333-4333-8333-333333333333"

        mockGetUser.mockResolvedValueOnce({
            data: {
                user: {
                    id: oauthUserId,
                    email: ""
                }
            },
            error: null
        })

        await expect(
            syncOAuthPlayer({
                accessToken: "oauth-access-token"
            })
        ).rejects.toThrow("第三方登入未提供Email，請改用其他登入方式")

        expect(mockGetUser).toHaveBeenCalledWith("oauth-access-token")
        expect(mockQuery).not.toHaveBeenCalled()
    })

    test("Email已存在時，會綁定既有player並更新登入狀態", async () => {
        const oauthUserId = "11111111-1111-4111-8111-111111111111"

        const existingPlayer = createPlayerRow({
            id: 7,
            auth_user_id: null,
            username: "既有玩家",
            account: "test@example.com"
        })

        const updatedPlayer = createPlayerRow({
            id: 7,
            auth_user_id: oauthUserId,
            username: "既有玩家",
            account: "test@example.com",
            is_online: true,
            last_login_at: "2026-07-10T12:00:00.000Z",
            updated_at: "2026-07-10T12:00:00.000Z"
        })

        mockGetUser.mockResolvedValueOnce({
            data: {
                user: {
                    id: oauthUserId,
                    email: "  TEST@EXAMPLE.COM  ",
                    user_metadata: {
                        full_name: "Google 使用者"
                    }
                }
            },
            error: null
        })

        mockQuery
            .mockResolvedValueOnce({
                rows: [existingPlayer]
            })
            .mockResolvedValueOnce({
                rows: [updatedPlayer]
            })

        const result = await syncOAuthPlayer({
            accessToken: "oauth-access-token",
            expiresIn: 3600
        })

        expect(mockGetUser).toHaveBeenCalledWith("oauth-access-token")
        expect(mockQuery).toHaveBeenCalledTimes(2)

        expect(mockQuery).toHaveBeenNthCalledWith(
            1,
            expect.stringContaining("WHERE account = $1 OR auth_user_id = $2"),
            ["test@example.com", oauthUserId]
        )

        expect(mockQuery).toHaveBeenNthCalledWith(
            2,
            expect.stringContaining("UPDATE players"),
            [oauthUserId, "test@example.com", 7]
        )

        expect(result).toEqual({
            player: {
                id: 7,
                authUserId: oauthUserId,
                username: "既有玩家",
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
                isOnline: true,
                lastLoginAt: "2026-07-10T12:00:00.000Z",
                createdAt: "2026-07-01T00:00:00.000Z",
                updatedAt: "2026-07-10T12:00:00.000Z"
            },
            token: "oauth-access-token",
            expiresIn: 3600
        })
    })

    test("Email不存在時，自動建立新player", async () => {
        const oauthUserId = "22222222-2222-4222-8222-222222222222"
        const oauthUsername = "Google使用者-22222222"

        const createdPlayer = createPlayerRow({
            id: 9,
            auth_user_id: oauthUserId,
            username: oauthUsername,
            account: "new@example.com",
            avatar_id: 1,
            is_online: true,
            last_login_at: "2026-07-10T12:00:00.000Z"
        })

        mockGetUser.mockResolvedValueOnce({
            data: {
                user: {
                    id: oauthUserId,
                    email: "NEW@EXAMPLE.COM",
                    user_metadata: {
                        full_name: "Google 使用者"
                    }
                }
            },
            error: null
        })

        mockQuery
            .mockResolvedValueOnce({
                rows: []
            })
            .mockResolvedValueOnce({
                rows: [createdPlayer]
            })

        const result = await syncOAuthPlayer({
            accessToken: "oauth-access-token",
            expiresIn: 3600
        })

        expect(mockGetUser).toHaveBeenCalledWith("oauth-access-token")
        expect(mockQuery).toHaveBeenCalledTimes(2)

        expect(mockQuery).toHaveBeenNthCalledWith(
            1,
            expect.stringContaining("WHERE account = $1 OR auth_user_id = $2"),
            ["new@example.com", oauthUserId]
        )

        expect(mockQuery).toHaveBeenNthCalledWith(
            2,
            expect.stringContaining("INSERT INTO players"),
            [
                oauthUserId,
                oauthUsername,
                "new@example.com",
                1
            ]
        )

        expect(result).toEqual({
            player: {
                id: 9,
                authUserId: oauthUserId,
                username: oauthUsername,
                account: "new@example.com",
                avatarId: 1,
                level: 1,
                exp: 0,
                coins: 0,
                gems: 0,
                tickets: 0,
                winCount: 0,
                loseCount: 0,
                totalGames: 0,
                isOnline: true,
                lastLoginAt: "2026-07-10T12:00:00.000Z",
                createdAt: "2026-07-01T00:00:00.000Z",
                updatedAt: "2026-07-01T00:00:00.000Z"
            },
            token: "oauth-access-token",
            expiresIn: 3600
        })
    })
})

describe("驗證登入狀態服務", () => {
    beforeEach(() => {
        resetMocks()
    })

    test("未提供token時，丟出錯誤", async () => {
        await expect(verifyToken("")).rejects.toThrow("缺少登入驗證token")

        expect(mockGetUser).not.toHaveBeenCalled()
        expect(mockQuery).not.toHaveBeenCalled()
    })

    test("Supabase驗證token失敗時，丟出錯誤", async () => {
        mockGetUser.mockResolvedValueOnce({
            data: {
                user: null
            },
            error: new Error("token無效")
        })

        await expect(verifyToken("token無效")).rejects.toThrow("登入驗證失敗")

        expect(mockGetUser).toHaveBeenCalledWith("token無效")
        expect(mockQuery).not.toHaveBeenCalled()
    })

    test("token有效但找不到玩家資料時，丟出錯誤", async () => {
        mockGetUser.mockResolvedValueOnce({
            data: {
                user: {
                    id: "auth-user-001"
                }
            },
            error: null
        })

        mockQuery.mockResolvedValueOnce({
            rows: []
        })

        await expect(verifyToken("有效token")).rejects.toThrow("找不到玩家資料")

        expect(mockGetUser).toHaveBeenCalledWith("有效token")
        expect(mockQuery).toHaveBeenCalledTimes(1)
    })

    test("token有效且找到玩家資料時，回傳玩家資料", async () => {
        mockGetUser.mockResolvedValueOnce({
            data: {
                user: {
                    id: "auth-user-001"
                }
            },
            error: null
        })

        mockQuery.mockResolvedValueOnce({
            rows: [createPlayerRow()]
        })

        const player = await verifyToken("有效token")

        expect(mockGetUser).toHaveBeenCalledWith("有效token")
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
    })
})
