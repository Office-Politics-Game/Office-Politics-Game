import { jest } from "@jest/globals"

const {
    handleGetCurrentPlayer,
} = await import("../src/controllers/authController.js")

function createMockResponse() {
    const res = {
        status: jest.fn(),
        json: jest.fn(),
    }

    res.status.mockReturnValue(res)
    res.json.mockReturnValue(res)

    return res
}

describe("handleGetCurrentPlayer", () => {
    test("成功時回傳目前登入玩家資料", async () => {
        const player = {
            id: 1,
            authUserId: "auth-user-001",
            username: "測試玩家",
            account: "test@example.com",
        }
        const req = { player }
        const res = createMockResponse()

        await handleGetCurrentPlayer(req, res)

        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({ player })
    })
})
