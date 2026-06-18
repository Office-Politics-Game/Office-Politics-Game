import express from "express"
import { handleGetState } from "../controllers/gameSessionController.js"

const router = express.Router()

router.get("/room/:roomCode", handleGetState)

export { router }
