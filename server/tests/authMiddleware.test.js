import { jest } from "@jest/globals"

const mockVerifyToken = jest.fn()

jest.unstable_mockModule("../src/services/authService.js", () => ({
    verifyToken: mockVerifyToken
}))

const { requireAuth } = await import("../src/middlewares/authMiddleware.js")

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

    test("沒有驗證 Cookie 時回傳 401", async () => {
        const error = new Error("缺少登入驗證token")
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
})
