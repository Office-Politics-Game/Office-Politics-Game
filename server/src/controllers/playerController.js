import { createGuest } from "../services/playerService.js"
import { getPlayerCurrency } from "../services/currencyService.js"

async function handleCreateGuest(req, res){
  try {
    const { username, avatarId } = req.body

    if (!username){
      return res.status(400).json({ message: "請輸入用戶名稱" })
    }

    const player = await createGuest({ username, avatarId })

    res.status(201).json({ player })
  } catch (error){
    res.status(500).json({
      message: "建立玩家失敗",
      error: error.message,
    })
  }
}

async function handleGetPlayerCurrency(req, res) {
  try {
    const { playerId } = req.params

    const currency = await getPlayerCurrency(Number(playerId))

    return res.status(200).json({ currency })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : "取得玩家遊戲幣失敗",
      error: error.message,
    })
  }
}

export { handleCreateGuest, handleGetPlayerCurrency }
