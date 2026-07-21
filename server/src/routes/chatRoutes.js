import express from "express"
import {
  handleGetDirectMessages,
  handleSendDirectMessage,
} from "../controllers/chatController.js"
import { requireMemberAuth } from "../middlewares/authMiddleware.js"

const router = express.Router()

router.use(requireMemberAuth)

router.get("/direct/:friendId/messages", handleGetDirectMessages)
router.post("/direct/:friendId/messages", handleSendDirectMessage)

export { router }
