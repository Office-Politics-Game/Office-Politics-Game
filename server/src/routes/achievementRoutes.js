import express from "express"
import { handleGetPlayerAchievements } from "../controllers/achievementController.js"
import { requireMemberAuth } from "../middlewares/authMiddleware.js"

const router = express.Router()

router.get("/:playerId/achievements", requireMemberAuth, handleGetPlayerAchievements)

export { router }
