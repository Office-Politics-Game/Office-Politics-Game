import pool from "../db/index.js"
import { runCardEffect } from "../services/cardEffectService.js"
import {
    buildCardEffectAnimationResult,
    createCardEffectAnimationContext,
} from "../services/cardEffectAnimationService.js"
import { addLog } from "../services/actionLogService.js"
import { discardCard } from "../services/discardService.js"
import { finishTurn } from "../services/roundFlowService.js"
import { getPublicState } from "../services/gameStateService.js"
import { drawCard } from "../services/drawService.js"
import {
    checkTurn,
    checkPlayer,
    checkCard,
    checkTarget,
    checkAdvisorRule,
} from "../services/ruleCheckService.js"

async function handlePlayCard(req, res){
    try {
        const {
            roomCode,
            playerId,
            cardId,
            targetPlayerId,
            guessedCardName,
        } = req.body

        if (!roomCode) {
            return res.status(400).json({ message: "缺少房間代碼" })
        }

        if (!playerId) {
            return res.status(400).json({ message: "缺少玩家ID" })
        }

        if (!cardId) {
            return res.status(400).json({ message: "缺少卡牌ID" })
        }

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
            return res.status(404).json({ message: "找不到遊戲狀態" })
        }

        const gameSession = sessionResult.rows[0]
        const state = gameSession.state_json
        const numericPlayerId = Number(playerId)
        const numericTargetPlayerId = targetPlayerId
            ? Number(targetPlayerId)
            : undefined

        if (state.phase !== "playing") {
            return res.status(400).json({ message: "遊戲目前不是進行中" })
        }

        const player = checkPlayer(state, numericPlayerId)
        checkTurn(state, numericPlayerId)
        const card = checkCard(state, numericPlayerId, cardId)
        checkAdvisorRule(state, numericPlayerId, card.id)
        checkTarget(state, numericPlayerId, card.id, numericTargetPlayerId)

        if (card.name === "Intern" && !checkGuess(guessedCardName)) {
            return res.status(400).json({ message: "猜測卡牌不合法" })
        }

        const discardedCard = discardCard(
            player,
            card.id,
            state.discardPile
        )

        if (!discardedCard) {
            return res.status(400).json({ message: "玩家沒有此手牌" })
        }

        const effectAnimationContext = createCardEffectAnimationContext({
            state,
            card: discardedCard,
            playerId: Number(playerId),
            targetPlayerId: targetPlayerId ? Number(targetPlayerId) : undefined,
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

        finishTurn(state, numericPlayerId)

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
            numericPlayerId,
            "play_card",
            JSON.stringify({
                cardId,
                targetPlayerId,
                guessedCardName,
                result: effectResult,
                animationResult,
                discardedCard,
                nextTurnPlayerId: state.currentTurnPlayerId,
            })
        )

        const publicState = getPublicState(state, numericPlayerId)

        return res.status(200).json({
            message: "卡牌效果已執行",
            result: effectResult,
            animationResult,
            discardedCard,
            actionLog,
            state: publicState,
        })
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.statusCode ? error.message : "出牌失敗",
            error: error.message,
        })
  }
}

async function handleDrawCard(req, res) {
  try {
    const { roomCode } = req.params
    const { playerId } = req.body

    if (!playerId) {
      return res.status(400).json({ message: "缺少玩家ID" })
    }

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
        return res.status(404).json({ message: "找不到遊戲狀態" })
    }

    const gameSession = sessionResult.rows[0]
    const state = gameSession.state_json

    if (state.phase !== "playing") {
        return res.status(400).json({ message: "遊戲目前不是進行中" })
    }

    const drawResult = drawCard({
        state,
        playerId: Number(playerId),
    })

    if (!drawResult.success) {
        return res.status(400).json({ message: drawResult.message })
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

    return res.status(200).json({
        message: "抽牌成功",
        drawnCard: drawResult.card,
        state: publicState,
    })
  }catch (error){
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : "抽牌失敗",
      error: error.message,
    })
  }
}

export { handlePlayCard, handleDrawCard }
