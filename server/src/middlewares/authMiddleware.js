import { verifyToken } from "../services/authService.js"
import { AUTH_COOKIE_NAME } from "../constants/auth.js"

function getCookieToken(req) {
    return req.cookies?.[AUTH_COOKIE_NAME] || ""
}

async function requireAuth(req, res, next) {
    try {
        const token = getCookieToken(req)
        const player = await verifyToken(token)

        req.player = player
        next()
    } catch (error) {
        res.status(error.statusCode || 401).json({
            message: error.message || "請先登入"
        })
    }
}

export { requireAuth }
