import {
    registerPlayer,
    loginPlayer,
    syncOAuthPlayer,
    logoutPlayer,
    verifyToken,
    requestPasswordReset,
    resetPlayerPassword
} from "../services/authService.js"

const AUTH_COOKIE_NAME = "officePoliticsAuthToken"
const DEFAULT_AUTH_COOKIE_MAX_AGE = 60 * 60 * 1000

function sendAuthError(res, error, fallbackMessage) {
    if (error?.isPublic === true || Number.isInteger(error?.statusCode)) {
        res.status(error.statusCode || 500).json({
            message: error.message || fallbackMessage
        })
        return
    }

    console.error(fallbackMessage, error)

    res.status(500).json({
        message: fallbackMessage
    })
}

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
        sendAuthError(res, error, "註冊失敗，請稍後再試")
    }
}

async function handleLoginPlayer(req, res) {
    try {
        const { player, token, expiresIn } = await loginPlayer(req.body)

        setAuthCookie(res, token, expiresIn)

        res.status(200).json({ player })
    } catch (error) {
        sendAuthError(res, error, "登入失敗，請稍後再試")
    }
}

async function handleOAuthCallback(req, res) {
    try {
        const { player, token, expiresIn } = await syncOAuthPlayer(req.body)

        setAuthCookie(res, token, expiresIn)

        res.status(200).json({ player })
    } catch (error) {
        sendAuthError(res, error, "第三方登入失敗，請稍後再試")
    }
}

async function handleVerifyToken(req, res) {
    try {
        const token = getCookieToken(req)
        const player = await verifyToken(token)

        res.status(200).json({ player })
    } catch (error) {
        sendAuthError(res, error, "登入驗證失敗")
    }
}

async function handleLogoutPlayer(req, res) {
    const token = getCookieToken(req)

    try {
        await logoutPlayer(token)
    } catch {
    }
    
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
        sendAuthError(res, error, "重設密碼信寄送失敗，請稍後再試")
    }
}

async function handleResetPassword(req, res) {
    try {
        const result = await resetPlayerPassword(req.body)

        res.status(200).json(result)
    } catch (error) {
        sendAuthError(res, error, "密碼重設失敗，請稍後再試")
    }
}

export { handleRegisterPlayer, handleLoginPlayer, handleOAuthCallback, handleVerifyToken, handleLogoutPlayer, handleForgotPassword, handleResetPassword }
