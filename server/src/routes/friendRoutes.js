import express from "express"
import {
  handleAcceptFriendRequest,
  handleGetFriends,
  handleGetReceivedFriendRequests,
  handleGetSentFriendRequests,
  handleRejectFriendRequest,
  handleSendFriendRequest,
} from "../controllers/friendController.js"

const router = express.Router()

router.post("/requests", handleSendFriendRequest)
router.get("/requests/received", handleGetReceivedFriendRequests)
router.get("/requests/sent", handleGetSentFriendRequests)
router.post("/requests/:id/accept", handleAcceptFriendRequest)
router.post("/requests/:id/reject", handleRejectFriendRequest)
router.get("/", handleGetFriends)

export { router }
