import { jest } from "@jest/globals"

const createGuestMock = jest.fn()
const getPlayerCurrencyMock = jest.fn()

jest.unstable_mockModule("../src/services/playerService.js", () => ({
    createGuest: createGuestMock,
}))

jest.unstable_mockModule("../src/services/currencyService.js", () => ({
    getPlayerCurrency: getPlayerCurrencyMock,
}))

const {
    handleGetPlayerCurrency,
} = await import("../src/controllers/playerController.js")

function createMockResponse() {
    const res = {
        status: jest.fn(),
        json: jest.fn(),
    }

    res.status.mockReturnValue(res)
    res.json.mockReturnValue(res)

    return res
}

beforeEach(() => {
    createGuestMock.mockReset()
    getPlayerCurrencyMock.mockReset()
})

describe("handleGetPlayerCurrency", () => {
    test("成功查詢玩家遊戲幣時回傳 200 和餘額資料", async () => {
        const currency = {
            playerId: 1,
            coins: 100,
            gems: 5,
            tickets: 2,
        }

        getPlayerCurrencyMock.mockResolvedValueOnce(currency)

        const req = {
            params: {
                playerId: "1",
            },
        }
        const res = createMockResponse()

        await handleGetPlayerCurrency(req, res)

        expect(getPlayerCurrencyMock).toHaveBeenCalledWith(1)
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({ currency })
    })

    test("玩家不存在時回傳 service 指定的錯誤狀態", async () => {
        const error = new Error("找不到玩家")
        error.statusCode = 404

        getPlayerCurrencyMock.mockRejectedValueOnce(error)

        const req = {
            params: {
                playerId: "999",
            },
        }
        const res = createMockResponse()

        await handleGetPlayerCurrency(req, res)

        expect(getPlayerCurrencyMock).toHaveBeenCalledWith(999)
        expect(res.status).toHaveBeenCalledWith(404)
        expect(res.json).toHaveBeenCalledWith({
            message: "找不到玩家",
            error: "找不到玩家",
        })
    })

    test("未知錯誤時回傳 500", async () => {
        const error = new Error("database failed")

        getPlayerCurrencyMock.mockRejectedValueOnce(error)

        const req = {
            params: {
                playerId: "1",
            },
        }
        const res = createMockResponse()

        await handleGetPlayerCurrency(req, res)

        expect(getPlayerCurrencyMock).toHaveBeenCalledWith(1)
        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.json).toHaveBeenCalledWith({
            message: "取得玩家遊戲幣失敗",
            error: "database failed",
        })
    })
})
