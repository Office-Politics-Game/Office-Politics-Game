import express from "express"
import {
  handleEquipShopItem,
  handleGetPlayerEquippedItems,
  handleGetPlayerItems,
  handleGetShopItems,
  handlePurchaseShopItem,
} from "../controllers/shopController.js"

const router = express.Router()

router.get("/items", handleGetShopItems)
router.get("/players/:playerId/items", handleGetPlayerItems)
router.post("/purchase", handlePurchaseShopItem)
router.get("/players/:playerId/equipped", handleGetPlayerEquippedItems)
router.post("/equip", handleEquipShopItem)

export { router }
