import express from "express"
import pool from "../db/index.js"

const router = express.Router()

function getPublicState(state,viewerPlayerId) {
    const players = Array.isArray(state.players) ? state.players : []
    const deck = Array.isArray(state.deck) ? state.deck : []
    const discardPile = Array.isArray(state.discardPile) ? state.discardPile : []

    return {
        phase: state.phase,
        deckCount: deck.length,
        discardPile,
        currentTurnPlayerId: state.currentTurnPlayerId,
        winnerPlayerId: state.winnerPlayerId,
        players: players.map((player)=>{
            const isSelf = player.playerId === viewerPlayerId
            const hand = Array.isArray(player.hand) ? player.hand : []
            const discardedCards = Array.isArray(player.discardedCards) ? player.discardedCards : []

            return {
                playerId: player.playerId,
                username: player.username,
                seatOrder: player.seatOrder,
                hand: isSelf ? hand : undefined,
                handCount: hand.length,
                isProtected: player.isProtected,
                isEliminated: player.isEliminated,
                discardedCards
            }
        })
    }
}

router.get('/room/:roomCode', async (req,res)=>{
    try {
        const { roomCode } = req.params
        const viewerPlayerId = Number(req.query.playerId)

        if (!viewerPlayerId){
            return res.status(400).json({ message: "缺少玩家ID" })
        }

        const result = await pool.query(
            `SELECT gs.*
            FROM game_sessions gs
            JOIN game_rooms gr ON gr.id = gs.room_id
            WHERE gr.room_code = $1
            ORDER BY gs.created_at DESC
            LIMIT 1`,
            [roomCode]
        )

        if (result.rows.length === 0){
            return res.status(404).json({ message: "找不到遊戲狀態" })
        }

        const gameSession = result.rows[0]
        const state = gameSession.state_json

        const players = Array.isArray(state.players) ? state.players : []
        const viewerInGame = players.some((player)=>{
            return player.playerId === viewerPlayerId
        })

        if (!viewerInGame){
            return res.status(403).json({ message: "此玩家不在該局遊戲中" })
        }

        const publicState = getPublicState(state, viewerPlayerId)

        res.status(200).json({ 
            id: gameSession.id,
            roomId: gameSession.room_id,
            matchId: gameSession.match_id,
            status: gameSession.status,
            currentTurnPlayerId: gameSession.current_turn_player_id,
            state: publicState,
         })
    } catch(error) {
        return res.status(500).json({ message: "取得遊戲狀態失敗", error: error.message })
    }
})

export { router }