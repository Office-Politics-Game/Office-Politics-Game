import bcrypt from "bcryptjs"
import pool from "../db/index.js"

const DEFAULT_AVATAR_ID = 1

function createAuthError(statusCode, message) {
    const error = new Error(message)
    error.statusCode = statusCode;
    return error;
}

function formatPlayer(row) {
    return {
        id: row.id,
        username: row.username,
        account: row.account,
        avatarId: row.avatar_id,
        createdAt: row.created_at
    }
}

async function registerPlayer({ username, account, password, avatarId }) {
    const trimmedUsername = username?.trim()
    const trimmedAccount = account?.trim()

    if (!trimmedUsername) {
        throw createAuthError(400, "請輸入用戶名稱")
    }

    if (!trimmedAccount) {
        throw createAuthError(400, "請輸入帳號")
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
        throw createAuthError(409, "帳號已被使用")
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const result = await pool.query(
        `INSERT INTO players (username, account, password_hash, avatar_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, username, account, avatar_id, created_at`,
        [
            trimmedUsername,
            trimmedAccount,
            passwordHash,
            avatarId ?? DEFAULT_AVATAR_ID,
        ]
    )

    return formatPlayer(result.rows[0])
}

export { registerPlayer }