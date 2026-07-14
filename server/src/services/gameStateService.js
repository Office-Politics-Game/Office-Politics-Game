import pool from "../db/index.js"

function createServiceError(message, statusCode = 400){
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function getPublicState(state, viewerPlayerId){
  const players = Array.isArray(state.players) ? state.players : []
  const deck = Array.isArray(state.deck) ? state.deck : []
  const discardPile = Array.isArray(state.discardPile) ? state.discardPile : []

  return {
    phase: state.phase,
    deckCount: deck.length,
    discardPile,
    hasAnyCardBeenPlayed: Boolean(state.hasAnyCardBeenPlayed),
    currentTurnPlayerId: state.currentTurnPlayerId,
    roundWinnerPlayerId: state.roundWinnerPlayerId,
    winnerPlayerId: state.winnerPlayerId,
    players: players.map((player)=>{
      const isSelf = player.playerId === viewerPlayerId
      const hand = Array.isArray(player.hand) ? player.hand : []
      const discardedCards = Array.isArray(player.discardedCards) ? player.discardedCards : []

      return {
        playerId: player.playerId,
        username: player.username,
        avatarId: player.avatarId,
        avatarUrl: player.avatarUrl,
        cardSkinUrl: player.cardSkinUrl ?? null,
        cardSkinOverrides: player.cardSkinOverrides ?? {},
        seatOrder: player.seatOrder,
        isComputer: Boolean(player.isComputer),
        hand: isSelf ? hand : undefined,
        handCount: hand.length,
        isProtected: player.isProtected,
        isEliminated: player.isEliminated,
        discardedCards,
        roundWins: player.roundWins || 0
      }
    }),
  }
}

async function getState({ roomCode, viewerPlayerId }){
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
    throw createServiceError("找不到遊戲狀態", 404)
  }

  const gameSession = result.rows[0]
  const state = gameSession.state_json
  const players = Array.isArray(state.players) ? state.players : []
  const viewerInGame = players.some((player)=>{
    return player.playerId === viewerPlayerId
  })

  if (!viewerInGame){
    throw createServiceError("此玩家不在該局遊戲中", 403)
  }

  const publicState = getPublicState(state, viewerPlayerId)

  return {
    id: gameSession.id,
    roomId: gameSession.room_id,
    matchId: gameSession.match_id,
    status: gameSession.status,
    currentTurnPlayerId: gameSession.current_turn_player_id,
    state: publicState,
  }
}

export { getState, getPublicState }
