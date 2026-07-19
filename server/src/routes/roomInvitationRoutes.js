import express from "express"
import {
  handleAcceptRoomInvitation,
  handleGetPendingRoomInvitations,
  handleRejectRoomInvitation,
  handleSendRoomInvitation,
} from "../controllers/roomInvitationController.js"
import { requireAuth } from "../middlewares/authMiddleware.js"

const router = express.Router()

router.post("/rooms/:roomCode/invitations", requireAuth, handleSendRoomInvitation)
router.get("/room-invitations", requireAuth, handleGetPendingRoomInvitations)
router.post("/room-invitations/:id/accept", requireAuth, handleAcceptRoomInvitation)
router.post("/room-invitations/:id/reject", requireAuth, handleRejectRoomInvitation)

export { router }
