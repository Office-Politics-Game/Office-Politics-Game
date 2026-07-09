import express from "express"
import {
  handleCreateCloudinaryUploadSignature,
  handleEquipShopItem,
  handleGetCloudinaryUploadConfig,
  handleGetPlayerEquippedItems,
  handleGetPlayerItems,
  handleGetShopItems,
  handlePurchaseShopItem,
  handleUpdateCardSkinLoadout,
} from "../controllers/shopController.js"

const router = express.Router()

router.get("/items", handleGetShopItems)
router.get("/players/:playerId/items", handleGetPlayerItems)
router.post("/purchase", handlePurchaseShopItem)
router.get("/players/:playerId/equipped", handleGetPlayerEquippedItems)
router.post("/equip", handleEquipShopItem)
router.post("/equip-card-skins", handleUpdateCardSkinLoadout)
router.get("/cloudinary/config", handleGetCloudinaryUploadConfig)
router.post("/cloudinary/sign-upload", handleCreateCloudinaryUploadSignature)

export { router }
