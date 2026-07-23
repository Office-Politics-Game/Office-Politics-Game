import crypto from "node:crypto"
import pool from "../db/index.js"

const VALID_DRAW_COUNTS = new Set([1, 10])
const DUPLICATE_COMPENSATION_COINS = 100

function createServiceError(message, statusCode = 400) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function parseDrawCount(count) {
  const numericCount = Number(count)

  if (!VALID_DRAW_COUNTS.has(numericCount)) {
    throw createServiceError("抽卡次數只能是 1 或 10")
  }

  return numericCount
}

function pickWeightedCard(poolCards) {
  const totalWeight = poolCards.reduce((sum, card) => sum + Number(card.weight), 0)
  let roll = Math.random() * totalWeight

  for (const card of poolCards) {
    roll -= Number(card.weight)

    if (roll < 0) {
      return card
    }
  }

  return poolCards.at(-1)
}

function mapDrawCard(card) {
  return {
    id: card.gacha_card_id,
    name: card.name,
    rank: card.rank,
    type: card.type,
    description: card.description,
    imageKey: card.image_key,
    frameKey: card.frame_key,
    imageUrl: card.image_url,
    frameUrl: card.frame_url,
  }
}

async function getOwnedGachaCards({ playerId, poolId = "role_cards" }) {
  const numericPlayerId = Number(playerId)

  if (!Number.isInteger(numericPlayerId) || numericPlayerId <= 0) {
    throw createServiceError("玩家資料不正確")
  }

  if (typeof poolId !== "string" || poolId.trim() === "") {
    throw createServiceError("抽卡池資料不正確")
  }

  const result = await pool.query(
    `SELECT gc.id AS gacha_card_id, gc.name, gc.rank, gc.type, gc.description,
            gc.image_key, gc.frame_key, gc.image_url, gc.frame_url,
            MIN(gdl.created_at) AS created_at
     FROM gacha_draw_logs gdl
     JOIN gacha_cards gc ON gc.id = gdl.gacha_card_id
     JOIN gacha_pools gp ON gp.id = gdl.pool_id
     JOIN gacha_pool_cards gpc ON gpc.pool_id = gp.id
      AND gpc.gacha_card_id = gc.id
     WHERE gdl.player_id = $1
       AND gp.code = $2
       AND gp.is_active = true
       AND gpc.is_active = true
       AND gc.is_active = true
     GROUP BY gc.id, gc.name, gc.rank, gc.type, gc.description,
              gc.image_key, gc.frame_key, gc.image_url, gc.frame_url
     ORDER BY gc.rank ASC`,
    [numericPlayerId, poolId]
  )

  return {
    playerId: numericPlayerId,
    poolId,
    cards: result.rows.map(mapDrawCard),
  }
}

