import express from "express"
import {
  handleGetDirectMessages,
  handleSendDirectMessage,
} from "../controllers/chatController.js"
import { requireAuth } from "../middlewares/authMiddleware.js"

const router = express.Router()

router.get("/direct/:friendId/messages", requireAuth, handleGetDirectMessages)
router.post("/direct/:friendId/messages", requireAuth, handleSendDirectMessage)

export { router }
