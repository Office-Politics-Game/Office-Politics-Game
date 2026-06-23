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
  discardPile.push(removedCard)
  return removedCard
}

export {
  discardCard
}
