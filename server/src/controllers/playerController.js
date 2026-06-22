import { createGuest } from "../services/playerService.js"

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

export { handleCreateGuest }
