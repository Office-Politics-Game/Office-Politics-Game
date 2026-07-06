import express from "express"
import {
  handleGetDirectMessages,
  handleSendDirectMessage,
} from "../controllers/chatController.js"

const router = express.Router()

router.get("/direct/:friendId/messages", handleGetDirectMessages)
router.post("/direct/:friendId/messages", handleSendDirectMessage)

export { router }
