import { removeHandCard } from "./handService.js"

// 出牌
function discardCard( player, cardId, discardPile ) {
  const removedCard = removeHandCard(
    player,
    cardId
  )
  
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
