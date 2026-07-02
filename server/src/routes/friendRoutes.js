import express from "express"
import {
  handleAcceptFriendRequest,
  handleBlockPlayer,
  handleGetBlockedPlayers,
  handleGetFriends,
  handleGetReceivedFriendRequests,
  handleGetSentFriendRequests,
  handleRemoveFriend,
  handleRejectFriendRequest,
  handleSendFriendRequest,
  handleUnblockPlayer,
} from "../controllers/friendController.js"

const router = express.Router()

router.post("/requests", handleSendFriendRequest)
router.get("/requests/received", handleGetReceivedFriendRequests)
router.get("/requests/sent", handleGetSentFriendRequests)
router.post("/requests/:id/accept", handleAcceptFriendRequest)
router.post("/requests/:id/reject", handleRejectFriendRequest)
router.post("/blocks", handleBlockPlayer)
router.get("/blocks", handleGetBlockedPlayers)
router.post("/blocks/:id/unblock", handleUnblockPlayer)
router.delete("/:id", handleRemoveFriend)
router.get("/", handleGetFriends)

export { router }
