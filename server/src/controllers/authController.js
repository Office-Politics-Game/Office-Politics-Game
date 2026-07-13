import { registerPlayer, loginPlayer, verifyToken, requestPasswordReset, resetPlayerPassword } from "../services/authService.js"

function getBearerToken(req) {
    const authorization = req.headers.authorization || ""

    if (!authorization.startsWith("Bearer ")) {
        return ""
    }

    return authorization.replace("Bearer ", "").trim()
}

async function handleRegisterPlayer(req, res) {
    try {
        const player = await registerPlayer(req.body)

        res.status(201).json({
            player,
            message: "註冊成功，請至信箱完成驗證後再登入"
        })
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

async function handleVerifyToken(req, res) {
    try {
        const token = getBearerToken(req)
        const player = await verifyToken(token)

        res.status(200).json({ player })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message || "登入驗證失敗"
        })
    }
}

async function handleForgotPassword(req, res) {
    try {
        const result = await requestPasswordReset(req.body)

        res.status(200).json(result)
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message || "重設密碼信寄送失敗"
        })
    }
}

async function handleResetPassword(req, res) {
    try {
        const result = await resetPlayerPassword(req.body)

        res.status(200).json(result)
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message || "密碼重設失敗"
        })
    }
}

export { handleRegisterPlayer, handleLoginPlayer, handleVerifyToken, handleForgotPassword, handleResetPassword }