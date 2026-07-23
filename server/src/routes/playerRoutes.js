import express from "express"
import {
  handleCreateGuest,
  handleSearchPlayers,
  handleGetPlayerCurrency,
  handleUpdatePlayerAvatar,
} from "../controllers/playerController.js"
import { requireMemberAuth } from "../middlewares/authMiddleware.js"

const router = express.Router()

router.get("/search", requireMemberAuth, handleSearchPlayers)
router.post("/guest", handleCreateGuest)
router.patch("/:playerId/avatar", requireMemberAuth, handleUpdatePlayerAvatar)
router.get("/:playerId/currency", handleGetPlayerCurrency)

export { router }
