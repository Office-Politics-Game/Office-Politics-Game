import pool from "../db/index.js"

function createServiceError(message, statusCode = 400) {
    const error = new Error(message)
    error.statusCode = statusCode
    return error
}

function parsePlayerId(playerId) {
    const parsedPlayerId = Number(playerId)

    if (!Number.isInteger(parsedPlayerId) || parsedPlayerId <= 0) {
        throw createServiceError("玩家 ID 不正確", 400)
    }

    return parsedPlayerId
}

function parseAchievementCode(code) {
    if (typeof code !== "string" || code.trim() === "") {
        throw createServiceError("Invalid achievement code", 400)
    }

    return code.trim()
}

function formatAchievement(row) {
    return {
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description,
        category: row.category,
        rewardCurrency: row.reward_currency,
        rewardAmount: row.reward_amount ?? 0,
        isUnlocked: Boolean(row.unlocked_at),
        unlockedAt: row.unlocked_at ?? null,
    }
}

function appendUnlockedAchievements(payload, achievements) {
    const unlockedAchievements = achievements.filter(Boolean)

    if (unlockedAchievements.length === 0) {
        return payload
    }

    return {
        ...payload,
        unlockedAchievements,
    }
}

async function ensurePlayerExists(playerId) {
    const result = await pool.query(
        `SELECT id
         FROM players
         WHERE id = $1`,
        [playerId]
    )

    if (result.rows.length === 0) {
        throw createServiceError("找不到玩家", 404)
    }
}

async function getAchievementByCode(code) {
    const result = await pool.query(
        `SELECT
            id,
            code,
            name,
            description,
            category,
            reward_currency,
            reward_amount,
            NULL AS unlocked_at
         FROM achievements
         WHERE code = $1`,
        [code]
    )

    if (result.rows.length === 0) {
        throw createServiceError("Achievement not found", 404)
    }

    return result.rows[0]
}

async function getPlayerAchievements(playerIdValue) {
    const playerId = parsePlayerId(playerIdValue)

    await ensurePlayerExists(playerId)

    const result = await pool.query(
        `SELECT
            a.id,
            a.code,
            a.name,
            a.description,
            a.category,
            a.reward_currency,
            a.reward_amount,
            pa.unlocked_at
         FROM achievements a
         LEFT JOIN player_achievements pa
           ON pa.achievement_id = a.id
          AND pa.player_id = $1
         ORDER BY a.id ASC`,
        [playerId]
    )

    return {
        achievements: result.rows.map(formatAchievement),
    }
}

async function unlockAchievement(playerIdValue, codeValue) {
    const playerId = parsePlayerId(playerIdValue)
    const code = parseAchievementCode(codeValue)

    await ensurePlayerExists(playerId)

    const achievement = await getAchievementByCode(code)
    const result = await pool.query(
        `INSERT INTO player_achievements (player_id, achievement_id)
         VALUES ($1, $2)
         ON CONFLICT (player_id, achievement_id) DO NOTHING
         RETURNING unlocked_at`,
        [playerId, achievement.id]
    )

    if (result.rows.length === 0) {
        return null
    }

    return formatAchievement({
        ...achievement,
        unlocked_at: result.rows[0].unlocked_at,
    })
}

export {
    getPlayerAchievements,
    unlockAchievement,
    appendUnlockedAchievements,
}
