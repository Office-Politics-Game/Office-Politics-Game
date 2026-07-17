import pool from "../db/index.js"
import { unlockMatchAchievements } from "./achievementService.js"

const MATCH_COMPLETE_EXP = 100
const MATCH_WIN_BONUS_EXP = 200
const MATCH_COMPLETE_COINS = 500
const MATCH_WIN_BONUS_COINS = 500
const MAX_COIN_BALANCE = 99999

function createServiceError(message, statusCode = 400) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function getNextExp(level) {
  return level * 400 + 200
}

function applyExperience({ level, exp, gainedExp }) {
  let nextLevel = Number(level) || 1
  let nextExp = (Number(exp) || 0) + gainedExp

  while (nextExp >= getNextExp(nextLevel)) {
    nextExp -= getNextExp(nextLevel)
    nextLevel += 1
  }

  return {
    level: nextLevel,
    exp: nextExp,
  }
}

function getMatchPlayers(state) {
  return (state?.players || [])
    .map((player) => ({
      playerId: Number(player.playerId ?? player.id),
      roundWins: Number(player.roundWins || 0),
    }))
    .filter((player) => {
      return Number.isInteger(player.playerId) && player.playerId > 0
    })
}

function getUniquePlayerIds(matchPlayers) {
  return [...new Set(matchPlayers.map((player) => player.playerId))]
}

function getPlayerReward(isWinner) {
  return {
    expGained: MATCH_COMPLETE_EXP + (isWinner ? MATCH_WIN_BONUS_EXP : 0),
    coinsGained: MATCH_COMPLETE_COINS + (isWinner ? MATCH_WIN_BONUS_COINS : 0),
  }
}

async function finalizeMatchProgress({ matchId, state, client: externalClient = null }) {
  if (state?.phase !== "finished") {
    return { finalized: false }
  }

  const numericMatchId = Number(matchId)
  const winnerPlayerId = Number(state.winnerPlayerId)

  if (!Number.isInteger(numericMatchId) || numericMatchId <= 0) {
    throw createServiceError("缺少對戰資料")
  }

  if (!Number.isInteger(winnerPlayerId) || winnerPlayerId <= 0) {
    throw createServiceError("缺少勝利玩家資料")
  }

  const matchPlayers = getMatchPlayers(state)
  const playerIds = getUniquePlayerIds(matchPlayers)

  if (!playerIds.includes(winnerPlayerId)) {
    throw createServiceError("勝利玩家不在本場對局中")
  }

  const roundWinsByPlayerId = new Map(
    matchPlayers.map((player) => [player.playerId, player.roundWins])
  )

  const client = externalClient || await pool.connect()
  const shouldManageTransaction = !externalClient

  try {
    if (shouldManageTransaction) {
      await client.query("BEGIN")
    }

    const matchResult = await client.query(
      `SELECT id, ended_at
       FROM matches
       WHERE id = $1
       FOR UPDATE`,
      [numericMatchId]
    )

    const match = matchResult.rows[0]

    if (!match) {
      throw createServiceError("找不到對戰資料", 404)
    }

    if (match.ended_at) {
      if (shouldManageTransaction) {
        await client.query("COMMIT")
      }

      return { finalized: false }
    }

    const playerResult = await client.query(
      `SELECT id, username, avatar_id, level, exp
       FROM players
       WHERE id = ANY($1::int[])
       FOR UPDATE`,
      [playerIds]
    )

    if (playerResult.rows.length !== playerIds.length) {
      throw createServiceError("對局玩家資料不完整")
    }

    const rewardsByPlayerId = {}

    for (const player of playerResult.rows) {
      const isWinner = player.id === winnerPlayerId
      const { expGained, coinsGained } = getPlayerReward(isWinner)
      const progress = applyExperience({
        level: player.level,
        exp: player.exp,
        gainedExp: expGained,
      })

      rewardsByPlayerId[player.id] = {
        playerId: player.id,
        expGained,
        coinsGained,
        level: progress.level,
        exp: progress.exp,
        result: isWinner ? "win" : "lose",
      }

      await client.query(
        `UPDATE players
         SET win_count = win_count + $1,
             lose_count = lose_count + $2,
             total_games = total_games + 1,
             level = $3,
             exp = $4,
             coins = LEAST(coins + $5, $6),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $7`,
        [
          isWinner ? 1 : 0,
          isWinner ? 0 : 1,
          progress.level,
          progress.exp,
          coinsGained,
          MAX_COIN_BALANCE,
          player.id,
        ],
      )

      await client.query(
        `INSERT INTO match_participants (
           match_id,
           player_id,
           username_snapshot,
           avatar_id_snapshot,
           round_wins,
           result,
           exp_gained,
           coins_gained
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (match_id, player_id)
         DO UPDATE SET
           username_snapshot = EXCLUDED.username_snapshot,
           avatar_id_snapshot = EXCLUDED.avatar_id_snapshot,
           round_wins = EXCLUDED.round_wins,
           result = EXCLUDED.result,
           exp_gained = EXCLUDED.exp_gained,
           coins_gained = EXCLUDED.coins_gained`,
        [
          numericMatchId,
          player.id,
          player.username,
          player.avatar_id,
          roundWinsByPlayerId.get(player.id) || 0,
          isWinner ? "win" : "lose",
          expGained,
          coinsGained,
        ]
      )
    }

    const unlockedAchievementsByPlayerId = await unlockMatchAchievements({
      client,
      matchId: numericMatchId,
      playerIds,
      winnerPlayerId,
    })

    await client.query(
      `UPDATE matches
       SET winner_player_id = $1,
           ended_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [winnerPlayerId, numericMatchId]
    )

    if (shouldManageTransaction) {
      await client.query("COMMIT")
    }

    return {
      finalized: true,
      matchId: numericMatchId,
      winnerPlayerId,
      playerIds,
      rewardsByPlayerId,
      unlockedAchievementsByPlayerId,
    }
  } catch (error) {
    if (shouldManageTransaction) {
      await client.query("ROLLBACK")
    }

    throw error
  } finally {
    if (!externalClient) {
      client.release()
    }
  }
}

export {
  MATCH_COMPLETE_EXP,
  MATCH_WIN_BONUS_EXP,
  MATCH_COMPLETE_COINS,
  MATCH_WIN_BONUS_COINS,
  applyExperience,
  finalizeMatchProgress,
  getNextExp,
  getPlayerReward
}
