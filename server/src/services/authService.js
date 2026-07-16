import pool from "../db/index.js"
import { supabaseAdmin, supabaseAuth } from "../db/supabaseClient.js"

const DEFAULT_AVATAR_ID = 1
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_RULE_ERROR_MESSAGE = "密碼格式不符合規則"
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=[\]{};':"|,.<>/?`~])[A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"|,.<>/?`~]{8,16}$/
const PLAYER_SELECT_SQL = `id, auth_user_id, username, account, avatar_id,
    level, exp, coins, gems, tickets,
    win_count, lose_count, total_games, title,
    is_online, last_login_at, created_at, updated_at`

function createAuthError(statusCode, message) {
    const error = new Error(message)
    error.statusCode = statusCode;
    return error;
}

function formatPlayer(row) {
    return {
        id: row.id,
        authUserId: row.auth_user_id,
        username: row.username,
        account: row.account,
        avatarId: row.avatar_id,
        level: row.level,
        exp: row.exp,
        coins: row.coins,
        gems: row.gems,
        tickets: row.tickets,
        winCount: row.win_count,
        loseCount: row.lose_count,
        totalGames: row.total_games,
        title: row.title ?? null,
        isOnline: row.is_online,
        lastLoginAt: row.last_login_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    }
}

function isValidEmail(email) {
  return EMAIL_REGEX.test(email);
}

function isValidPassword(password) {
    return PASSWORD_REGEX.test(password)
}

function validatePassword(password) {
    if (!password) {
        throw createAuthError(400, "請輸入密碼")
    }

    if (!isValidPassword(password)) {
        throw createAuthError(400, PASSWORD_RULE_ERROR_MESSAGE)
    }
}

function getPasswordResetRedirectUrl() {
    if (process.env.PASSWORD_RESET_REDIRECT_URL) {
        return process.env.PASSWORD_RESET_REDIRECT_URL
    }

    const clientOrigin =
        process.env.CLIENT_ORIGIN ||
        process.env.FRONTEND_URL ||
        "http://localhost:5173"

    return `${clientOrigin.replace(/\/$/, "")}/?auth=reset-password`
}

function getEmailConfirmRedirectUrl() {
    if (process.env.EMAIL_CONFIRM_REDIRECT_URL) {
        return process.env.EMAIL_CONFIRM_REDIRECT_URL
    }

    const clientOrigin =
        process.env.CLIENT_ORIGIN ||
        process.env.FRONTEND_URL ||
        "http://localhost:5173"

    return `${clientOrigin.replace(/\/$/, "")}/?auth=login&notice=email-verified`
}

function isEmailNotConfirmedError(error) {
    return (
        error?.code === "email_not_confirmed" ||
        error?.message?.toLowerCase().includes("email not confirmed")
    )
}

async function deleteSupabaseUserQuietly(authUserId) {
    try {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(authUserId)

        if (error) {
            console.error("刪除Supabase使用者失敗", error)
        }
    } catch (error) {
        console.error("刪除Supabase使用者失敗", error)
    }
}

