import pool from "../db/index.js"

const VALID_AVATAR_IDS = new Set([1, 2, 3, 4])
const DEFAULT_MATCH_HISTORY_LIMIT = 20
const MAX_MATCH_HISTORY_LIMIT = 40

const PROFILE_SELECT_SQL = `id, username, avatar_id, bio, title,
    level, exp, win_count, lose_count, total_games, created_at, updated_at`

function createProfileError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function parseAchievementCode(code) {
  if (typeof code !== "string" || code.trim() === "") {
    throw createProfileError(400, "Invalid achievement code")
  }

  return code.trim()
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
    title: row.title ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function normalizeMatchHistoryLimit(value) {
  const limit = Number.parseInt(value, 10)

  if (!Number.isInteger(limit) || limit <= 0) {
    return DEFAULT_MATCH_HISTORY_LIMIT
  }

  return Math.min(limit, MAX_MATCH_HISTORY_LIMIT)
}

function normalizeMatchParticipants(participants) {
  if (Array.isArray(participants)) {
    return participants
  }

  if (!participants) {
    return []
  }

  try {
    return JSON.parse(participants)
  } catch {
    return []
  }
}

function formatProfileMatch(row) {
  return {
    id: row.id,
    roomId: row.room_id,
    result: row.result,
    winnerPlayerId: row.winner_player_id,
    winnerUsername: row.winner_username || "暫無記錄",
    startedAt: row.started_at,
    endedAt: row.ended_at,
    xpGained: row.result === "win" ? 300 : 100,
    participants: normalizeMatchParticipants(row.participants).map((participant) => ({
      playerId: participant.playerId,
      username: participant.username,
      avatarId: participant.avatarId,
      roundWins: participant.roundWins,
      result: participant.result,
    })),
  }
}

async function getProfile(playerId) {
  const result = await pool.query(
    `SELECT ${PROFILE_SELECT_SQL}
      FROM players
      WHERE id = $1
      LIMIT 1`,
    [playerId],
  )

  const player = result.rows[0]

  if (!player) {
    throw createProfileError(404, "找不到玩家資料")
  }

  return formatProfile(player)
}

async function setProfileTitle(playerId, achievementCodeValue) {
  const achievementCode = parseAchievementCode(achievementCodeValue)

  const achievementResult = await pool.query(
    `SELECT
       a.name,
       pa.player_id AS unlocked_player_id
     FROM achievements a
     LEFT JOIN player_achievements pa
       ON pa.achievement_id = a.id
      AND pa.player_id = $2
     WHERE a.code = $1
     LIMIT 1`,
    [achievementCode, playerId],
  )

  if (achievementResult.rows.length === 0) {
    throw createProfileError(404, "Achievement not found")
  }

  const achievement = achievementResult.rows[0]

  if (!achievement.unlocked_player_id) {
    throw createProfileError(403, "Achievement has not been unlocked")
  }

  const result = await pool.query(
    `UPDATE players
      SET title = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING ${PROFILE_SELECT_SQL}`,
    [achievement.name, playerId],
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
      values,
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

async function getProfileMatches(playerId, query = {}) {
  const limit = normalizeMatchHistoryLimit(query.limit)

  const result = await pool.query(
    `SELECT
        matches.id,
        matches.room_id,
        matches.winner_player_id,
        matches.started_at,
        matches.ended_at,
        current_participant.result,
        winner_participant.username_snapshot AS winner_username,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'playerId', participant.player_id,
              'username', participant.username_snapshot,
              'avatarId', participant.avatar_id_snapshot,
              'roundWins', participant.round_wins,
              'result', participant.result
            )
            ORDER BY participant.round_wins DESC, participant.id ASC
          ) FILTER (WHERE participant.id IS NOT NULL),
          '[]'
        ) AS participants
      FROM matches
      INNER JOIN match_participants AS current_participant
        ON current_participant.match_id = matches.id
        AND current_participant.player_id = $1
      LEFT JOIN match_participants AS winner_participant
        ON winner_participant.match_id = matches.id
        AND winner_participant.player_id = matches.winner_player_id
      LEFT JOIN match_participants AS participant
        ON participant.match_id = matches.id
      WHERE matches.ended_at IS NOT NULL
      GROUP BY
        matches.id,
        current_participant.result,
        winner_participant.username_snapshot
      ORDER BY matches.ended_at DESC, matches.id DESC
      LIMIT $2`,
    [playerId, limit],
  )

  return result.rows.map(formatProfileMatch)
}

export {
  formatProfile,
  formatProfileMatch,
  getProfile,
  getProfileMatches,
  setProfileTitle,
  updateProfile,
}
