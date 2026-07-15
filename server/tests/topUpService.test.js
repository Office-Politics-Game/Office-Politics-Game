import { jest } from "@jest/globals"

const queryMock = jest.fn()
const addCurrencyMock = jest.fn()

jest.unstable_mockModule("../src/db/index.js", () => ({
    default: {
        query: queryMock,
    },
}))

jest.unstable_mockModule("../src/services/currencyService.js", () => ({
    addCurrency: addCurrencyMock,
}))

const {
    getTopUpPackages,
    createTopUpOrder,
    mockPayTopUpOrder,
    createEcpayCheckout,
    confirmEcpayReturn,
    createCheckMacValue,
} = await import("../src/services/topUpService.js")

beforeEach(() => {
    queryMock.mockReset()
    addCurrencyMock.mockReset()
})

describe("topUpService", () => {
    test("getTopUpPackages() returns available top up packages", () => {
        const packages = getTopUpPackages()

        expect(packages).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: "gems_60",
                    currency: "diamond",
                    amount: 60,
                    price: 30,
                }),
            ])
        )
    })

    test("createTopUpOrder() creates pending order", async () => {
        queryMock
            .mockResolvedValueOnce({
                rows: [{ id: 1 }],
            })
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: 10,
                        player_id: 1,
                        package_id: "gems_60",
                        currency: "diamond",
                        amount: 60,
                        price: 30,
                        status: "pending",
                    },
                ],
            })

        const order = await createTopUpOrder(1, "gems_60")

        expect(order.status).toBe("pending")
        expect(queryMock).toHaveBeenCalledTimes(2)
        expect(queryMock.mock.calls[1][1]).toEqual([
            1,
            "gems_60",
            "diamond",
            60,
            30,
        ])
    })

    test("createTopUpOrder() rejects missing player", async () => {
        queryMock.mockResolvedValueOnce({
            rows: [],
        })

        await expect(createTopUpOrder(999, "gems_60")).rejects.toMatchObject({
            statusCode: 404,
        })

        expect(queryMock).toHaveBeenCalledTimes(1)
    })

    test("createTopUpOrder() rejects unknown package", async () => {
        await expect(createTopUpOrder(1, "bad_package")).rejects.toMatchObject({
            statusCode: 404,
        })

        expect(queryMock).not.toHaveBeenCalled()
    })

    test("mockPayTopUpOrder() marks order paid and adds currency", async () => {
        queryMock
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: 10,
                        player_id: 1,
                        currency: "diamond",
                        amount: 60,
                        status: "pending",
                    },
                ],
            })
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: 10,
                        player_id: 1,
                        currency: "diamond",
                        amount: 60,
                        status: "paid",
                    },
                ],
            })

        const order = await mockPayTopUpOrder(10)

        expect(order.status).toBe("paid")
        expect(addCurrencyMock).toHaveBeenCalledWith(
            1,
            "diamond",
            60,
            "top_up",
            expect.any(String)
        )
    })

    test("mockPayTopUpOrder() rejects paid order", async () => {
        queryMock.mockResolvedValueOnce({
            rows: [
                {
                    id: 10,
                    status: "paid",
                },
            ],
        })

        await expect(mockPayTopUpOrder(10)).rejects.toMatchObject({
            statusCode: 409,
        })

        expect(addCurrencyMock).not.toHaveBeenCalled()
    })

    test("createEcpayCheckout() returns checkout data for pending order", async () => {
        queryMock.mockResolvedValueOnce({
            rows: [
                {
                    id: 10,
                    package_id: "gems_60",
                    price: 30,
                    status: "pending",
                },
            ],
        })

        const checkout = await createEcpayCheckout(10)

        expect(checkout).toMatchObject({
            orderId: 10,
            actionUrl: "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5",
            params: {
                MerchantID: "3002607",
                MerchantTradeNo: "TOPUP10",
                PaymentType: "aio",
                TotalAmount: 30,
                TradeDesc: "Office Politics Game top up",
                ItemName: "gems_60",
                ReturnURL: "https://35.212.213.247.sslip.io/api/top-ups/ecpay/return",
                ClientBackURL: "https://office-politics-game-fawn.vercel.app/mall",
                ChoosePayment: "ALL",
                EncryptType: 1,
            },
        })
        expect(checkout.params.MerchantTradeDate).toMatch(
            /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/
        )
        expect(checkout.params.CheckMacValue).toMatch(/^[A-F0-9]{64}$/)
    })

    test("createEcpayCheckout() rejects non-pending order", async () => {
        queryMock.mockResolvedValueOnce({
            rows: [
                {
                    id: 10,
                    status: "paid",
                },
            ],
        })

        await expect(createEcpayCheckout(10)).rejects.toMatchObject({
            statusCode: 409,
        })
    })

    test("createEcpayCheckout() rejects missing order", async () => {
        queryMock.mockResolvedValueOnce({
            rows: [],
        })

        await expect(createEcpayCheckout(999)).rejects.toMatchObject({
            statusCode: 404,
        })
    })

    test("confirmEcpayReturn() confirms paid callback and adds currency", async () => {
        const payload = {
            MerchantID: "3002607",
            MerchantTradeNo: "TOPUP10",
            RtnCode: "1",
            RtnMsg: "Succeeded",
            TradeNo: "2301011234567890",
            TradeAmt: "30",
            PaymentDate: "2026/07/15 12:30:00",
            PaymentType: "Credit_CreditCard",
        }
        payload.CheckMacValue = createCheckMacValue(payload)

        queryMock
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: 10,
                        player_id: 1,
                        currency: "diamond",
                        amount: 60,
                        status: "pending",
                    },
                ],
            })
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: 10,
                        player_id: 1,
                        currency: "diamond",
                        amount: 60,
                        status: "paid",
                    },
                ],
            })

        const order = await confirmEcpayReturn(payload)

        expect(order.status).toBe("paid")
        expect(addCurrencyMock).toHaveBeenCalledWith(
            1,
            "diamond",
            60,
            "top_up",
            expect.any(String)
        )
    })

    test("confirmEcpayReturn() accepts repeated paid callback without adding currency again", async () => {
        const payload = {
            MerchantID: "3002607",
            MerchantTradeNo: "TOPUP10",
            RtnCode: "1",
        }
        payload.CheckMacValue = createCheckMacValue(payload)

        queryMock.mockResolvedValueOnce({
            rows: [
                {
                    id: 10,
                    status: "paid",
                },
            ],
        })

        const order = await confirmEcpayReturn(payload)

        expect(order.status).toBe("paid")
        expect(addCurrencyMock).not.toHaveBeenCalled()
    })

    test("confirmEcpayReturn() rejects callback with invalid CheckMacValue", async () => {
        await expect(
            confirmEcpayReturn({
                MerchantTradeNo: "TOPUP10",
                RtnCode: "1",
                CheckMacValue: "BAD",
            })
        ).rejects.toMatchObject({
            statusCode: 400,
        })

        expect(queryMock).not.toHaveBeenCalled()
        expect(addCurrencyMock).not.toHaveBeenCalled()
    })
})
