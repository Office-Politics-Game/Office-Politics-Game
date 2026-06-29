import pool from "../db/index.js"
import { drawCard } from "./drawService.js"
import { getPublicState } from "./gameStateService.js"

function createServiceError(message, statusCode = 400) {
    const error = new Error(message)
    error.statusCode = statusCode
    return error
}

async function drawCardAction({ roomCode, playerId }) {
    const sessionResult = await pool.query(
        `SELECT gs.*
        FROM game_sessions gs
        JOIN game_rooms gr ON gr.id = gs.room_id
        WHERE gr.room_code = $1
        ORDER BY gs.created_at DESC
        LIMIT 1`,
        [roomCode]
    )

    if (sessionResult.rows.length === 0) {
        throw createServiceError("找不到遊戲狀態", 404)
    }

    const gameSession = sessionResult.rows[0]
    const state = gameSession.state_json

    if (state.phase !== "playing") {
        throw createServiceError("目前不是遊戲進行中")
    }

    const drawResult = drawCard({
        state,
        playerId: Number(playerId),
    })

    if (!drawResult.success) {
        throw createServiceError(drawResult.message)
    }

    await pool.query(
        `UPDATE game_sessions
        SET state_json = $1,
            status = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3`,
        [state, state.phase, gameSession.id]
    )

    const publicState = getPublicState(state, Number(playerId))

    return {
        gameSession,
        drawnCard: drawResult.card,
        state,
        publicState,
    }
}

export { drawCardAction }