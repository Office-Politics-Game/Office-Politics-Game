import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createMockGameState,
  drawMockCard,
  playMockCard,
} from '../src/mocks/mockGameState.js'

test('mock game state starts with one player hand card and a drawable deck', () => {
  const state = createMockGameState()

  assert.equal(state.currentPlayer.hand.length, 1)
  assert.equal(state.currentPlayer.hand[0].id, 'intern-1')
  assert.equal(state.currentPlayer.hand[0].rank, 1)
  assert.equal(state.currentPlayer.hand[0].effectKey, 'guess')
  assert.equal(state.currentPlayer.hand[0].targetMode, 'opponent')
  assert.equal(state.currentPlayer.hand[0].requiresGuess, true)
  assert.equal(state.discardPile.length, 0)
  assert.equal(state.playedCards.length, 0)
  assert.equal(state.deck.length, 2)
  assert.equal(state.deck.at(-1).id, 'cleaner-1')
})

test('drawing moves the top deck card into the current player hand', () => {
  const state = createMockGameState()
  const drawnCard = drawMockCard(state, 'cleaner-1')

  assert.equal(drawnCard.id, 'cleaner-1')
  assert.equal(drawnCard.rank, 2)
  assert.equal(drawnCard.targetMode, 'opponent')
  assert.equal(state.deck.length, 1)
  assert.equal(state.currentPlayer.hand.length, 2)
  assert.equal(state.currentPlayer.hand.at(-1), drawnCard)
})

test('drawing rejects stale cards and leaves empty decks unchanged', () => {
  const state = createMockGameState()

  assert.equal(drawMockCard(state, 'wrong-card'), null)
  assert.equal(state.deck.length, 2)
  assert.equal(state.currentPlayer.hand.length, 1)

  state.deck.length = 0

  assert.equal(drawMockCard(state), null)
  assert.equal(state.currentPlayer.hand.length, 1)
})

test('drawing stops when the current player already has two cards', () => {
  const state = createMockGameState()

  drawMockCard(state, 'cleaner-1')
  const secondDraw = drawMockCard(state, 'pm-1')

  assert.equal(secondDraw, null)
  assert.equal(state.deck.length, 1)
  assert.equal(state.currentPlayer.hand.length, 2)
})

test('playing a card removes it from hand and records target choices', () => {
  const state = createMockGameState()
  const playedCard = playMockCard(state, {
    cardId: 'intern-1',
    targetPlayerId: 'player-top',
    guessedRank: 5,
  })

  assert.equal(playedCard.id, 'intern-1')
  assert.equal(playedCard.targetPlayerId, 'player-top')
  assert.equal(playedCard.guessedRank, 5)
  assert.equal(state.currentPlayer.hand.length, 0)
  assert.deepEqual(state.discardPile, [playedCard])
  assert.deepEqual(state.playedCards, [playedCard])
})

test('playing rejects cards that are no longer in hand', () => {
  const state = createMockGameState()

  assert.equal(playMockCard(state, { cardId: 'missing-card' }), null)
  assert.equal(state.currentPlayer.hand.length, 1)
  assert.equal(state.discardPile.length, 0)
  assert.equal(state.playedCards.length, 0)
})
