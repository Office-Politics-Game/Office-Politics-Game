import { jest } from "@jest/globals"

const equipShopItemMock = jest.fn()
const getPlayerEquippedItemsMock = jest.fn()
const getPlayerItemsMock = jest.fn()
const getShopItemsMock = jest.fn()
const purchaseShopItemMock = jest.fn()
const unequipShopItemMock = jest.fn()
const updateCardSkinLoadoutMock = jest.fn()
const createCloudinaryUploadSignatureMock = jest.fn()
const getCloudinaryUploadConfigMock = jest.fn()

jest.unstable_mockModule("../src/services/shopService.js", () => ({
  equipShopItem: equipShopItemMock,
  getPlayerEquippedItems: getPlayerEquippedItemsMock,
  getPlayerItems: getPlayerItemsMock,
  getShopItems: getShopItemsMock,
  purchaseShopItem: purchaseShopItemMock,
  unequipShopItem: unequipShopItemMock,
  updateCardSkinLoadout: updateCardSkinLoadoutMock,
}))

jest.unstable_mockModule("../src/services/cloudinaryService.js", () => ({
  createCloudinaryUploadSignature: createCloudinaryUploadSignatureMock,
  getCloudinaryUploadConfig: getCloudinaryUploadConfigMock,
}))

const {
  handleEquipShopItem,
  handleGetPlayerEquippedItems,
  handleGetPlayerItems,
  handleGetShopItems,
  handlePurchaseShopItem,
} = await import("../src/controllers/shopController.js")

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
  equipShopItemMock.mockReset()
  getPlayerEquippedItemsMock.mockReset()
  getPlayerItemsMock.mockReset()
  getShopItemsMock.mockReset()
  purchaseShopItemMock.mockReset()
  unequipShopItemMock.mockReset()
  updateCardSkinLoadoutMock.mockReset()
  createCloudinaryUploadSignatureMock.mockReset()
  getCloudinaryUploadConfigMock.mockReset()
})

describe("shopController", () => {
  test("handleGetShopItems() 回傳商品列表並傳入篩選條件", async () => {
    const items = [
      {
        id: 1,
        name: "顧問風格卡面",
        type: "card_skin",
        price: 620,
        currency: "coin",
        imageUrl: "/images/card-bg-advisor.webp",
        isActive: true,
      },
    ]

    getShopItemsMock.mockResolvedValueOnce(items)

    const req = {
      query: {
        type: "card_skin",
        activeOnly: "true",
      },
    }
    const res = createMockResponse()

    await handleGetShopItems(req, res)

    expect(getShopItemsMock).toHaveBeenCalledWith({
      type: "card_skin",
      activeOnly: true,
    })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ items })
  })

  test("handleGetShopItems() 支援 activeOnly=false 查全部商品", async () => {
    getShopItemsMock.mockResolvedValueOnce([])

    const req = {
      query: {
        activeOnly: "false",
      },
    }
    const res = createMockResponse()

    await handleGetShopItems(req, res)

    expect(getShopItemsMock).toHaveBeenCalledWith({
      type: undefined,
      activeOnly: false,
    })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ items: [] })
  })

  test("handleGetPlayerItems() 回傳玩家持有商品", async () => {
    const items = [
      {
        id: 10,
        playerId: 1,
        shopItemId: 2,
        quantity: 1,
        item: {
          id: 2,
          name: "經典卡背",
          type: "card_back",
        },
      },
    ]

    getPlayerItemsMock.mockResolvedValueOnce(items)

    const req = {
      params: {
        playerId: "1",
      },
    }
    const res = createMockResponse()

    await handleGetPlayerItems(req, res)

    expect(getPlayerItemsMock).toHaveBeenCalledWith(1)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ items })
  })

  test("handleGetPlayerItems() playerId 不合法時回傳 400", async () => {
    const req = {
      params: {
        playerId: "abc",
      },
    }
    const res = createMockResponse()

    await handleGetPlayerItems(req, res)

    expect(getPlayerItemsMock).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: "缺少玩家ID" })
  })

  test("handlePurchaseShopItem() 回傳購買結果", async () => {
    const purchaseResult = {
      playerItem: {
        playerId: 1,
        shopItemId: 1,
        quantity: 1,
      },
      purchaseLog: {
        playerId: 1,
        shopItemId: 1,
        totalPrice: 620,
        currency: "coin",
      },
      currency: {
        playerId: 1,
        currency: "coin",
        amount: -620,
        balanceAfter: 4380,
      },
    }

    purchaseShopItemMock.mockResolvedValueOnce(purchaseResult)

    const req = {
      body: {
        playerId: 1,
        shopItemId: 1,
      },
    }
    const res = createMockResponse()

    await handlePurchaseShopItem(req, res)

    expect(purchaseShopItemMock).toHaveBeenCalledWith({
      playerId: 1,
      shopItemId: 1,
      quantity: 1,
    })
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(purchaseResult)
  })

  test("handlePurchaseShopItem() 回傳 service 指定錯誤狀態", async () => {
    const error = new Error("餘額不足")
    error.statusCode = 400
    purchaseShopItemMock.mockRejectedValueOnce(error)

    const req = {
      body: {
        playerId: 1,
        shopItemId: 1,
        quantity: 1,
      },
    }
    const res = createMockResponse()

    await handlePurchaseShopItem(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: "餘額不足",
      error: "餘額不足",
    })
  })

  test("handleGetPlayerEquippedItems() 回傳玩家目前裝備", async () => {
    const equipped = {
      playerId: 1,
      avatarItemId: null,
      cardSkinItemId: 2,
      cardBackItemId: 4,
      boardSkinItemId: null,
      updatedAt: "updated",
    }

    getPlayerEquippedItemsMock.mockResolvedValueOnce(equipped)

    const req = {
      params: {
        playerId: "1",
      },
    }
    const res = createMockResponse()

    await handleGetPlayerEquippedItems(req, res)

    expect(getPlayerEquippedItemsMock).toHaveBeenCalledWith(1)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ equipped })
  })

  test("handleGetPlayerEquippedItems() playerId 不合法時回傳 400", async () => {
    const req = {
      params: {
        playerId: "0",
      },
    }
    const res = createMockResponse()

    await handleGetPlayerEquippedItems(req, res)

    expect(getPlayerEquippedItemsMock).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: "缺少玩家ID" })
  })

  test("handleEquipShopItem() 回傳更新後裝備", async () => {
    const equipped = {
      playerId: 1,
      avatarItemId: null,
      cardSkinItemId: 2,
      cardBackItemId: null,
      boardSkinItemId: null,
      updatedAt: "updated",
    }

    equipShopItemMock.mockResolvedValueOnce(equipped)

    const req = {
      body: {
        playerId: 1,
        shopItemId: 2,
      },
    }
    const res = createMockResponse()

    await handleEquipShopItem(req, res)

    expect(equipShopItemMock).toHaveBeenCalledWith({
      playerId: 1,
      shopItemId: 2,
      categoryId: null,
    })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ equipped })
  })

  test("handleEquipShopItem() 回傳 service 指定錯誤狀態", async () => {
    const error = new Error("玩家尚未擁有此商品")
    error.statusCode = 404
    equipShopItemMock.mockRejectedValueOnce(error)

    const req = {
      body: {
        playerId: 1,
        shopItemId: 99,
      },
    }
    const res = createMockResponse()

    await handleEquipShopItem(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: "玩家尚未擁有此商品",
      error: "玩家尚未擁有此商品",
    })
  })
})
