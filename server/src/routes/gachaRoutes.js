import express from "express"
import { handleDrawGacha, handleGetOwnedGachaCards } from "../controllers/gachaController.js"
import { requireMemberAuth } from "../middlewares/authMiddleware.js"

const router = express.Router()

router.use(requireMemberAuth)

router.get("/owned-cards", handleGetOwnedGachaCards)
router.post("/draw", handleDrawGacha)

export { router }
