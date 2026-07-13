import pool from "../db/index.js"
import { verifyToken } from "./authService.js"

function createProfileError(message, statusCode = 400) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function parseAchievementCode(code) {
  if (typeof code !== "string" || code.trim() === "") {
    throw createProfileError("Invalid achievement code", 400)
  }

  return code.trim()
}

function formatProfile(player) {
  return {
    id: player.id,
    username: player.username,
    avatarId: player.avatarId,
    level: player.level,
    exp: player.exp,
    coins: player.coins,
    gems: player.gems,
    tickets: player.tickets,
    winCount: player.winCount,
    loseCount: player.loseCount,
    totalGames: player.totalGames,
    title: player.title ?? null,
    createdAt: player.createdAt,
  }
}

async function getCurrentProfile(token) {
  const player = await verifyToken(token)

  return formatProfile(player)
}

async function setProfileTitle(token, achievementCodeValue) {
  const player = await verifyToken(token)
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
    [achievementCode, player.id],
  )

  if (achievementResult.rows.length === 0) {
    throw createProfileError("Achievement not found", 404)
  }

  const achievement = achievementResult.rows[0]

  if (!achievement.unlocked_player_id) {
    throw createProfileError("Achievement has not been unlocked", 403)
  }

  await pool.query(
    `UPDATE players
     SET title = $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [achievement.name, player.id],
  )

  return formatProfile({
    ...player,
    title: achievement.name,
  })
}

export { formatProfile, getCurrentProfile, setProfileTitle }
