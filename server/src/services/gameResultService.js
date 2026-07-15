import pool from "../db/index.js"

function createServiceError(message, statusCode = 400) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function parseOptionalPlayerId(value) {
  if (value === undefined || value === null || value === "") {
    return null
  }

  const playerId = Number(value)

  if (!Number.isInteger(playerId) || playerId <= 0) {
    throw createServiceError("玩家 ID 有誤")
  }

  return playerId
}

function formatAchievement(row) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    title: row.name,
    description: row.description,
    category: row.category,
    rewardCurrency: row.reward_currency,
    rewardAmount: row.reward_amount ?? 0,
    unlockedAt: row.unlocked_at ?? null,
  }
}

function formatParticipant(row, winnerPlayerId) {
  return {
    id: row.player_id,
    playerId: row.player_id,
    username: row.username_snapshot,
    name: row.username_snapshot,
    avatarId: row.avatar_id_snapshot,
    level: row.level ?? 1,
    roundWins: row.round_wins ?? 0,
    result: row.result,
    expGained: row.exp_gained ?? 0,
    coinsGained: row.coins_gained ?? 0,
    isWinner: row.player_id === winnerPlayerId,
  }
}

async function getRoomGameResult({ roomCode, playerId }) {
  const currentPlayerId = parseOptionalPlayerId(playerId)

  const matchResult = await pool.query(
    `SELECT
       matches.id,
       matches.room_id,
       matches.winner_player_id,
       matches.started_at,
       matches.ended_at,
       game_rooms.room_code
     FROM matches
     INNER JOIN game_rooms
       ON game_rooms.id = matches.room_id
     WHERE game_rooms.room_code = $1
       AND matches.ended_at IS NOT NULL
     ORDER BY matches.ended_at DESC, matches.id DESC
     LIMIT 1`,
    [roomCode]
  )

  const match = matchResult.rows[0]

  if (!match) {
    throw createServiceError("尚未找到結算資料", 404)
  }

  const participantResult = await pool.query(
    `SELECT
       match_participants.player_id,
       match_participants.username_snapshot,
       match_participants.avatar_id_snapshot,
       match_participants.round_wins,
       match_participants.result,
       match_participants.exp_gained,
       match_participants.coins_gained,
       players.level
     FROM match_participants
     LEFT JOIN players
       ON players.id = match_participants.player_id
     WHERE match_participants.match_id = $1
     ORDER BY
       match_participants.round_wins DESC,
       match_participants.result ASC,
       match_participants.id ASC`,
    [match.id]
  )

  const participants = participantResult.rows.map((row) =>
    formatParticipant(row, match.winner_player_id)
  )

  if (
    currentPlayerId &&
    !participants.some((participant) => participant.playerId === currentPlayerId)
  ) {
    throw createServiceError("玩家不在本場對局中", 403)
  }

  const selectedPlayer =
    participants.find((participant) => participant.playerId === currentPlayerId) ||
    participants.find((participant) => participant.playerId === match.winner_player_id) ||
    participants[0] ||
    null

  const achievementResult = selectedPlayer
    ? await pool.query(
        `SELECT
           achievements.id,
           achievements.code,
           achievements.name,
           achievements.description,
           achievements.category,
           achievements.reward_currency,
           achievements.reward_amount,
           player_achievements.unlocked_at
         FROM player_achievements
         INNER JOIN achievements
           ON achievements.id = player_achievements.achievement_id
         WHERE player_achievements.source_match_id = $1
           AND player_achievements.player_id = $2
         ORDER BY player_achievements.unlocked_at ASC, achievements.id ASC`,
        [match.id, selectedPlayer.playerId]
      )
    : { rows: [] }

  const achievements = achievementResult.rows.map(formatAchievement)
  const winner =
    participants.find((participant) => participant.playerId === match.winner_player_id) ||
    null

  return {
    result: {
      matchId: match.id,
      roomId: match.room_id,
      roomCode: match.room_code,
      winnerPlayerId: match.winner_player_id,
      winner,
      currentPlayer: selectedPlayer,
      players: participants,
      participants,
      achievements,
      achievement: achievements[0] ?? null,
      expGained: selectedPlayer?.expGained ?? 0,
      coinsGained: selectedPlayer?.coinsGained ?? 0,
      rewards: {
        exp: selectedPlayer?.expGained ?? 0,
        coins: selectedPlayer?.coinsGained ?? 0,
      },
      startedAt: match.started_at,
      endedAt: match.ended_at,
    },
  }
}

export { getRoomGameResult }