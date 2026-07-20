import express from "express"
import {
  handleAcceptRoomInvitation,
  handleGetPendingRoomInvitations,
  handleRejectRoomInvitation,
  handleSendRoomInvitation,
} from "../controllers/roomInvitationController.js"
import { requireMemberAuth } from "../middlewares/authMiddleware.js"

const router = express.Router()

router.post("/rooms/:roomCode/invitations", requireMemberAuth, handleSendRoomInvitation)
router.get("/room-invitations", requireMemberAuth, handleGetPendingRoomInvitations)
router.post("/room-invitations/:id/accept", requireMemberAuth, handleAcceptRoomInvitation)
router.post("/room-invitations/:id/reject", requireMemberAuth, handleRejectRoomInvitation)

export { router }
