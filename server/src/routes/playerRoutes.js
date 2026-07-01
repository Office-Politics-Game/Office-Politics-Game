import express from "express"
import {
    handleCreateGuest,
    handleGetPlayerCurrency,
} from "../controllers/playerController.js"

const router = express.Router()

router.post("/guest", handleCreateGuest)
router.get("/:playerId/currency", handleGetPlayerCurrency)

export { router }
