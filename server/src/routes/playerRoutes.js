import express from "express"
import {
  handleCreateGuest,
  handleSearchPlayers,
  handleGetPlayerCurrency,
  handleUpdatePlayerAvatar,
} from "../controllers/playerController.js"

const router = express.Router()

router.get("/search", handleSearchPlayers)
router.post("/guest", handleCreateGuest)
router.patch("/:playerId/avatar", handleUpdatePlayerAvatar)
router.get("/:playerId/currency", handleGetPlayerCurrency)

export { router }
