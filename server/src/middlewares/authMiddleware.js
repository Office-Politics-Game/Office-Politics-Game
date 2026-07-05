import { verifyToken } from "../services/authService.js"

function getBearerToken(req) {
    const authorization = req.headers.authorization || ""

    if (!authorization.startsWith("Bearer ")) {
        return ""
    }

    return authorization.replace("Bearer ", "").trim()
}

async function requireAuth(req, res, next) {
    try {
        const token = getBearerToken(req)
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