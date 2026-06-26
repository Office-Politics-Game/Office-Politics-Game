import pool from "../db/index.js"
import { runCardEffect, checkGuess } from "../services/cardEffectService.js"
import { addLog } from "../services/actionLogService.js"
import { discardCard } from "../services/discardService.js"
import { getPublicState } from "../services/gameStateService.js"
import { drawCard } from "../services/drawService.js"
import { clearPlayerProtection } from "../services/playerStateService.js"
import {
    checkTurn,
    checkPlayer,
    checkCard,
    checkTarget,
    checkAdvisorRule,
} from "../services/ruleCheckService.js"

function getNextTurnPlayerId(players, currentPlayerId) {
    const activePlayers = players
        .filter((player) => {
            return !player.isEliminated
        })
        .sort((a, b) => {
            return a.seatOrder - b.seatOrder
        })

    if (activePlayers.length === 0) {
        return null
    }

    const currentIndex = activePlayers.findIndex((player) => {
        return player.playerId === currentPlayerId
    })

    const nextIndex = currentIndex === -1
        ? 0
        : (currentIndex + 1) % activePlayers.length

    return activePlayers[nextIndex].playerId
}

async function handlePlayCard(req, res){
    try {
        const {
            roomCode,
            playerId,
            card,
            targetPlayerId,
            guessedCardName,
        } = req.body

        if (!roomCode) {
            return res.status(400).json({ message: "缺少房間代碼" })
        }

        if (!playerId) {
            return res.status(400).json({ message: "缺少玩家ID" })
        }

        if (!card) {
            return res.status(400).json({ message: "缺少卡牌資料" })
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
        const players = Array.isArray(state.players) ? state.players : []
        const playerInGame = players.some((player) => {
            return player.playerId === Number(playerId)
        })

        if (!playerInGame) {
            return res.status(403).json({ message: "此玩家不在該局遊戲中" })
        }

        const currentPlayer = players.find((player) => {
            return player.playerId === Number(playerId)
        })

        checkTurn(state, Number(playerId))
        checkPlayer(state, Number(playerId))
        const playedCard = checkCard(state, Number(playerId), card.id)
        checkTarget(
            state,
            Number(playerId),
            playedCard.id,
            targetPlayerId ? Number(targetPlayerId) : undefined
        )
        checkAdvisorRule(state, Number(playerId), playedCard.id)

        if (playedCard.name === "Intern" && !checkGuess(guessedCardName)) {
            return res.status(400).json({ message: "猜測卡牌不合法" })
        }

        const discardedCard = discardCard(
            currentPlayer,
            playedCard.id,
            state.discardPile
        )

        if (!discardedCard) {
            return res.status(400).json({ message: "玩家沒有此手牌" })
        }

        const effectResult = runCardEffect({
            state,
            card: playedCard,
            playerId: Number(playerId),
            targetPlayerId: targetPlayerId ? Number(targetPlayerId) : undefined,
            guessedCardName,
        })

        const nextTurnPlayerId = getNextTurnPlayerId(
            players,
            Number(playerId)
        )

        if (nextTurnPlayerId) {
            clearPlayerProtection(state, nextTurnPlayerId)
        }

        state.currentTurnPlayerId = nextTurnPlayerId

        await pool.query(
            `UPDATE game_sessions
            SET state_json = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2`,
            [state, gameSession.id]
        )

        const actionLog = await addLog(
            gameSession.room_id,
            Number(playerId),
            "play_card",
            JSON.stringify({
                card: playedCard,
                targetPlayerId,
                guessedCardName,
                result: effectResult,
                discardedCard,
                nextTurnPlayerId: state.currentTurnPlayerId,
            })
        )
        const publicState = getPublicState(state, Number(playerId))
        return res.status(200).json({
            message: "卡牌效果已執行",
            result: effectResult,
            discardedCard,
            actionLog,
            state: publicState,
        })
    } catch (error) {
        return res.status(error.statusCode || 500).json({
        message: "出牌失敗",
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
        return res.status(404).json({ message: "找不到遊戲場次" })
    }

    const gameSession = sessionResult.rows[0]
    const state = gameSession.state_json

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
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2`,
        [state, gameSession.id]
    )

    const publicState = getPublicState(state, Number(playerId))

    return res.status(200).json({
        message: "抽牌成功",
        drawnCard: drawResult.card,
        state: publicState,
    })
  }catch (error){
    return res.status(500).json({
      message: "抽牌失敗",
      error: error.message,
    })
  }
}

export { handlePlayCard, handleDrawCard }
