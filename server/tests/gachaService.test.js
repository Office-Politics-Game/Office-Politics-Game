import { jest } from "@jest/globals"

const clientQueryMock = jest.fn()
const releaseMock = jest.fn()
const connectMock = jest.fn()

jest.unstable_mockModule("../src/db/index.js", () => ({
  default: {
    connect: connectMock,
  },
}))

const { drawGacha } = await import("../src/services/gachaService.js")

const poolCards = [
  {
    pool_id: 1,
    weight: 1,
    gacha_card_id: 1,
    name: "Intern",
    rank: 1,
    type: "role",
    description: "Guess",
    image_key: "intern",
    frame_key: "intern",
  },
]

beforeEach(() => {
  clientQueryMock.mockReset()
  releaseMock.mockReset()
  connectMock.mockReset()
  connectMock.mockResolvedValue({
    query: clientQueryMock,
    release: releaseMock,
  })
})

describe("gachaService", () => {
  test("drawGacha() single draw spends one ticket and grants one card", async () => {
    clientQueryMock
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, coins: 0, gems: 0, tickets: 3 }] })
      .mockResolvedValueOnce({ rows: poolCards })
      .mockResolvedValueOnce({ rows: [{ id: 1, coins: 0, gems: 0, tickets: 2 }] })
      .mockResolvedValueOnce({ rows: [] }) // ticket log
      .mockResolvedValueOnce({ rows: [] }) // existing owned cards
      .mockResolvedValueOnce({ rows: [] }) // new owned cards
      .mockResolvedValueOnce({ rows: [] }) // draw logs
      .mockResolvedValueOnce({ rows: [] }) // COMMIT

    const result = await drawGacha({ playerId: 1, count: 1 })

    expect(result.results).toHaveLength(1)
    expect(result.results[0]).toMatchObject({
      card: { id: 1, name: "Intern", rank: 1 },
      isDuplicate: false,
      compensationCoins: 0,
    })
    expect(result.currency).toMatchObject({ playerId: 1, tickets: 2 })
    expect(result).not.toHaveProperty("ownedCards")
    expect(clientQueryMock.mock.calls[3][1]).toEqual([1, 1])
    expect(clientQueryMock.mock.calls[5][1]).toEqual([1, [1]])
    expect(clientQueryMock.mock.calls[6][1]).toEqual([1, [1]])
    expect(clientQueryMock).toHaveBeenCalledWith("COMMIT")
    expect(releaseMock).toHaveBeenCalledTimes(1)
    expect(
      clientQueryMock.mock.calls.some(([sql]) => /JOIN gacha_cards gc ON gc\.id = pgc\.gacha_card_id/.test(sql)),
    ).toBe(false)
  })

  test("drawGacha() ten draw spends ten tickets and returns ten results", async () => {
    clientQueryMock
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, coins: 0, gems: 0, tickets: 10 }] })
      .mockResolvedValueOnce({ rows: poolCards })
      .mockResolvedValueOnce({ rows: [{ id: 1, coins: 0, gems: 0, tickets: 0 }] })
      .mockResolvedValueOnce({ rows: [] }) // ticket log
      .mockResolvedValueOnce({ rows: [] }) // existing owned cards
      .mockResolvedValueOnce({ rows: [] }) // new owned cards
      .mockResolvedValueOnce({ rows: [] }) // draw logs
      .mockResolvedValueOnce({ rows: [{ id: 1, coins: 900, gems: 0, tickets: 0 }] })
      .mockResolvedValueOnce({ rows: [] }) // compensation log
      .mockResolvedValueOnce({ rows: [] }) // COMMIT

    const result = await drawGacha({ playerId: 1, count: 10 })

    expect(result.results).toHaveLength(10)
    expect(result.results.filter((draw) => draw.isDuplicate)).toHaveLength(9)
    expect(result.currency).toMatchObject({ playerId: 1, tickets: 0 })
    expect(clientQueryMock.mock.calls[3][1]).toEqual([10, 1])
    expect(clientQueryMock.mock.calls[6][1]).toEqual([1, [1]])
    expect(clientQueryMock.mock.calls[7][1][3]).toHaveLength(10)
    expect(clientQueryMock).toHaveBeenCalledWith("COMMIT")
    expect(clientQueryMock.mock.calls).toHaveLength(11)
  })

  test("drawGacha() duplicate card grants coin compensation", async () => {
    clientQueryMock
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, coins: 50, gems: 0, tickets: 1 }] })
      .mockResolvedValueOnce({ rows: poolCards })
      .mockResolvedValueOnce({ rows: [{ id: 1, coins: 50, gems: 0, tickets: 0 }] })
      .mockResolvedValueOnce({ rows: [] }) // ticket log
      .mockResolvedValueOnce({ rows: [{ gacha_card_id: 1 }] }) // existing owned cards
      .mockResolvedValueOnce({ rows: [] }) // draw logs
      .mockResolvedValueOnce({ rows: [{ id: 1, coins: 150, gems: 0, tickets: 0 }] })
      .mockResolvedValueOnce({ rows: [] }) // compensation log
      .mockResolvedValueOnce({ rows: [] }) // COMMIT

    const result = await drawGacha({ playerId: 1, count: 1 })

    expect(result.results[0]).toMatchObject({
      isDuplicate: true,
      compensationCoins: 100,
    })
    expect(result.currency).toMatchObject({ coins: 150, tickets: 0 })
    expect(clientQueryMock.mock.calls[7][1]).toEqual([100, 1])
  })

  test("drawGacha() rejects when tickets are insufficient", async () => {
    clientQueryMock
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, coins: 0, gems: 0, tickets: 0 }] })
      .mockResolvedValueOnce({ rows: [] }) // ROLLBACK

    await expect(drawGacha({ playerId: 1, count: 1 })).rejects.toThrow("抽卡券不足")

    expect(clientQueryMock).toHaveBeenCalledWith("ROLLBACK")
    expect(releaseMock).toHaveBeenCalledTimes(1)
  })

  test("drawGacha() rejects invalid draw count before opening a transaction", async () => {
    await expect(drawGacha({ playerId: 1, count: 3 })).rejects.toThrow(
      "抽卡次數只能是 1 或 10"
    )

    expect(connectMock).not.toHaveBeenCalled()
  })
})
