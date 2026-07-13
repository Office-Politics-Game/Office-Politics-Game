import express from "express"
import { handleGetPlayerAchievements } from "../controllers/achievementController.js"

const router = express.Router()

router.get("/:playerId/achievements", handleGetPlayerAchievements)

export { router }
