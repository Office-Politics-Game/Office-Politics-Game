import express from "express"
import {
  handleAcceptRoomInvitation,
  handleGetPendingRoomInvitations,
  handleRejectRoomInvitation,
  handleSendRoomInvitation,
} from "../controllers/roomInvitationController.js"

const router = express.Router()

router.post("/rooms/:roomCode/invitations", handleSendRoomInvitation)
router.get("/room-invitations", handleGetPendingRoomInvitations)
router.post("/room-invitations/:id/accept", handleAcceptRoomInvitation)
router.post("/room-invitations/:id/reject", handleRejectRoomInvitation)

export { router }
