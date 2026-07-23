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
      message: "找不到玩家資料",
    }
  }

  if (state.currentTurnPlayerId !== Number(playerId)) {
    return {
      success: false,
      message: "還沒輪到這位玩家",
    }
  }

  const card = takeDeckCard(state)

  if (!card) {
    return {
      success: false,
      message: "牌庫已經沒有剩餘卡牌",
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
