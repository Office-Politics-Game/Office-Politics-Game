import pool from "../db/index.js"
import { runCardEffect } from "../services/cardEffectService.js"
import { addLog } from "../services/actionLogService.js"
import { discardCard } from "../services/discardService.js"
import { finishTurn } from "../services/roundFlowService.js"
import { getPublicState } from "../services/gameStateService.js"

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

        const discardedCard = discardCard(
            currentPlayer,
            card.id,
            state.discardPile
        )

        if (!discardedCard) {
            return res.status(400).json({ message: "玩家沒有此手牌" })
        }

        const effectResult = runCardEffect({
            state,
            card,
            playerId: Number(playerId),
            targetPlayerId: targetPlayerId ? Number(targetPlayerId) : undefined,
            guessedCardName,
        })

        finishTurn(state, Number(playerId))

        await pool.query(
            `UPDATE game_sessions
            SET state_json = $1,
                current_turn_player_id = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3`,
            [state, state.currentTurnPlayerId, gameSession.id]
        )

        const actionLog = await addLog(
            gameSession.room_id,
            Number(playerId),
            "play_card",
            JSON.stringify({
                card,
                targetPlayerId,
                guessedCardName,
                result: effectResult,
                discardedCard,
                nextTurnPlayerId: state.currentTurnPlayerId,
            })
        )

        return res.status(200).json({
            message: "卡牌效果已執行",
            result: effectResult,
            actionLog,
            state: getPublicState(state, Number(playerId))
        })
    } catch (error) {
        return res.status(500).json({
        message: "出牌失敗",
        error: error.message,
    })
  }
}

export { handlePlayCard }
