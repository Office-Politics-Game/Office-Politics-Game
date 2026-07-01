import pool from "../db/index.js"
import { supabaseAdmin } from "../db/supabaseClient.js"

const DEFAULT_AVATAR_ID = 1
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
        isOnline: row.is_online,
        lastLoginAt: row.last_login_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    }
}

function isValidEmail(email) {
  return EMAIL_REGEX.test(email);
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

async function registerPlayer({ username, account, password, avatarId }) {
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

    if (!password) {
        throw createAuthError(400, "請輸入密碼")
    }

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

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: trimmedAccount,
        password,
        email_confirm: true,
        user_metadata: {
            username: trimmedUsername,
            avatarId: avatarId ?? DEFAULT_AVATAR_ID
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
            RETURNING id, auth_user_id, username, account, avatar_id,
                level, exp, coins, gems, tickets,
                win_count, lose_count, total_games,
                is_online, last_login_at, created_at, updated_at`,
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

export { registerPlayer }