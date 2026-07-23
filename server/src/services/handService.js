import { drawCard } from "./deckService.js"

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

function dealCards(deck, players, cardsPerPlayer) {
  for (let round = 0; round < cardsPerPlayer; round += 1) {
    for (let playerIndex = 0; playerIndex < players.length; playerIndex += 1) {
      const card = drawCard(deck)

      if (!card) {
        continue
      }

      if (!Array.isArray(players[playerIndex].hand)) {
        players[playerIndex].hand = []
      }

      players[playerIndex].hand.push(
        attachCardOwner(card, getPlayerId(players[playerIndex])),
      )
    }
  }

  return { players, deck }
}

function addHandCard(player, card) {
  if (!player) {
    return player
  }

  if (!Array.isArray(player.hand)) {
    player.hand = []
  }

  if (card) {
    player.hand.push(attachCardOwner(card, getPlayerId(player)))
  }

  return player
}

function removeHandCard(player, cardId) {
  const cardIndex = player.hand.findIndex((card) => card.id === cardId)

  if (cardIndex === -1) {
    return null
  }

  return player.hand.splice(cardIndex, 1)[0]
}

function replaceCard(player, cardId, discardPile, deck) {
  if (deck.length === 0) {
    return null
  }

  const discardedCard = removeHandCard(player, cardId, discardPile)

  if (discardedCard === null) {
    return null
  }

  discardPile.push(discardedCard)

  const newCard = drawCard(deck)

  if (newCard === null) {
    return null
  }

  addHandCard(player, newCard)

  return { discardedCard, newCard, player, deck, discardPile }
}

function swapHands(playerA, playerB) {
  const temp = playerA.hand
  playerA.hand = playerB.hand
  playerB.hand = temp
  return { playerA, playerB }
}

export {
  dealCards,
  addHandCard,
  removeHandCard,
  replaceCard,
  swapHands,
}
