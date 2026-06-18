import express from "express"
import {
  handleCreateRoom,
  handleJoinRoom,
  handleUpdateReady,
  handleStartGame,
} from "../controllers/RoomController.js"

const router = express.Router()

router.post("/", handleCreateRoom)
router.post("/:roomCode/join", handleJoinRoom)
router.patch("/:roomCode/state", handleUpdateReady)
router.post("/:roomCode/start", handleStartGame)

export { router }
