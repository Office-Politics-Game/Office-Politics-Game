import pool from "../db/index.js"

function createServiceError(message, statusCode = 400) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function mapPlayerSearchResult(row) {
  return {
    id: row.id,
    username: row.username,
    avatarId: row.avatar_id,
    level: row.level,
    isOnline: row.is_online,
    friendshipId: row.friendship_id,
    relationStatus: row.relation_status,
    createdAt: row.created_at,
  }
}

function mapPlayer(row) {
  return {
    id: row.id,
    username: row.username,
    avatarId: row.avatar_id,
    level: row.level,
    exp: row.exp,
    winCount: row.win_count,
    loseCount: row.lose_count,
    totalGames: row.total_games,
    createdAt: row.created_at,
    isOnline: row.is_online,
  }
}

async function createGuest({ username, avatarId }) {
  let result

  try {
    result = await pool.query(
      `INSERT INTO players (username, avatar_id)
       VALUES ($1, $2)
       RETURNING *`,
      [username, avatarId ?? null]
    )
  } catch (error) {
    if (error.code === "23505") {
      throw createServiceError("Username already exists", 409)
    }

    throw error
  }

  return result.rows[0]
}

async function updatePlayerAvatar({ playerId, avatarId }) {
  const numericPlayerId = Number(playerId)
  const numericAvatarId = Number(avatarId)

  if (!Number.isInteger(numericPlayerId) || numericPlayerId <= 0) {
    throw createServiceError("Invalid player ID")
  }

  if (!Number.isInteger(numericAvatarId) || numericAvatarId < 1 || numericAvatarId > 4) {
    throw createServiceError("Invalid avatar ID")
  }

  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const playerResult = await client.query(
      `UPDATE players
       SET avatar_id = $2
       WHERE id = $1
       RETURNING *`,
      [numericPlayerId, numericAvatarId]
    )

    if (playerResult.rows.length === 0) {
      throw createServiceError("Player not found", 404)
    }

    await client.query(
      `UPDATE player_equipped_items
       SET avatar_item_id = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE player_id = $1`,
      [numericPlayerId]
    )

    await client.query("COMMIT")

    return mapPlayer(playerResult.rows[0])
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

async function searchPlayers({ keyword, viewerPlayerId }) {
  const normalizedKeyword = String(keyword ?? "").trim()

  if (!normalizedKeyword) {
    throw createServiceError("Keyword is required")
  }

  if (!Number.isInteger(viewerPlayerId) || viewerPlayerId <= 0) {
    throw createServiceError("Invalid player ID")
  }

  const numericKeyword = Number(normalizedKeyword)
  const isNumericKeyword =
    Number.isInteger(numericKeyword) && numericKeyword > 0
  const keywordPattern = `%${normalizedKeyword}%`
  const params = isNumericKeyword
    ? [viewerPlayerId, numericKeyword, keywordPattern]
    : [viewerPlayerId, keywordPattern]
  const searchCondition = isNumericKeyword
    ? "(p.id = $2 OR p.username ILIKE $3)"
    : "p.username ILIKE $2"

  const result = await pool.query(
    `SELECT
       p.id,
       p.username,
       p.avatar_id,
       p.level,
       p.is_online,
       p.created_at,
       f.id AS friendship_id,
       f.status AS relation_status
     FROM players p
     LEFT JOIN friends f
       ON LEAST(f.player_id, f.friend_id) = LEAST($1::integer, p.id)
      AND GREATEST(f.player_id, f.friend_id) = GREATEST($1::integer, p.id)
     WHERE p.id <> $1
       AND ${searchCondition}
     ORDER BY
       CASE WHEN ${isNumericKeyword ? "p.id = $2" : "false"} THEN 0 ELSE 1 END,
       p.is_online DESC,
       p.username ASC
     LIMIT 10`,
    params
  )

  return result.rows.map(mapPlayerSearchResult)
}

export { createGuest, searchPlayers, updatePlayerAvatar }
