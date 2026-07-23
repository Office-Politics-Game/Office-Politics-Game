import { jest } from "@jest/globals"

const queryMock = jest.fn()
const clientQueryMock = jest.fn()
const releaseMock = jest.fn()
const connectMock = jest.fn()

jest.unstable_mockModule("../src/db/index.js", () => ({
  default: {
    query: queryMock,
    connect: connectMock,
  },
}))

const {
  equipShopItem,
  getPlayerEquippedItems,
  getPlayerItems,
  getShopItems,
  purchaseShopItem,
} = await import("../src/services/shopService.js")

beforeEach(() => {
  queryMock.mockReset()
  clientQueryMock.mockReset()
  releaseMock.mockReset()
  connectMock.mockReset()
  connectMock.mockResolvedValue({
    query: clientQueryMock,
    release: releaseMock,
  })
})

describe("shopService", () => {
  test("getShopItems() 可以查詢啟用中的商品並依類型篩選", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          name: "顧問卡面",
          description: "卡面",
          type: "card_skin",
          price: 620,
          currency: "coin",
          image_url: "/card.webp",
          is_active: true,
          start_at: null,
          end_at: null,
          stock: null,
          purchase_limit: 1,
          created_at: "created",
          updated_at: "updated",
        },
      ],
    })

    const items = await getShopItems({ type: "card_skin", activeOnly: true })

    expect(items).toEqual([
      {
        id: 1,
        name: "顧問卡面",
        description: "卡面",
        type: "card_skin",
        price: 620,
        currency: "coin",
        imageUrl: "/card.webp",
        isActive: true,
        startAt: null,
        endAt: null,
        stock: null,
        purchaseLimit: 1,
        createdAt: "created",
        updatedAt: "updated",
      },
    ])
    expect(queryMock.mock.calls[0][1]).toEqual(["card_skin"])
    expect(queryMock.mock.calls[0][0]).toContain("is_active = true")
  })

  test("getPlayerItems() 可以回傳玩家持有商品與商品資料", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          player_id: 1,
          shop_item_id: 2,
          quantity: 1,
          created_at: "owned",
          item_id: 2,
          name: "卡背",
          description: "卡背描述",
          type: "card_back",
          price: 320,
          currency: "coin",
          image_url: "/back.webp",
          is_active: true,
          start_at: null,
          end_at: null,
          stock: null,
          purchase_limit: 1,
          item_created_at: "item-created",
          item_updated_at: "item-updated",
        },
      ],
    })

    const items = await getPlayerItems(1)

    expect(items[0]).toMatchObject({
      id: 10,
      playerId: 1,
      shopItemId: 2,
      quantity: 1,
      item: {
        id: 2,
        name: "卡背",
        type: "card_back",
        imageUrl: "/back.webp",
      },
    })
  })

  test("purchaseShopItem() 可以扣款、更新持有商品、寫入購買紀錄與流水", async () => {
    clientQueryMock
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({
        rows: [
          {
            id: 2,
            name: "顧問卡面",
            description: "卡面",
            type: "card_skin",
            price: 100,
            currency: "coin",
            image_url: "/card.webp",
            is_active: true,
            start_at: null,
            end_at: null,
            stock: 5,
            purchase_limit: 3,
            created_at: "created",
            updated_at: "updated",
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ quantity: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, coins: 500 }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            coins: 300,
            gems: 0,
            tickets: 0,
            balance_after: 300,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 20,
            player_id: 1,
            shop_item_id: 2,
            quantity: 3,
            created_at: "owned",
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 30,
            player_id: 1,
            shop_item_id: 2,
            quantity: 2,
            unit_price: 100,
            total_price: 200,
            currency: "coin",
            created_at: "log",
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] }) // COMMIT

    const result = await purchaseShopItem({
      playerId: 1,
      shopItemId: 2,
      quantity: 2,
    })

    expect(result.currency).toMatchObject({
      playerId: 1,
      currency: "coin",
      amount: -200,
      balanceAfter: 300,
    })
    expect(result.playerItem).toMatchObject({
      playerId: 1,
      shopItemId: 2,
      quantity: 3,
    })
    expect(clientQueryMock).toHaveBeenCalledWith("COMMIT")
    expect(releaseMock).toHaveBeenCalledTimes(1)
  })

  test("purchaseShopItem() 購買招募券時扣除股份並增加 tickets", async () => {
    clientQueryMock
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({
        rows: [
          {
            id: 8,
            name: "招募券",
            description: "可進行一次招募",
            type: "gacha_ticket",
            price: 30,
            currency: "ticket",
            image_url: "/ticket.webp",
            is_active: true,
            start_at: null,
            end_at: null,
            stock: null,
            purchase_limit: null,
            created_at: "created",
            updated_at: "updated",
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 1, gems: 500 }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            coins: 0,
            gems: 300,
            tickets: 7,
            balance_after: 300,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 20,
            player_id: 1,
            shop_item_id: 8,
            quantity: 2,
            created_at: "owned",
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 30,
            player_id: 1,
            shop_item_id: 8,
            quantity: 2,
            unit_price: 100,
            total_price: 200,
            currency: "diamond",
            created_at: "log",
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] }) // COMMIT

    const result = await purchaseShopItem({
      playerId: 1,
      shopItemId: 8,
      quantity: 2,
    })

    expect(clientQueryMock.mock.calls[4][0]).toContain("tickets = tickets + $2")
    expect(clientQueryMock.mock.calls[4][1]).toEqual([200, 2, 1])
    expect(clientQueryMock.mock.calls[6][1]).toEqual([
      1,
      8,
      2,
      100,
      200,
      "diamond",
    ])
    expect(clientQueryMock.mock.calls[8][1]).toEqual([
      1,
      "ticket",
      2,
      7,
      "shop_purchase",
      "購買商城招募券：招募券",
    ])
    expect(result.currency).toMatchObject({
      currency: "diamond",
      amount: -200,
      balanceAfter: 300,
      gems: 300,
      tickets: 7,
    })
    expect(result.item.price).toBe(100)
    expect(clientQueryMock).toHaveBeenCalledWith("COMMIT")
  })

  test("purchaseShopItem() 餘額不足時會 rollback", async () => {
    clientQueryMock
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({
        rows: [
          {
            id: 2,
            name: "顧問卡面",
            type: "card_skin",
            price: 999,
            currency: "coin",
            is_active: true,
            start_at: null,
            end_at: null,
            stock: null,
            purchase_limit: null,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 1, coins: 10 }] })
      .mockResolvedValueOnce({ rows: [] }) // ROLLBACK

    await expect(
      purchaseShopItem({ playerId: 1, shopItemId: 2, quantity: 1 })
    ).rejects.toThrow("餘額不足")

    expect(clientQueryMock).toHaveBeenCalledWith("ROLLBACK")
    expect(releaseMock).toHaveBeenCalledTimes(1)
  })

  test("getPlayerEquippedItems() 沒有資料時回傳空裝備", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] })

    await expect(getPlayerEquippedItems(1)).resolves.toEqual({
      playerId: 1,
      avatarItemId: null,
      cardSkinItemId: null,
      cardSkinOverrides: {},
      cardBackItemId: null,
      boardSkinItemId: null,
      updatedAt: null,
    })
  })

  test("equipShopItem() 可以裝備已持有的卡背", async () => {
    clientQueryMock
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 2, type: "card_back" }] })
      .mockResolvedValueOnce({
        rows: [
          {
            player_id: 1,
            avatar_item_id: null,
            card_skin_item_id: null,
            card_back_item_id: 2,
            board_skin_item_id: null,
            updated_at: "updated",
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] }) // COMMIT

    const equipped = await equipShopItem({ playerId: 1, shopItemId: 2 })

    expect(equipped).toEqual({
      playerId: 1,
      avatarItemId: null,
      cardSkinItemId: null,
      cardSkinOverrides: {},
      cardBackItemId: 2,
      boardSkinItemId: null,
      updatedAt: "updated",
    })
    expect(clientQueryMock.mock.calls[1][1]).toEqual([1, 2])
    expect(clientQueryMock.mock.calls[2][0]).toContain("card_back_item_id")
  })

  test("equipShopItem() 不允許裝備抽卡券", async () => {
    clientQueryMock
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 3, type: "gacha_ticket" }] })
      .mockResolvedValueOnce({ rows: [] }) // ROLLBACK

    await expect(
      equipShopItem({ playerId: 1, shopItemId: 3 })
    ).rejects.toThrow("此商品類型不可裝備")

    expect(clientQueryMock).toHaveBeenCalledWith("ROLLBACK")
  })
})
