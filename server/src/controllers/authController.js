import {
    registerPlayer,
    loginPlayer,
    syncOAuthPlayer,
    verifyToken,
    requestPasswordReset,
    resetPlayerPassword
} from "../services/authService.js"

const AUTH_COOKIE_NAME = "officePoliticsAuthToken"
const DEFAULT_AUTH_COOKIE_MAX_AGE = 60 * 60 * 1000

function getBooleanEnv(value, fallback = false) {
    if (value === "true") return true
    if (value === "false") return false
    return fallback
}

function getAuthCookieOptions(maxAge = DEFAULT_AUTH_COOKIE_MAX_AGE) {
    const sameSite = process.env.AUTH_COOKIE_SAME_SITE || "lax"
    const secure = getBooleanEnv(process.env.AUTH_COOKIE_SECURE, sameSite === "none")

    return {
        httpOnly: true,
        secure,
        sameSite,
        path: "/",
        maxAge
    }
}

function getCookieToken(req) {
    return req.cookies?.[AUTH_COOKIE_NAME] || ""
}

function setAuthCookie(res, token, expiresIn) {
    const maxAge = Number.isFinite(Number(expiresIn))
        ? Number(expiresIn) * 1000
        : DEFAULT_AUTH_COOKIE_MAX_AGE

    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions(maxAge))
}

function clearAuthCookie(res) {
    const { maxAge, ...cookieOptions } = getAuthCookieOptions()
    res.clearCookie(AUTH_COOKIE_NAME, cookieOptions)
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
        const { player, token, expiresIn } = await loginPlayer(req.body)

        setAuthCookie(res, token, expiresIn)

        res.status(200).json({ player })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message || "登入失敗"
        })
    }
}

async function handleOAuthCallback(req, res) {
    try {
        const { player, token, expiresIn } = await syncOAuthPlayer(req.body)

        setAuthCookie(res, token, expiresIn)

        res.status(200).json({ player })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message || "第三方登入失敗"
        })
    }
}

async function handleVerifyToken(req, res) {
    try {
        const token = getCookieToken(req)
        const player = await verifyToken(token)

        res.status(200).json({ player })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message || "登入驗證失敗"
        })
    }
}

async function handleLogoutPlayer(req, res) {
    clearAuthCookie(res)

    res.status(200).json({
        message: "登出成功"
    })
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

export { handleRegisterPlayer, handleLoginPlayer, handleOAuthCallback, handleVerifyToken, handleLogoutPlayer, handleForgotPassword, handleResetPassword }
