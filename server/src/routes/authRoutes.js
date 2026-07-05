import express from "express"
import { handleRegisterPlayer, handleLoginPlayer, handleVerifyToken } from "../controllers/authController.js"

const router = express.Router()

router.post("/register", handleRegisterPlayer)
router.post("/login", handleLoginPlayer)
router.get("/verify", handleVerifyToken)

export { router }