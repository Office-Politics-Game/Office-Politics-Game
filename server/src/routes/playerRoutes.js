import express from "express"
import {
  handleCreateGuest,
  handleSearchPlayers,
  handleGetPlayerCurrency,
} from "../controllers/playerController.js"

const router = express.Router()

router.get("/search", handleSearchPlayers)
router.post("/guest", handleCreateGuest)
router.get("/:playerId/currency", handleGetPlayerCurrency)

export { router }