async function drawGacha({ playerId, count = 1, poolId = "role_cards" }) {
  const numericPlayerId = Number(playerId)
  const drawCount = parseDrawCount(count)
  const batchId = crypto.randomUUID()
  const client = await pool.connect()

  if (!Number.isInteger(numericPlayerId) || numericPlayerId <= 0) {
    throw createServiceError("玩家ID不正確")
  }

  try {
    await client.query("BEGIN")

    const playerResult = await client.query(
      `SELECT id, coins, gems, tickets
       FROM players
       WHERE id = $1
       FOR UPDATE`,
      [numericPlayerId]
    )

    if (playerResult.rows.length === 0) {
      throw createServiceError("找不到玩家", 404)
    }

    const player = playerResult.rows[0]

    if (player.tickets < drawCount) {
      throw createServiceError("抽卡券不足")
    }

    const poolResult = await client.query(
      `SELECT gp.id AS pool_id,
              gpc.weight,
              gc.id AS gacha_card_id,
              gc.name,
              gc.rank,
              gc.type,
              gc.description,
              gc.image_key,
              gc.frame_key,
              gc.image_url,
              gc.frame_url
       FROM gacha_pools gp
       JOIN gacha_pool_cards gpc ON gpc.pool_id = gp.id
       JOIN gacha_cards gc ON gc.id = gpc.gacha_card_id
       WHERE gp.code = $1
         AND gp.is_active = true
         AND gpc.is_active = true
         AND gc.is_active = true
       ORDER BY gc.rank ASC`,
      [poolId]
    )

    if (poolResult.rows.length === 0) {
      throw createServiceError("卡池不存在或沒有可抽卡片", 404)
    }

    const updatedPlayerResult = await client.query(
      `UPDATE players
       SET tickets = tickets - $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, coins, gems, tickets`,
      [drawCount, numericPlayerId]
    )

    await client.query(
      `INSERT INTO player_currency_logs
       (player_id, currency, amount, balance_after, type, description)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        numericPlayerId,
        "ticket",
        -drawCount,
        updatedPlayerResult.rows[0].tickets,
        "gacha_draw",
        "抽卡消耗",
      ]
    )

    const pickedCards = Array.from({ length: drawCount }, () =>
      pickWeightedCard(poolResult.rows)
    )
    const pickedCardIds = pickedCards.map((card) => card.gacha_card_id)
    const existingOwnedResult = await client.query(
      `SELECT gacha_card_id
       FROM player_gacha_cards
       WHERE player_id = $1
         AND gacha_card_id = ANY($2::int[])`,
      [numericPlayerId, pickedCardIds]
    )
    const existingOwnedIds = new Set(
      existingOwnedResult.rows.map((row) => row.gacha_card_id)
    )
    const grantedCardIds = new Set()
    const newOwnedCardIds = []
    let duplicateCount = 0

    const results = pickedCards.map((pickedCard) => {
      const cardId = pickedCard.gacha_card_id
      const isDuplicate = existingOwnedIds.has(cardId) || grantedCardIds.has(cardId)
      const compensationCoins = isDuplicate ? DUPLICATE_COMPENSATION_COINS : 0

      if (isDuplicate) {
        duplicateCount += 1
      } else {
        grantedCardIds.add(cardId)
        newOwnedCardIds.push(cardId)
      }

      return {
        card: mapDrawCard(pickedCard),
        isDuplicate,
        compensationCoins,
      }
    })

    if (newOwnedCardIds.length > 0) {
      await client.query(
        `INSERT INTO player_gacha_cards (player_id, gacha_card_id)
         SELECT $1, unnest($2::int[])
         ON CONFLICT (player_id, gacha_card_id) DO NOTHING`,
        [numericPlayerId, newOwnedCardIds]
      )
    }

    await client.query(
      `INSERT INTO gacha_draw_logs
       (batch_id, player_id, pool_id, gacha_card_id, ticket_cost, is_duplicate, compensation_coins)
       SELECT $1, $2, unnest($3::int[]), unnest($4::int[]), 1, unnest($5::boolean[]), unnest($6::int[])`,
      [
        batchId,
        numericPlayerId,
        pickedCards.map((card) => card.pool_id),
        pickedCardIds,
        results.map((result) => result.isDuplicate),
        results.map((result) => result.compensationCoins),
      ]
    )

    let finalPlayer = updatedPlayerResult.rows[0]
    const totalCompensationCoins = duplicateCount * DUPLICATE_COMPENSATION_COINS

    if (totalCompensationCoins > 0) {
      const compensationResult = await client.query(
        `UPDATE players
         SET coins = LEAST(coins + $1, 99999),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING id, coins, gems, tickets`,
        [totalCompensationCoins, numericPlayerId]
      )

      finalPlayer = compensationResult.rows[0]

      await client.query(
        `INSERT INTO player_currency_logs
         (player_id, currency, amount, balance_after, type, description)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          numericPlayerId,
          "coin",
          totalCompensationCoins,
          finalPlayer.coins,
          "gacha_duplicate",
          "重複角色卡補償",
        ]
      )
    }

    await client.query("COMMIT")

    return {
      batchId,
      results,
      currency: {
        playerId: finalPlayer.id,
        coins: finalPlayer.coins,
        gems: finalPlayer.gems,
        tickets: finalPlayer.tickets,
      },
    }
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

export {
  drawGacha,
  getOwnedGachaCards,
}
