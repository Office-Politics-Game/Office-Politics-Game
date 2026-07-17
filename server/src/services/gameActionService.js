import pool from "../db/index.js"
import { drawCard } from "./drawService.js"
import { getPublicState } from "./gameStateService.js"
import { runCardEffect, checkGuess } from "./cardEffectService.js"
import { addLog } from "./actionLogService.js"
import { discardCard } from "./discardService.js"
import { finishTurn } from "./roundFlowService.js"
import { finalizeMatchProgress } from "./playerProgressService.js"
import {
    appendUnlockedAchievements,
    unlockAchievement,
} from "./achievementService.js"
import {
    buildCardEffectAnimationResult,
    createCardEffectAnimationResultForViewer,
    createCardEffectAnimationContext,
} from "./cardEffectAnimationService.js"
import {
    checkTurn,
    checkPlayer,
    checkCard,
    checkTarget,
    checkAdvisorRule,
} from "./ruleCheckService.js"

function createServiceError(message, statusCode = 400) {
    const error = new Error(message)
    error.statusCode = statusCode
    return error
}

async function unlockGameEndAchievements(state, viewerPlayerId) {
    if (state.phase !== "finished") {
        return []
    }

    const unlockedAchievements = []

    if (state.winnerPlayerId) {
        const unlockedAchievement = await unlockAchievement(
            state.winnerPlayerId,
            "first_game_win"
        )

        if (state.winnerPlayerId === viewerPlayerId) {
            unlockedAchievements.push(unlockedAchievement)
        }
    }

    return unlockedAchievements
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

    const numericPlayerId = Number(playerId)
    const numericTargetPlayerId = targetPlayerId
        ? Number(targetPlayerId)
        : undefined

    checkPlayer(state, numericPlayerId)
    checkTurn(state, numericPlayerId)

    const card = checkCard(state, numericPlayerId, cardId)

    checkAdvisorRule(state, numericPlayerId, card.id)

    checkTarget(
        state,
        numericPlayerId,
        card.id,
        numericTargetPlayerId
    )

    if (card.name === "Intern" && !checkGuess(guessedCardName)) {
        throw createServiceError("猜測卡牌不合法")
    }

    const player = checkPlayer(state, numericPlayerId)
    const discardedCard = discardCard(
        player,
        card.id,
        state.discardPile
    )

    if (!discardedCard) {
        throw createServiceError("玩家沒有此手牌")
    }

    state.hasAnyCardBeenPlayed = true

    const effectAnimationContext = createCardEffectAnimationContext({
        state,
        card: discardedCard,
        playerId: numericPlayerId,
        targetPlayerId: numericTargetPlayerId,
        guessedCardName,
    })

    const effectResult = runCardEffect({
        state,
        card: discardedCard,
        playerId: numericPlayerId,
        targetPlayerId: numericTargetPlayerId,
        guessedCardName,
    })
    const animationResult = buildCardEffectAnimationResult(
        effectAnimationContext,
        effectResult,
    )

    const { showdownResult, roundEndState } = finishTurn(state, numericPlayerId)

    let matchProgress = { finalized: false }

    if (state.phase === "finished") {
        const client = await pool.connect()

        try {
            await client.query("BEGIN")

            await client.query(
                `UPDATE game_sessions
                SET state_json = $1,
                    status = $2,
                    current_turn_player_id = $3,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $4`,
                [state, state.phase, state.currentTurnPlayerId, gameSession.id]
            )

            matchProgress = await finalizeMatchProgress({
                matchId: gameSession.match_id,
                state,
                client,
            })

            await client.query("COMMIT")
        } catch (error) {
            await client.query("ROLLBACK")
            throw error
        } finally {
            client.release()
        }
    } else {
        await pool.query(
            `UPDATE game_sessions
            SET state_json = $1,
                status = $2,
                current_turn_player_id = $3,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $4`,
            [state, state.phase, state.currentTurnPlayerId, gameSession.id]
        )
    }

    const actionLog = await addLog(
        gameSession.room_id,
        numericPlayerId,
        "play_card",
        JSON.stringify({
            cardId,
            targetPlayerId,
            guessedCardName,
            result: effectResult,
            animationResult: createCardEffectAnimationResultForViewer(
                animationResult,
                numericPlayerId,
                numericPlayerId,
            ),
            discardedCard,
            nextTurnPlayerId: state.currentTurnPlayerId,
        })
    )

    const publicState = getPublicState(state, numericPlayerId)

    const unlockedAchievements = await unlockGameEndAchievements(
        state,
        numericPlayerId
    )

    return appendUnlockedAchievements({
        gameSession,
        result: effectResult,
        animationResult,
        showdownResult,
        roundEndState,
        discardedCard,
        actionLog,
        matchProgress,
        state,
        publicState,
    }, unlockedAchievements)
}

export { drawCardAction, playCardAction }
