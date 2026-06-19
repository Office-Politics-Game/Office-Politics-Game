import { getState } from "../services/gameStateService.js"

async function handleGetState(req, res){
  try {
    const { roomCode } = req.params
    const viewerPlayerId = Number(req.query.playerId)

    if (!viewerPlayerId){
      return res.status(400).json({ message: "缺少玩家ID" })
    }

    const gameSessionState = await getState({
      roomCode,
      viewerPlayerId,
    })

    res.status(200).json(gameSessionState)
  } catch (error){
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : "取得遊戲狀態失敗",
      error: error.message,
    })
  }
}

export { handleGetState }