async function registerPlayer({ username, account, password, avatarId } = {}) {
    const trimmedUsername = username?.trim()
    const trimmedAccount = account?.trim().toLowerCase()

    if (!trimmedUsername) {
        throw createAuthError(400, "請輸入用戶名稱")
    }

    if (!trimmedAccount) {
        throw createAuthError(400, "請輸入Email帳號")
    }

    if (!isValidEmail(trimmedAccount)) {
        throw createAuthError(400, "Email格式不正確");
    }

    validatePassword(password)

    const duplicateResult = await pool.query(
        `SELECT username, account
         FROM players
         WHERE username = $1 OR account = $2
         LIMIT 1`,
        [trimmedUsername, trimmedAccount]
    )

    const duplicatePlayer = duplicateResult.rows[0]

    if (duplicatePlayer?.username === trimmedUsername) {
        throw createAuthError(409, "用戶名稱已被使用")
    }

    if (duplicatePlayer?.account === trimmedAccount) {
        throw createAuthError(409, "Email帳號已被使用")
    }

    const { data, error } = await supabaseAuth.auth.signUp({
        email: trimmedAccount,
        password,
        options: {
            emailRedirectTo: getEmailConfirmRedirectUrl(),
            data: {
                username: trimmedUsername,
                avatarId: avatarId ?? DEFAULT_AVATAR_ID
            }
        }
    })

    if (error) {
        throw createAuthError(400, error.message || "會員建立失敗")
    }

    const authUserId = data.user?.id

    if (!authUserId) {
        throw createAuthError(500, "會員建立失敗")
    }

    try {
        const result = await pool.query(
            `INSERT INTO players (auth_user_id, username, account, avatar_id)
            VALUES ($1, $2, $3, $4)
            RETURNING ${PLAYER_SELECT_SQL}`,
            [
                authUserId,
                trimmedUsername,
                trimmedAccount,
                avatarId ?? DEFAULT_AVATAR_ID,
            ]
        )

        return formatPlayer(result.rows[0])
    } catch (error) {
        await deleteSupabaseUserQuietly(authUserId)
        throw error
    }
}

async function loginPlayer({ account, password } = {}) {
    const trimmedAccount = account?.trim().toLowerCase()

    if (!trimmedAccount) {
        throw createAuthError(400, "請輸入Email帳號")
    }

    if (!isValidEmail(trimmedAccount)) {
        throw createAuthError(400, "Email格式不正確")
    }

    if (!password) {
        throw createAuthError(400, "請輸入密碼")
    }

    const playerResult = await pool.query(
        `SELECT ${PLAYER_SELECT_SQL}
         FROM players
         WHERE account = $1
         LIMIT 1`,
        [trimmedAccount]
    )

    const player = playerResult.rows[0]

    if (!player) {
        throw createAuthError(404, "帳號不存在")
    }

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email: trimmedAccount,
        password
    })

    if (error) {
        if (isEmailNotConfirmedError(error)) {
            throw createAuthError(403, "請先完成信箱驗證後再登入")
        }

        throw createAuthError(401, "密碼錯誤")
    }

    const authUserId = data.user?.id
    const token = data.session?.access_token
    const expiresIn = data.session?.expires_in

    if (!authUserId || !token) {
        throw createAuthError(500, "登入失敗")
    }

    if (player.auth_user_id !== authUserId) {
        throw createAuthError(401, "登入資料不一致")
    }

    const updatedPlayerResult = await pool.query(
        `UPDATE players
         SET is_online = true,
             last_login_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE auth_user_id = $1
         RETURNING ${PLAYER_SELECT_SQL}`,
        [authUserId]
    )

    return {
        player: formatPlayer(updatedPlayerResult.rows[0]),
        token,
        expiresIn
    }
}

function getOAuthDisplayName(user, email) {
    const metadata = user.user_metadata || {}
    const name =
        metadata.full_name ||
        metadata.name ||
        metadata.display_name ||
        metadata.user_name ||
        email.split("@")[0]

    return String(name).trim() || email.split("@")[0]
}

function createOAuthUsername(user, email) {
    const displayName = getOAuthDisplayName(user, email)
        .replace(/\s+/g, "")
        .slice(0, 16)
    const suffix = user.id.replace(/-/g, "").slice(0, 8)

    return `${displayName}-${suffix}`
}

