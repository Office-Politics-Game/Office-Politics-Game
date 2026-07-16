import express from "express"
import {
    handleRegisterPlayer,
    handleLoginPlayer,
    handleOAuthCallback,
    handleVerifyToken,
    handleLogoutPlayer,
    handleForgotPassword,
    handleResetPassword
} from "../controllers/authController.js"

const router = express.Router()

router.post("/register", handleRegisterPlayer)
router.post("/login", handleLoginPlayer)
router.get("/verify", handleVerifyToken)
router.post("/oauth/callback", handleOAuthCallback)
router.post("/logout", handleLogoutPlayer)
router.post("/forgot-password", handleForgotPassword)
router.post("/reset-password", handleResetPassword)

export { router }