import { createDeck } from "./gameDeck.js"
import { shuffleDeck } from "../services/deckService.js"

function selectInitialTurnPlayerId(gamePlayers, random = Math.random) {
  const humanPlayers = gamePlayers.filter((player) => !player.isComputer)
  const computerPlayers = gamePlayers.filter((player) => player.isComputer)

  if (humanPlayers.length === 1 && computerPlayers.length === 3) {
    return humanPlayers[0].playerId
  }

  const randomIndex = Math.floor(random() * gamePlayers.length)
  return gamePlayers[randomIndex].playerId
}

function createInitialState(players) {
  const deck = shuffleDeck(createDeck())

  const sortedPlayers = [...players].sort((a, b) => {
    return a.seat_order - b.seat_order
  })

  const gamePlayers = sortedPlayers.map((player) => {
    const card = deck.shift()

    return {
      playerId: player.player_id,
      username: player.username,
      level: player.level,
      avatarId: player.avatar_id,
      avatarUrl: player.avatar_url,
      cardSkinUrl: player.card_skin_url,
      cardSkinOverrides: player.card_skin_override_urls ?? {},
      seatOrder: player.seat_order,
      isComputer: Boolean(player.is_computer),
      hand: card ? [{ ...card, ownerPlayerId: player.player_id }] : [],
      isProtected: false,
      isEliminated: false,
      discardedCards: [],
      roundWins: 0,
    }
  })

  const currentTurnPlayerId = selectInitialTurnPlayerId(gamePlayers)

  return {
    phase: "playing",
    roundNumber: 1,
    deck,
    discardPile: [],
    hasAnyCardBeenPlayed: false,
    currentTurnPlayerId,
    roundWinnerPlayerId: null,
    winnerPlayerId: null,
    players: gamePlayers,
  }
}

export { createInitialState, selectInitialTurnPlayerId }
