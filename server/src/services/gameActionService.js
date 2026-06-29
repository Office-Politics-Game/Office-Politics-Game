import pool from "../db/index.js"
import { drawCard } from "./drawService.js"
import { getPublicState } from "./gameStateService.js"
import { runCardEffect } from "./cardEffectService.js"
import { addLog } from "./actionLogService.js"
import { discardCard } from "./discardService.js"
import { finishTurn } from "./roundFlowService.js"
import {
    checkTurn,
    checkPlayer,
    checkCard,
    checkTarget,
    checkProtected,
    checkAdvisorRule,
} from "./ruleCheckService.js"

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

async function playCardAction({
    roomCode,
    playerId,
    cardId,
    targetPlayerId,
    guessedCardName,
}) {
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

    checkPlayer(state, playerId)
    checkTurn(state, playerId)

    const card = checkCard(state, playerId, cardId)

    checkAdvisorRule(state, playerId, cardId)

    const targetPlayer = checkTarget(
        state,
        playerId,
        cardId,
        targetPlayerId
    )

    if (targetPlayer) {
        checkProtected(state, targetPlayerId)
    }

    const player = checkPlayer(state, playerId)
    const discardedCard = discardCard(
        player,
        card.id,
        state.discardPile
    )

    if (!discardedCard) {
        throw createServiceError("玩家沒有此手牌")
    }

    const effectResult = runCardEffect({
        state,
        card: discardedCard,
        playerId: Number(playerId),
        targetPlayerId: targetPlayerId ? Number(targetPlayerId) : undefined,
        guessedCardName,
    })

    finishTurn(state, Number(playerId))

    await pool.query(
        `UPDATE game_sessions
        SET state_json = $1,
            status = $2,
            current_turn_player_id = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4`,
        [state, state.phase, state.currentTurnPlayerId, gameSession.id]
    )
    const actionLog = await addLog(
        gameSession.room_id,
        Number(playerId),
        "play_card",
        JSON.stringify({
            cardId,
            targetPlayerId,
            guessedCardName,
            result: effectResult,
            discardedCard,
            nextTurnPlayerId: state.currentTurnPlayerId,
        })
    )

    const publicState = getPublicState(state, Number(playerId))

    return {
        gameSession,
        result: effectResult,
        discardedCard,
        actionLog,
        state,
        publicState,
    }
}

export { drawCardAction, playCardAction }