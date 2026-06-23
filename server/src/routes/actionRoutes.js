import express from "express"
import { handlePlayCard, handleDrawCard } from "../controllers/actionController.js"

const router = express.Router()
const roomActionRouter = express.Router()

router.post("/play-card", handlePlayCard)
roomActionRouter.post("/:roomCode/actions/draw-card", handleDrawCard)

export { router, roomActionRouter }
