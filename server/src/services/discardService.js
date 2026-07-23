import { removeHandCard } from "./handService.js"

function attachCardOwner(card, playerId) {
  if (!card) {
    return card
  }

  const numericPlayerId = Number(playerId)

  if (!Number.isInteger(numericPlayerId) || numericPlayerId <= 0) {
    return { ...card }
  }

  return {
    ...card,
    ownerPlayerId: numericPlayerId,
  }
}

function getPlayerId(player) {
  return player?.playerId ?? player?.id ?? null
}

// 出牌
function discardCard( player, cardId, discardPile ) {
  const removedCard = attachCardOwner(removeHandCard(
    player,
    cardId
  ), getPlayerId(player))
  
  if (removedCard === null) {
    return null  
  }

  if (!Array.isArray(player.discardedCards)) {
    player.discardedCards = []
  }

  discardPile.push(removedCard)
  player.discardedCards.push(removedCard)

  return removedCard
}

export {
  discardCard
}
