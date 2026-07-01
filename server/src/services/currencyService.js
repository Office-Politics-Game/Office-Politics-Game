import pool from "../db/index.js"

const currencyColumnMap = {
    coin: "coins",
    diamond: "gems",
    ticket: "tickets",
}

function createServiceError(message, statusCode = 400) {
    const error = new Error(message)
    error.statusCode = statusCode
    return error
}

function getCurrencyColumn(currency) {
    const column = currencyColumnMap[currency]
    if (!column) {
        throw createServiceError("不支援的通貨類型")
    }
    return column
}

async function getPlayerCurrency(playerId) {
    const result = await pool.query(
        `SELECT id, coins, gems, tickets
         FROM players
         WHERE id = $1`,
        [playerId]
    )

    if (result.rows.length === 0) {
        throw createServiceError("找不到玩家", 404)
    }

    const player = result.rows[0]

    return {
        playerId: player.id,
        coins: player.coins,
        gems: player.gems,
        tickets: player.tickets,
    }
}

async function addCurrency(playerId, currency, amount, type, description = null) {
    const column = getCurrencyColumn(currency)
    const numericAmount = Number(amount)

    if (!Number.isInteger(numericAmount) || numericAmount <= 0) {
        throw createServiceError("增加數量必須是正整數")
    }

    const result = await pool.query(
        `UPDATE players
         SET ${column} = ${column} + $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING id, ${column}`,
        [numericAmount, playerId]
    )

    if (result.rows.length === 0) {
        throw createServiceError("找不到玩家", 404)
    }

    const player = result.rows[0]
    const balanceAfter = player[column]

    await pool.query(
        `INSERT INTO player_currency_logs
         (player_id, currency, amount, balance_after, type, description)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
            playerId,
            currency,
            numericAmount,
            balanceAfter,
            type,
            description,
        ]
    )

    return {
        playerId: player.id,
        currency,
        amount: numericAmount,
        balanceAfter,
    }
}

async function spendCurrency(playerId, currency, amount, type, description = null) {
    const column = getCurrencyColumn(currency)
    const numericAmount = Number(amount)

    if (!Number.isInteger(numericAmount) || numericAmount <= 0) {
        throw createServiceError("扣除數量必須是正整數")
    }

    const result = await pool.query(
        `UPDATE players
         SET ${column} = ${column} - $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
           AND ${column} >= $1
         RETURNING id, ${column}`,
        [numericAmount, playerId]
    )

    if (result.rows.length === 0) {
        throw createServiceError("玩家不存在或餘額不足")
    }

    const player = result.rows[0]
    const balanceAfter = player[column]

    await pool.query(
        `INSERT INTO player_currency_logs
         (player_id, currency, amount, balance_after, type, description)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
            playerId,
            currency,
            -numericAmount,
            balanceAfter,
            type,
            description,
        ]
    )

    return {
        playerId: player.id,
        currency,
        amount: -numericAmount,
        balanceAfter,
    }
}

export {
    getPlayerCurrency,
    addCurrency,
    spendCurrency,
}