import {
  createRoom,
  joinRoom,
  addComputerPlayer,
  updateReady,
  getRoomState,
  kickPlayer,
  startGame,
} from "../services/roomService.js"
import { getSocketServer } from "../socket/index.js"
import { getRoomGameResult } from "../services/gameResultService.js"

function getErrorStatus(error) {
  return error.statusCode || 500
}

async function handleCreateRoom(req, res) {
  try {
    const { hostPlayerId } = req.body

    if (!hostPlayerId) {
      return res.status(400).json({ message: "缺少房主玩家 ID" })
    }

    const result = await createRoom({ hostPlayerId })

    return res.status(201).json(result)
  } catch (error) {
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "建立房間失敗",
      error: error.message,
    })
  }
}

async function handleJoinRoom(req, res) {
  try {
    const { roomCode } = req.params
    const { playerId } = req.body

    if (!playerId) {
      return res.status(400).json({ message: "缺少玩家 ID" })
    }

    await joinRoom({ roomCode, playerId })

    const roomState = await getRoomState({ roomCode })
    getSocketServer()
      ?.emit("room:state", roomState)

    return res.status(201).json({ message: "加入房間成功" })
  } catch (error) {
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "加入房間失敗",
      error: error.message,
    })
  }
}

async function handleAddComputerPlayer(req, res) {
  try {
    const { roomCode } = req.params
    const { hostPlayerId, username } = req.body

    if (!hostPlayerId) {
      return res.status(400).json({ message: "缺少房主玩家 ID" })
    }

    const roomState = await addComputerPlayer({ roomCode, hostPlayerId, username })

    return res.status(201).json(roomState)
  } catch (error) {
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "加入電腦玩家失敗",
      error: error.message,
    })
  }
}

async function handleUpdateReady(req, res) {
  try {
    const { roomCode } = req.params
    const { playerId, isReady } = req.body

    if (!playerId || typeof isReady !== "boolean") {
      return res.status(400).json({ message: "缺少玩家 ID 或準備狀態" })
    }

    await updateReady({ roomCode, playerId, isReady })

    return res.status(200).json({ message: "玩家準備狀態已更新" })
  } catch (error) {
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "更新玩家準備狀態失敗",
      error: error.message,
    })
  }
}

async function handleGetRoomState(req, res) {
  try {
    const { roomCode } = req.params
    const roomState = await getRoomState({ roomCode })

    return res.status(200).json(roomState)
  } catch (error) {
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "取得房間狀態失敗",
      error: error.message,
    })
  }
}

async function handleKickPlayer(req, res) {
  try {
    const { roomCode, targetPlayerId } = req.params
    const { requesterPlayerId } = req.body
    const numericRequesterPlayerId = Number(requesterPlayerId)
    const numericTargetPlayerId = Number(targetPlayerId)

    if (
      !Number.isInteger(numericRequesterPlayerId) ||
      numericRequesterPlayerId <= 0 ||
      !Number.isInteger(numericTargetPlayerId) ||
      numericTargetPlayerId <= 0
    ) {
      return res.status(400).json({ message: "缺少或無效的玩家ID" })
    }

    const roomState = await kickPlayer({
      roomCode,
      requesterPlayerId: numericRequesterPlayerId,
      targetPlayerId: numericTargetPlayerId,
    })

    getSocketServer()
      ?.emit("room:state", roomState)

    return res.status(200).json({
      message: "玩家已移出房間",
      roomState,
    })
  } catch (error) {
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "移出玩家失敗",
      error: error.message,
    })
  }
}

async function handleStartGame(req, res) {
  try {
    const { roomCode } = req.params
    const { playerId } = req.body

    if (!playerId) {
      return res.status(400).json({ message: "缺少玩家 ID" })
    }

    await startGame({ roomCode, playerId })

    return res.status(201).json({ message: "開始遊戲成功" })
  } catch (error) {
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "開始遊戲失敗",
      error: error.message,
    })
  }
}

async function handleGetGameResult(req, res) {
  try {
    const { roomCode } = req.params
    const { playerId } = req.query

    const result = await getRoomGameResult({ roomCode, playerId })

    return res.status(200).json(result)
  } catch (error) {
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "取得結算資料失敗",
      error: error.message,
    })
  }
}

export {
  handleCreateRoom,
  handleJoinRoom,
  handleAddComputerPlayer,
  handleUpdateReady,
  handleGetRoomState,
  handleKickPlayer,
  handleStartGame,
  handleGetGameResult,
}
