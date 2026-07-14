import { createGuest, searchPlayers, updatePlayerAvatar } from "../services/playerService.js"
import { getPlayerCurrency } from "../services/currencyService.js"

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

async function handleCreateGuest(req, res) {
  try {
    const { username, avatarId } = req.body

    if (!username) {
      return res.status(400).json({ message: "請輸入使用者名稱" })
    }

    const player = await createGuest({ username, avatarId })

    return res.status(201).json({ player })
  } catch (error) {
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "建立玩家失敗",
      error: error.message,
    })
  }
}

async function handleSearchPlayers(req, res) {
  try {
    const keyword = req.query.keyword
    const viewerPlayerId = parsePositiveInteger(req.query.playerId)

    if (!viewerPlayerId) {
      return res.status(400).json({ message: "缺少玩家ID" })
    }

    const players = await searchPlayers({ keyword, viewerPlayerId })

    return res.status(200).json({ players })
  } catch (error) {
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "搜尋玩家失敗",
      error: error.message,
    })
  }
}

async function handleGetPlayerCurrency(req, res) {
  try {
    const playerId = parsePositiveInteger(req.params.playerId)

    if (!playerId) {
      return res.status(400).json({ message: "缺少玩家ID" })
    }

    const currency = await getPlayerCurrency(playerId)

    return res.status(200).json({ currency })
  } catch (error) {
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "取得玩家遊戲幣失敗",
      error: error.message,
    })
  }
}

async function handleUpdatePlayerAvatar(req, res) {
  try {
    const playerId = parsePositiveInteger(req.params.playerId)
    const avatarId = parsePositiveInteger(req.body?.avatarId)

    if (!playerId) {
      return res.status(400).json({ message: "缺少或無效的玩家ID" })
    }

    if (!avatarId) {
      return res.status(400).json({ message: "缺少或無效的頭像ID" })
    }

    const player = await updatePlayerAvatar({ playerId, avatarId })

    return res.status(200).json({ player })
  } catch (error) {
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "更新玩家頭像失敗",
      error: error.message,
    })
  }
}

export {
  handleCreateGuest,
  handleSearchPlayers,
  handleGetPlayerCurrency,
  handleUpdatePlayerAvatar,
}
