import { jest } from "@jest/globals"

const mockVerifyToken = jest.fn()

jest.unstable_mockModule("../src/services/authService.js", () => ({
    verifyToken: mockVerifyToken
}))

const { requireAuth, requireMemberAuth } = await import("../src/middlewares/authMiddleware.js")

function createMockResponse() {
    const res = {
        status: jest.fn(),
        json: jest.fn()
    }

    res.status.mockReturnValue(res)
    res.json.mockReturnValue(res)

    return res
}

describe("requireAuth middleware", () => {
    beforeEach(() => {
        mockVerifyToken.mockReset()
    })

    test("沒有 Cookie 時回傳 401", async () => {
        const error = new Error("缺少登入驗證token")
        error.statusCode = 401
        mockVerifyToken.mockRejectedValueOnce(error)

        const req = { cookies: {} }
        const res = createMockResponse()
        const next = jest.fn()

        await requireAuth(req, res, next)

        expect(mockVerifyToken).toHaveBeenCalledWith("")
        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({
            message: "缺少登入驗證token"
        })
    })

    test("只有 Authorization header、沒有 Cookie 時回傳 401", async () => {
        const error = new Error("缺少登入驗證token")
        error.statusCode = 401
        mockVerifyToken.mockRejectedValueOnce(error)

        const req = {
            cookies: {},
            headers: {
                authorization: "Token invalid-token"
            }
        }
        const res = createMockResponse()
        const next = jest.fn()

        await requireAuth(req, res, next)

        expect(mockVerifyToken).toHaveBeenCalledWith("")
        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({
            message: "缺少登入驗證token"
        })
    })

    test("token 無效時回傳 401", async () => {
        const error = new Error("登入驗證失敗")
        error.statusCode = 401
        mockVerifyToken.mockRejectedValueOnce(error)

        const req = {
            cookies: {
                officePoliticsAuthToken: "invalid-token"
            }
        }
        const res = createMockResponse()
        const next = jest.fn()

        await requireAuth(req, res, next)

        expect(mockVerifyToken).toHaveBeenCalledWith("invalid-token")
        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({
            message: "登入驗證失敗"
        })
    })

    test("token 有效時把 player 寫入 req.player 並呼叫 next", async () => {
        const player = {
            id: 1,
            authUserId: "auth-user-001",
            username: "測試玩家",
            account: "test@example.com"
        }

        mockVerifyToken.mockResolvedValueOnce(player)

        const req = {
            cookies: {
                officePoliticsAuthToken: "valid-token"
            }
        }
        const res = createMockResponse()
        const next = jest.fn()

        await requireAuth(req, res, next)

        expect(mockVerifyToken).toHaveBeenCalledWith("valid-token")
        expect(req.player).toEqual(player)
        expect(next).toHaveBeenCalledTimes(1)
        expect(res.status).not.toHaveBeenCalled()
        expect(res.json).not.toHaveBeenCalled()
    })

    test("service 回傳自訂 statusCode 時，使用該 statusCode", async () => {
        const error = new Error("找不到玩家資料")
        error.statusCode = 404
        mockVerifyToken.mockRejectedValueOnce(error)

        const req = {
            cookies: {
                officePoliticsAuthToken: "valid-token"
            }
        }
        const res = createMockResponse()
        const next = jest.fn()

        await requireAuth(req, res, next)

        expect(mockVerifyToken).toHaveBeenCalledWith("valid-token")
        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(404)
        expect(res.json).toHaveBeenCalledWith({
            message: "找不到玩家資料"
        })
    })

    test("service 發生未知錯誤時，不回傳內部錯誤訊息", async () => {
        const consoleErrorSpy = jest
            .spyOn(console, "error")
            .mockImplementation(() => {})

        mockVerifyToken.mockRejectedValueOnce(
            new Error('查詢玩家資料時發生資料庫外鍵約束錯誤')
        )

        const req = {
            cookies: {
                officePoliticsAuthToken: "valid-token"
            }
        }
        const res = createMockResponse()
        const next = jest.fn()

        await requireAuth(req, res, next)

        expect(mockVerifyToken).toHaveBeenCalledWith("valid-token")
        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({
            message: "請先登入"
        })

        consoleErrorSpy.mockRestore()
    })
})

describe("requireMemberAuth middleware", () => {
    beforeEach(() => {
        mockVerifyToken.mockReset()
    })

    test("訪客玩家不能使用會員功能", async () => {
        mockVerifyToken.mockResolvedValueOnce({
            id: 99,
            username: "訪客玩家",
            authUserId: null,
            account: null
        })

        const req = {
            cookies: {
                officePoliticsAuthToken: "guest-token"
            }
        }
        const res = createMockResponse()
        const next = jest.fn()

        await requireMemberAuth(req, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith({
            message: "登入解鎖更多功能"
        })
    })

    test("會員玩家可以使用會員功能", async () => {
        const player = {
            id: 1,
            username: "會員玩家",
            authUserId: "auth-user-001",
            account: "member@example.com"
        }

        mockVerifyToken.mockResolvedValueOnce(player)

        const req = {
            cookies: {
                officePoliticsAuthToken: "member-token"
            }
        }
        const res = createMockResponse()
        const next = jest.fn()

        await requireMemberAuth(req, res, next)

        expect(req.player).toEqual(player)
        expect(next).toHaveBeenCalledTimes(1)
        expect(res.status).not.toHaveBeenCalled()
    })
})
