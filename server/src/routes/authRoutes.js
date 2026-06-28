import express from "express"
import { handleRegisterPlayer } from "../controllers/authController.js"

const router = express.Router()

router.post("/register", handleRegisterPlayer)

export { router }