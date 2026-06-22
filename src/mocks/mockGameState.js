import { mockDeck } from './cardDeckService.js'

const INITIAL_HAND = [
  {
    id: 'hand-ceo',
    name: 'CEO',
    backgroundUrlKey: 'ceo',
    frameUrlKey: 'ceo',
  },
]

const INITIAL_OPPONENTS = [
  {
    id: 'player-top',
    hand: [
      {
        id: 'top-hand-ceo',
        name: 'CEO',
        backgroundUrlKey: 'ceo',
        frameUrlKey: 'ceo',
      },
    ],
  },
  {
    id: 'player-left',
    hand: [
      {
        id: 'left-hand-ceo',
        name: 'CEO',
        backgroundUrlKey: 'ceo',
        frameUrlKey: 'ceo',
      },
    ],
  },
  {
    id: 'player-right',
    hand: [
      {
        id: 'right-hand-ceo',
        name: 'CEO',
        backgroundUrlKey: 'ceo',
        frameUrlKey: 'ceo',
      },
    ],
  },
]

function cloneCard(card) {
  return { ...card }
}

function cloneOpponent(opponent) {
  return {
    ...opponent,
    hand: opponent.hand.map(cloneCard),
  }
}

export function createMockGameState() {
  return {
    deck: mockDeck.map(cloneCard),
    currentPlayer: {
      id: 'player-bottom',
      name: '薪水小偷',
      hand: INITIAL_HAND.map(cloneCard),
    },
    opponents: INITIAL_OPPONENTS.map(cloneOpponent),
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

export function drawMockOpponentCard(gameState, playerId, expectedCardId) {
  const opponent = gameState.opponents.find(
    (candidate) => candidate.id === playerId,
  )
  const nextCard = gameState.deck.at(-1)

  if (
    !opponent ||
    opponent.hand.length >= 2 ||
    !nextCard ||
    (expectedCardId && nextCard.id !== expectedCardId)
  ) {
    return null
  }

  const drawnCard = gameState.deck.pop()
  opponent.hand.push(drawnCard)

  return drawnCard
}
