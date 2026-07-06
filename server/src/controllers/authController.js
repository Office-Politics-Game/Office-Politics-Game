import { registerPlayer, loginPlayer } from "../services/authService.js"

async function handleRegisterPlayer(req, res) {
    try {
        const player = await registerPlayer(req.body)

        res.status(201).json({ player })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message || "註冊失敗"
        })
    }
}

async function handleLoginPlayer(req, res) {
    try {
        const { player, token } = await loginPlayer(req.body)

        res.status(200).json({
            player,
            token
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message || "登入失敗"
        })
    }
}

async function handleGetCurrentPlayer(req, res) {
    try {
        res.status(200).json({ player: req.player })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message || "登入驗證失敗"
        })
    }
}

export { handleRegisterPlayer, handleLoginPlayer, handleGetCurrentPlayer }
