import express from "express"
import {
  handleCreateRoom,
  handleJoinRoom,
  handleAddComputerPlayer,
  handleUpdateReady,
  handleGetRoomState,
  handleKickPlayer,
  handleStartGame,
  handleGetGameResult,
} from "../controllers/roomController.js"

const router = express.Router()

router.post("/", handleCreateRoom)
router.post("/:roomCode/join", handleJoinRoom)
router.post("/:roomCode/computer-players", handleAddComputerPlayer)
router.get("/:roomCode/state", handleGetRoomState)
router.patch("/:roomCode/state", handleUpdateReady)
router.delete("/:roomCode/players/:targetPlayerId", handleKickPlayer)
router.post("/:roomCode/start", handleStartGame)
router.get("/:roomCode/result", handleGetGameResult)

export { router }
