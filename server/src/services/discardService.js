import { removeHandCard } from "./handService.js"

function attachCardOwner(card, playerId) {
  if (!card) {
    return card
  }

  return {
    ...card,
    ownerPlayerId: Number(playerId),
  }
}

// 出牌
function discardCard( player, cardId, discardPile ) {
  const removedCard = attachCardOwner(removeHandCard(
    player,
    cardId
  ), player?.playerId)
  
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
