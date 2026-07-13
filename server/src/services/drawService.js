function takeDeckCard(state) {
  if (!Array.isArray(state.deck) || state.deck.length === 0) {
    return null
  }

  const randomIndex = Math.floor(Math.random() * state.deck.length)
  return state.deck.splice(randomIndex, 1)[0]
}

function addHandCard(player, card) {
  if (!player || !card) {
    return false
  }

  if (!Array.isArray(player.hand)) {
    player.hand = []
  }

  player.hand.push({
    ...card,
    ownerPlayerId: Number(player.playerId),
  })

  return true
}

function drawCard({ state, playerId }) {
  const players = Array.isArray(state.players) ? state.players : []
  const player = players.find((currentPlayer) => {
    return currentPlayer.playerId === Number(playerId)
  })

  if (!player) {
    return {
      success: false,
      message: "Player not found",
    }
  }

  if (state.currentTurnPlayerId !== Number(playerId)) {
    return {
      success: false,
      message: "Not this player's turn",
    }
  }

  const card = takeDeckCard(state)

  if (!card) {
    return {
      success: false,
      message: "Deck is empty",
    }
  }

  addHandCard(player, card)

  return {
    success: true,
    card: {
      ...card,
      ownerPlayerId: Number(player.playerId),
    },
    state,
  }
}

export { takeDeckCard, addHandCard, drawCard }
