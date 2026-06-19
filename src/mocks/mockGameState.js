import { mockDeck } from './cardDeckService.js'

const INITIAL_HAND = [
  {
    id: 'intern-1',
    name: '實習生',
    rank: 1,
    effectKey: 'guess',
    targetMode: 'opponent',
    requiresGuess: true,
    backgroundUrlKey: 'intern',
    frameUrlKey: 'intern',
  },
]

function cloneCard(card) {
  return { ...card }
}

export function createMockGameState() {
  return {
    deck: mockDeck.map(cloneCard),
    discardPile: [],
    playedCards: [],
    currentPlayer: {
      id: 'player-bottom',
      name: '薪水小偷',
      hand: INITIAL_HAND.map(cloneCard),
    },
  }
}

export function drawMockCard(gameState, expectedCardId) {
  const nextCard = gameState.deck.at(-1)

  if (
    gameState.currentPlayer.hand.length >= 2 ||
    !nextCard ||
    (expectedCardId && nextCard.id !== expectedCardId)
  ) {
    return null
  }

  const drawnCard = gameState.deck.pop()
  gameState.currentPlayer.hand.push(drawnCard)

  return drawnCard
}

export function playMockCard(gameState, playPayload) {
  const cardIndex = gameState.currentPlayer.hand.findIndex(
    (card) => card.id === playPayload.cardId,
  )

  if (cardIndex === -1) {
    return null
  }

  const [playedHandCard] = gameState.currentPlayer.hand.splice(cardIndex, 1)
  const playedCard = {
    ...playedHandCard,
    targetPlayerId: playPayload.targetPlayerId ?? null,
    guessedRank: playPayload.guessedRank ?? null,
  }

  gameState.discardPile.push(playedCard)
  gameState.playedCards.push(playedCard)

  return playedCard
}
