import { jest } from "@jest/globals"

const mockRegisterPlayer = jest.fn()
const mockLoginPlayer = jest.fn()
const mockVerifyToken = jest.fn()
const mockRequestPasswordReset = jest.fn()
const mockResetPlayerPassword = jest.fn()
const mockSyncOAuthPlayer = jest.fn()
const mockLogoutPlayer = jest.fn()

jest.unstable_mockModule("../src/services/authService.js", () => ({
    registerPlayer: mockRegisterPlayer,
    loginPlayer: mockLoginPlayer,
    syncOAuthPlayer: mockSyncOAuthPlayer,
    logoutPlayer: mockLogoutPlayer,
    verifyToken: mockVerifyToken,
    requestPasswordReset: mockRequestPasswordReset,
    resetPlayerPassword: mockResetPlayerPassword
}))

const {
    handleRegisterPlayer,
    handleLoginPlayer,
    handleOAuthCallback,
    handleVerifyToken,
    handleLogoutPlayer
} = await import("../src/controllers/authController.js")

function createMockResponse() {
    const res = {
        status: jest.fn(),
        json: jest.fn(),
        cookie: jest.fn(),
        clearCookie: jest.fn()
    }

    res.status.mockReturnValue(res)
    res.json.mockReturnValue(res)
    res.cookie.mockReturnValue(res)
    res.clearCookie.mockReturnValue(res)

    return res
}

function createPlayer(overrides = {}) {
    return {
        id: 1,
        authUserId: "auth-user-001",
        username: "測試玩家",
        account: "test@example.com",
        ...overrides
    }
}

describe("auth controller cookie login flow", () => {
    beforeEach(() => {
        mockRegisterPlayer.mockReset()
        mockLoginPlayer.mockReset()
        mockVerifyToken.mockReset()
        mockLogoutPlayer.mockReset()
        mockRequestPasswordReset.mockReset()
        mockResetPlayerPassword.mockReset()
        mockSyncOAuthPlayer.mockReset()

        delete process.env.AUTH_COOKIE_SAME_SITE
        delete process.env.AUTH_COOKIE_SECURE
    })

    test("註冊發生未知錯誤時，不回傳內部錯誤訊息", async () => {
        const consoleErrorSpy = jest
            .spyOn(console, "error")
            .mockImplementation(() => {})

        mockRegisterPlayer.mockRejectedValueOnce(
            new Error('insert or update on table "players" violates foreign key constraint')
        )

        const req = {
            body: {
                username: "測試玩家",
                account: "test@example.com",
                password: "Aa123456!"
            }
        }
        const res = createMockResponse()

        await handleRegisterPlayer(req, res)

        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.json).toHaveBeenCalledWith({
            message: "註冊失敗，請稍後再試"
        })

        consoleErrorSpy.mockRestore()
    })

    test("登入成功時設定 HttpOnly Cookie，且 response 不回傳 token", async () => {
        const player = createPlayer()

        mockLoginPlayer.mockResolvedValueOnce({
            player,
            token: "mock-access-token",
            expiresIn: 3600
        })

        const req = {
            body: {
                account: "test@example.com",
                password: "Aa123456!"
            }
        }
        const res = createMockResponse()

        await handleLoginPlayer(req, res)

        expect(mockLoginPlayer).toHaveBeenCalledWith(req.body)
        expect(res.cookie).toHaveBeenCalledWith(
            "officePoliticsAuthToken",
            "mock-access-token",
            {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
                path: "/",
                maxAge: 3600 * 1000
            }
        )
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({
            player
        })
    })

    test("正式跨站 Cookie 設定會使用 sameSite none 與 secure true", async () => {
        process.env.AUTH_COOKIE_SAME_SITE = "none"
        process.env.AUTH_COOKIE_SECURE = "true"

        const player = createPlayer()

        mockLoginPlayer.mockResolvedValueOnce({
            player,
            token: "mock-access-token",
            expiresIn: 3600
        })

        const req = {
            body: {
                account: "test@example.com",
                password: "Aa123456!"
            }
        }
        const res = createMockResponse()

        await handleLoginPlayer(req, res)

        expect(res.cookie).toHaveBeenCalledWith(
            "officePoliticsAuthToken",
            "mock-access-token",
            {
                httpOnly: true,
                secure: true,
                sameSite: "none",
                path: "/",
                maxAge: 3600 * 1000
            }
        )
    })

    test("第三方登入成功時設定 HttpOnly Cookie，且 response 不回傳 token", async () => {
        const player = createPlayer()

        mockSyncOAuthPlayer.mockResolvedValueOnce({
            player,
            token: "oauth-access-token",
            expiresIn: 3600
        })

        const req = {
            body: {
                accessToken: "oauth-access-token",
                expiresIn: 3600
            }
        }
        const res = createMockResponse()

        await handleOAuthCallback(req, res)

        expect(mockSyncOAuthPlayer).toHaveBeenCalledWith(req.body)
        expect(res.cookie).toHaveBeenCalledWith(
            "officePoliticsAuthToken",
            "oauth-access-token",
            {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
                path: "/",
                maxAge: 3600 * 1000
            }
        )
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({
            player
        })
    })

    test("驗證登入狀態時，從 Cookie 讀取 token", async () => {
        const player = createPlayer()

        mockVerifyToken.mockResolvedValueOnce(player)

        const req = {
            cookies: {
                officePoliticsAuthToken: "cookie-access-token"
            }
        }
        const res = createMockResponse()

        await handleVerifyToken(req, res)

        expect(mockVerifyToken).toHaveBeenCalledWith("cookie-access-token")
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({
            player
        })
    })

    test("沒有 Cookie 時，驗證登入狀態回傳錯誤", async () => {
        const error = new Error("缺少登入驗證token")
        error.statusCode = 401

        mockVerifyToken.mockRejectedValueOnce(error)

        const req = {
            cookies: {}
        }
        const res = createMockResponse()

        await handleVerifyToken(req, res)

        expect(mockVerifyToken).toHaveBeenCalledWith("")
        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({
            message: "缺少登入驗證token"
        })
    })

    test("登出時同步玩家離線並清除 HttpOnly Cookie", async () => {
        mockLogoutPlayer.mockResolvedValueOnce(true)

        const req = {
            cookies: {
                officePoliticsAuthToken: "cookie-access-token"
            }
        }
        const res = createMockResponse()

        await handleLogoutPlayer(req, res)

        expect(mockLogoutPlayer).toHaveBeenCalledWith("cookie-access-token")
        expect(res.clearCookie).toHaveBeenCalledWith(
            "officePoliticsAuthToken",
            {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
                path: "/"
            }
        )
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({
            message: "登出成功"
        })
    })

    test("登出時清除 HttpOnly Cookie", async () => {
        const req = {}
        const res = createMockResponse()

        await handleLogoutPlayer(req, res)

        expect(res.clearCookie).toHaveBeenCalledWith(
            "officePoliticsAuthToken",
            {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
                path: "/"
            }
        )
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({
            message: "登出成功"
        })
    })
})