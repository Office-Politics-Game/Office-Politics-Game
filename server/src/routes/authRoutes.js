import express from "express"
import { handleRegisterPlayer, handleLoginPlayer, handleGetCurrentPlayer } from "../controllers/authController.js"
import { requireAuth } from "../middlewares/authMiddleware.js"

const router = express.Router()

router.post("/register", handleRegisterPlayer)
router.post("/login", handleLoginPlayer)
router.get("/me", requireAuth, handleGetCurrentPlayer)
router.get("/verify", requireAuth, handleGetCurrentPlayer)

export { router }
