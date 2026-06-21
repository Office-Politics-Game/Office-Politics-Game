import express from "express"
import {
  handleCreateRoom,
  handleJoinRoom,
  handleUpdateReady,
  handleGetRoomState,
  handleStartGame,
  handleDrawCard,
} from "../controllers/roomController.js"

const router = express.Router()

router.post("/", handleCreateRoom)
router.post("/:roomCode/join", handleJoinRoom)
router.get("/:roomCode/state", handleGetRoomState)
router.patch("/:roomCode/state", handleUpdateReady)
router.post("/:roomCode/start", handleStartGame)
router.post("/:roomCode/actions/draw-card", handleDrawCard)

export { router }
