import express from "express"
import { handleRegisterPlayer, handleLoginPlayer, handleVerifyToken, handleForgotPassword, handleResetPassword } from "../controllers/authController.js"

const router = express.Router()

router.post("/register", handleRegisterPlayer)
router.post("/login", handleLoginPlayer)
router.get("/verify", handleVerifyToken)
router.post("/forgot-password", handleForgotPassword)
router.post("/reset-password", handleResetPassword)

export { router }