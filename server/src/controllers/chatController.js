import {
  getDirectMessages,
  sendDirectMessage,
} from "../services/chatService.js"
import { getChatPlayerRoom, getSocketServer } from "../socket/index.js"

function getErrorStatus(error) {
  return error.statusCode || 500
}

function parsePositiveInteger(value) {
  const numberValue = Number(value)

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return null
  }

  return numberValue
}

function emitDirectMessage(directMessage) {
  try {
    const io = getSocketServer()

    if (!io) {
      return
    }

    io.to(getChatPlayerRoom(directMessage.receiverPlayerId)).emit(
      "chat:message",
      directMessage,
    )
  } catch (error) {
    console.error("好友私訊即時推播失敗", error)
  }
}

async function handleSendDirectMessage(req, res) {
  try {
    const body = req.body ?? {}
    const playerId = parsePositiveInteger(req.player?.id)
    const friendId = parsePositiveInteger(req.params.friendId)

    if (!playerId || !friendId || body.content == null) {
      return res.status(400).json({ message: "缺少玩家ID或訊息內容" })
    }

    const directMessage = await sendDirectMessage({
      playerId,
      friendId,
      content: body.content,
    })

    emitDirectMessage(directMessage)

    return res.status(201).json({
      message: "訊息已送出",
      directMessage,
    })
  } catch (error) {
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "傳送訊息失敗",
      error: error.message,
    })
  }
}

async function handleGetDirectMessages(req, res) {
  try {
    const playerId = parsePositiveInteger(req.player?.id)
    const friendId = parsePositiveInteger(req.params.friendId)

    if (!playerId || !friendId) {
      return res.status(400).json({ message: "缺少玩家ID或聊天對象ID" })
    }

    const messages = await getDirectMessages({
      playerId,
      friendId,
    })

    return res.status(200).json({ messages })
  } catch (error) {
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "取得聊天紀錄失敗",
      error: error.message,
    })
  }
}

export {
  handleGetDirectMessages,
  handleSendDirectMessage,
}
