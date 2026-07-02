import express from "express"
import { handleRegisterPlayer, handleLoginPlayer } from "../controllers/authController.js"

const router = express.Router()

router.post("/register", handleRegisterPlayer)
router.post("/login", handleLoginPlayer)

export { router }