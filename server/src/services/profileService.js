import pool from "../db/index.js"

const VALID_AVATAR_IDS = new Set([1, 2, 3, 4])

const PROFILE_SELECT_SQL = `id, username, avatar_id, bio,
    level, exp, win_count, lose_count, total_games, created_at, updated_at`

function createProfileError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function formatProfile(row) {
  return {
    id: row.id,
    username: row.username,
    avatarId: row.avatar_id,
    bio: row.bio || "",
    level: row.level,
    exp: row.exp,
    winCount: row.win_count,
    loseCount: row.lose_count,
    totalGames: row.total_games,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

async function getProfile(playerId) {
  const result = await pool.query(
    `SELECT ${PROFILE_SELECT_SQL}
      FROM players
      WHERE id = $1
      LIMIT 1`,
    [playerId]
  )

  const player = result.rows[0]

  if (!player) {
    throw createProfileError(404, "找不到玩家資料")
  }

  return formatProfile(player)
}

async function updateProfile(playerId, payload = {}) {
  const updates = []
  const values = []

  if (Object.prototype.hasOwnProperty.call(payload, "username")) {
    const username = String(payload.username || "").trim()

    if (!username) {
      throw createProfileError(400, "請輸入暱稱")
    }

    values.push(username)
    updates.push(`username = $${values.length}`)
  }

  if (Object.prototype.hasOwnProperty.call(payload, "bio")) {
    values.push(String(payload.bio || "").trim())
    updates.push(`bio = $${values.length}`)
  }

  if (Object.prototype.hasOwnProperty.call(payload, "avatarId")) {
    const avatarId = Number(payload.avatarId)

    if (!VALID_AVATAR_IDS.has(avatarId)) {
      throw createProfileError(400, "頭像選項不正確")
    }

    values.push(avatarId)
    updates.push(`avatar_id = $${values.length}`)
  }

  if (updates.length === 0) {
    return getProfile(playerId)
  }

  values.push(playerId)

  try {
    const result = await pool.query(
      `UPDATE players
        SET ${updates.join(", ")},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $${values.length}
        RETURNING ${PROFILE_SELECT_SQL}`,
      values
    )

    const player = result.rows[0]

    if (!player) {
      throw createProfileError(404, "找不到玩家資料")
    }

    return formatProfile(player)
  } catch (error) {
    if (error.code === "23505") {
      throw createProfileError(409, "暱稱已被使用")
    }

    throw error
  }
}


export { formatProfile, getProfile, updateProfile }
