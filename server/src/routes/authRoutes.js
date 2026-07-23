import express from "express"
import {
    handleRegisterPlayer,
    handleLoginPlayer,
    handleOAuthCallback,
    handleVerifyToken,
    handleGetAuthSession,
    handleLogoutPlayer,
    handleForgotPassword,
    handleResetPassword,
    handleChangePassword
} from "../controllers/authController.js"

const router = express.Router()

router.post("/register", handleRegisterPlayer)
router.post("/login", handleLoginPlayer)
router.get("/verify", handleVerifyToken)
router.get("/session", handleGetAuthSession)
router.post("/oauth/callback", handleOAuthCallback)
router.post("/logout", handleLogoutPlayer)
router.post("/forgot-password", handleForgotPassword)
router.post("/reset-password", handleResetPassword)
router.patch("/password", handleChangePassword)

export { router }