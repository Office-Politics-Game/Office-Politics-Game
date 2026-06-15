import { mockDeck } from './cardDeckService.js'

const INITIAL_HAND = [
  {
    id: 'hand-ceo',
    name: 'CEO',
    backgroundUrlKey: 'ceo',
    frameUrlKey: 'ceo',
  },
]

function cloneCard(card) {
  return { ...card }
}

export function createMockGameState() {
  return {
    deck: mockDeck.map(cloneCard),
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
