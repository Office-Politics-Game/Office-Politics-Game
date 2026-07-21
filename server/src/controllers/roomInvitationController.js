import {
  acceptRoomInvitation,
  getPendingRoomInvitations,
  rejectRoomInvitation,
  sendRoomInvitation,
} from "../services/roomInvitationService.js"
import { getRoomState } from "../services/roomService.js"
import { getSocketServer } from "../socket/index.js"

function getErrorStatus(error){
  return error.statusCode || 500
}

function parsePositiveInteger(value){
  const numberValue = Number(value)

  if (!Number.isInteger(numberValue) || numberValue <= 0){
    return null
  }

  return numberValue
}

async function handleSendRoomInvitation(req, res){
  try {
    const body = req.body ?? {}
    const { roomCode } = req.params
    const inviterPlayerId = parsePositiveInteger(req.player?.id)
    const inviteePlayerId = parsePositiveInteger(body.inviteePlayerId)

    if (!roomCode || !inviterPlayerId || !inviteePlayerId){
      return res.status(400).json({ message: "缺少房間或邀請玩家資料" })
    }

    const invitation = await sendRoomInvitation({
      roomCode,
      inviterPlayerId,
      inviteePlayerId,
    })

    return res.status(201).json({ invitation })
  } catch (error){
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "送出房間邀請失敗",
      error: error.message,
    })
  }
}

async function handleGetPendingRoomInvitations(req, res){
  try {
    const playerId = parsePositiveInteger(req.player?.id)

    if (!playerId){
      return res.status(400).json({ message: "缺少玩家ID" })
    }

    const invitations = await getPendingRoomInvitations({ playerId })

    return res.status(200).json({ invitations })
  } catch (error){
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "取得房間邀請失敗",
      error: error.message,
    })
  }
}

async function handleAcceptRoomInvitation(req, res){
  try {
    const invitationId = parsePositiveInteger(req.params.id)
    const playerId = parsePositiveInteger(req.player?.id)

    if (!invitationId || !playerId){
      return res.status(400).json({ message: "缺少房間邀請或玩家資料" })
    }

    const result = await acceptRoomInvitation({ invitationId, playerId })

    if (result.room?.roomCode){
      const roomState = await getRoomState({ roomCode: result.room.roomCode })
      const io = getSocketServer()

      io?.emit("room:state", roomState)
    }

    return res.status(200).json({
      message: "已接受房間邀請",
      ...result,
    })
  } catch (error){
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "接受房間邀請失敗",
      error: error.message,
    })
  }
}

async function handleRejectRoomInvitation(req, res){
  try {
    const invitationId = parsePositiveInteger(req.params.id)
    const playerId = parsePositiveInteger(req.player?.id)

    if (!invitationId || !playerId){
      return res.status(400).json({ message: "缺少房間邀請或玩家資料" })
    }

    const invitation = await rejectRoomInvitation({ invitationId, playerId })

    return res.status(200).json({
      message: "已拒絕房間邀請",
      invitation,
    })
  } catch (error){
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "拒絕房間邀請失敗",
      error: error.message,
    })
  }
}

export {
  handleAcceptRoomInvitation,
  handleGetPendingRoomInvitations,
  handleRejectRoomInvitation,
  handleSendRoomInvitation,
}