async function syncOAuthPlayer({ accessToken, expiresIn } = {}) {
    if (!accessToken) {
        throw createAuthError(401, "缺少第三方登入憑證")
    }

    const { data, error } = await supabaseAdmin.auth.getUser(accessToken)

    if (error || !data?.user?.id) {
        throw createAuthError(401, "第三方登入驗證失敗")
    }

    const authUser = data.user
    const email = authUser.email?.trim().toLowerCase()

    if (!email || !isValidEmail(email)) {
        throw createAuthError(400, "第三方登入未提供Email，請改用其他登入方式")
    }

    const existingResult = await pool.query(
        `SELECT ${PLAYER_SELECT_SQL}
         FROM players
         WHERE account = $1 OR auth_user_id = $2
         ORDER BY CASE WHEN account = $1 THEN 0 ELSE 1 END
         LIMIT 1`,
        [email, authUser.id]
    )

    const existingPlayer = existingResult.rows[0]

    if (existingPlayer) {
        const updatedResult = await pool.query(
            `UPDATE players
             SET auth_user_id = COALESCE(auth_user_id, $1),
                 account = $2,
                 is_online = true,
                 last_login_at = CURRENT_TIMESTAMP,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING ${PLAYER_SELECT_SQL}`,
            [authUser.id, email, existingPlayer.id]
        )

        return {
            player: formatPlayer(updatedResult.rows[0]),
            token: accessToken,
            expiresIn
        }
    }

    const createdResult = await pool.query(
        `INSERT INTO players (auth_user_id, username, account, avatar_id, is_online, last_login_at)
         VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP)
         RETURNING ${PLAYER_SELECT_SQL}`,
        [
            authUser.id,
            createOAuthUsername(authUser, email),
            email,
            DEFAULT_AVATAR_ID
        ]
    )

    return {
        player: formatPlayer(createdResult.rows[0]),
        token: accessToken,
        expiresIn
    }
}

async function requestPasswordReset({ account } = {}) {
    const trimmedAccount = account?.trim().toLowerCase()

    if (!trimmedAccount) {
        throw createAuthError(400, "請輸入Email帳號")
    }

    if (!isValidEmail(trimmedAccount)) {
        throw createAuthError(400, "Email格式不正確")
    }

    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(
        trimmedAccount,
        {
            redirectTo: getPasswordResetRedirectUrl()
        }
    )

    if (error) {
        throw createAuthError(400, "重設密碼信寄送失敗，請稍後再試")
    }

    return {
        message: "重設密碼信已透過電子郵件傳送至您的信箱"
    }
}

async function resetPlayerPassword({ token, password } = {}) {
    if (!token) {
        throw createAuthError(401, "重設密碼連結已失效，請重新申請")
    }

    validatePassword(password)

    const { data, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !data?.user?.id) {
        throw createAuthError(401, "重設密碼連結已失效，請重新申請")
    }

    const { error: updateError } =
        await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
            password
        })

    if (updateError) {
        throw createAuthError(400, "密碼重設失敗，請稍後再試")
    }

    return {
        message: "密碼已更新，請重新登入"
    }
}

async function logoutPlayer(token) {
    if (!token) {
        return false
    }

    try {
        const { data, error } = await supabaseAdmin.auth.getUser(token)

        if (error || !data?.user?.id) {
            return false
        }

        const email = data.user.email?.trim().toLowerCase() || ""

        await pool.query(
            `UPDATE players
             SET is_online = false,
                 updated_at = CURRENT_TIMESTAMP
             WHERE auth_user_id = $1 OR account = $2`,
            [data.user.id, email]
        )

        return true
    } catch {
        return false
    }
}

async function verifyToken(token) {
    if (!token) {
        throw createAuthError(401, "缺少登入驗證token")
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !data?.user?.id) {
        throw createAuthError(401, "登入驗證失敗")
    }

    const email = data.user.email?.trim().toLowerCase() || ""

    const playerResult = await pool.query(
        `SELECT ${PLAYER_SELECT_SQL}
         FROM players
         WHERE auth_user_id = $1 OR account = $2
         ORDER BY CASE WHEN auth_user_id = $1 THEN 0 ELSE 1 END
         LIMIT 1`,
        [data.user.id, email]
    )

    const player = playerResult.rows[0]

    if (!player) {
        throw createAuthError(404, "找不到玩家資料")
    }

    return formatPlayer(player)
}

export { registerPlayer, loginPlayer, syncOAuthPlayer, logoutPlayer, verifyToken, requestPasswordReset, resetPlayerPassword }
