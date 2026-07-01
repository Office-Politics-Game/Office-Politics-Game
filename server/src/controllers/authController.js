import { registerPlayer } from "../services/authService.js"

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

export { handleRegisterPlayer }