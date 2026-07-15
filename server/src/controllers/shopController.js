import {
  equipShopItem,
  getPlayerEquippedItems,
  getPlayerItems,
  getShopItems,
  purchaseShopItem,
  updateCardSkinLoadout,
} from "../services/shopService.js"
import {
  createCloudinaryUploadSignature,
  getCloudinaryUploadConfig,
} from "../services/cloudinaryService.js"

function getErrorStatus(error) {
  return error.statusCode || 500
}

function parsePositiveInteger(value) {
  const numberValue = Number(value)

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return null
  }

  return numberValue
}

function parseActiveOnly(value) {
  if (value === undefined) {
    return true
  }

  return value !== "false"
}

async function handleGetShopItems(req, res) {
  try {
    const items = await getShopItems({
      type: req.query.type,
      activeOnly: parseActiveOnly(req.query.activeOnly),
    })

    return res.status(200).json({ items })
  } catch (error) {
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "取得商城商品失敗",
      error: error.message,
    })
  }
}

async function handleGetPlayerItems(req, res) {
  try {
    const playerId = parsePositiveInteger(req.params.playerId)

    if (!playerId) {
      return res.status(400).json({ message: "缺少玩家ID" })
    }

    const items = await getPlayerItems(playerId)

    return res.status(200).json({ items })
  } catch (error) {
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "取得玩家持有商品失敗",
      error: error.message,
    })
  }
}

async function handlePurchaseShopItem(req, res) {
  try {
    const result = await purchaseShopItem({
      playerId: req.body.playerId,
      shopItemId: req.body.shopItemId,
      quantity: req.body.quantity ?? 1,
    })

    return res.status(201).json(result)
  } catch (error) {
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "購買商品失敗",
      error: error.message,
    })
  }
}

async function handleGetPlayerEquippedItems(req, res) {
  try {
    const playerId = parsePositiveInteger(req.params.playerId)

    if (!playerId) {
      return res.status(400).json({ message: "缺少玩家ID" })
    }

    const equipped = await getPlayerEquippedItems(playerId)

    return res.status(200).json({ equipped })
  } catch (error) {
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "取得玩家裝備商品失敗",
      error: error.message,
    })
  }
}

async function handleEquipShopItem(req, res) {
  try {
    const equipped = await equipShopItem({
      playerId: req.body.playerId,
      shopItemId: req.body.shopItemId,
    })

    return res.status(200).json({ equipped })
  } catch (error) {
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "裝備商品失敗",
      error: error.message,
    })
  }
}

async function handleUpdateCardSkinLoadout(req, res) {
  try {
    const equipped = await updateCardSkinLoadout({
      playerId: req.body.playerId,
      cardSkinItemId: req.body.cardSkinItemId ?? null,
      cardSkinOverrides: req.body.cardSkinOverrides ?? {},
    })

    return res.status(200).json({ equipped })
  } catch (error) {
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "Update card skin loadout failed",
      error: error.message,
    })
  }
}

async function handleGetCloudinaryUploadConfig(req, res) {
  try {
    const config = getCloudinaryUploadConfig()

    return res.status(200).json(config)
  } catch (error) {
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "Get Cloudinary config failed",
      error: error.message,
    })
  }
}

async function handleCreateCloudinaryUploadSignature(req, res) {
  try {
    const signedPayload = createCloudinaryUploadSignature({
      folder: req.body?.folder,
      publicId: req.body?.publicId,
      tags: req.body?.tags,
      context: req.body?.context,
    })

    return res.status(200).json(signedPayload)
  } catch (error) {
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "Create Cloudinary signature failed",
      error: error.message,
    })
  }
}

export {
  handleEquipShopItem,
  handleCreateCloudinaryUploadSignature,
  handleGetPlayerEquippedItems,
  handleGetCloudinaryUploadConfig,
  handleGetPlayerItems,
  handleGetShopItems,
  handlePurchaseShopItem,
  handleUpdateCardSkinLoadout,
}
