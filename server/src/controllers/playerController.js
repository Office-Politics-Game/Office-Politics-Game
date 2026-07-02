import { createGuest, searchPlayers } from "../services/playerService.js"

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

async function handleCreateGuest(req, res){
  try {
    const { username, avatarId } = req.body

    if (!username){
      return res.status(400).json({ message: "請輸入用戶名稱" })
    }

    const player = await createGuest({ username, avatarId })

    res.status(201).json({ player })
  } catch (error){
    res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "建立玩家失敗",
      error: error.message,
    })
  }
}

async function handleSearchPlayers(req, res){
  try {
    const keyword = req.query.keyword
    const viewerPlayerId = parsePositiveInteger(req.query.playerId)

    if (!viewerPlayerId){
      return res.status(400).json({ message: "缺少玩家ID" })
    }

    const players = await searchPlayers({ keyword, viewerPlayerId })

    return res.status(200).json({ players })
  } catch (error){
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "搜尋玩家失敗",
      error: error.message,
    })
  }
}

export { handleCreateGuest, handleSearchPlayers }
