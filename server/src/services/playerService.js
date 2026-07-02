import pool from "../db/index.js"

function createServiceError(message, statusCode = 400){
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function mapPlayerSearchResult(row){
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

async function createGuest({ username, avatarId }){
  let result

  try {
    result = await pool.query(
      `INSERT INTO players (username, avatar_id)
       VALUES ($1, $2)
       RETURNING *`,
      [username, avatarId ?? null]
    )
  } catch (error){
    if (error.code === "23505"){
      throw createServiceError("暱稱已被使用，請換一個暱稱", 409)
    }

    throw error
  }

  return result.rows[0]
}

async function searchPlayers({ keyword, viewerPlayerId }){
  const normalizedKeyword = String(keyword ?? "").trim()

  if (!normalizedKeyword){
    throw createServiceError("請輸入玩家暱稱或玩家ID")
  }

  if (!Number.isInteger(viewerPlayerId) || viewerPlayerId <= 0){
    throw createServiceError("缺少玩家ID")
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

export { createGuest, searchPlayers }
