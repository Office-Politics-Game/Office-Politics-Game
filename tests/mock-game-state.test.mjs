import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createMockGameState,
  drawMockCard,
} from '../src/mocks/mockGameState.js'

test('mock game state starts with one player hand card and a drawable deck', () => {
  const state = createMockGameState()

  assert.equal(state.currentPlayer.hand.length, 1)
  assert.equal(state.deck.length, 2)
  assert.equal(state.deck.at(-1).id, 'advisor-1')
})

test('drawing moves the top deck card into the current player hand', () => {
  const state = createMockGameState()
  const drawnCard = drawMockCard(state, 'advisor-1')

  assert.equal(drawnCard.id, 'advisor-1')
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

  drawMockCard(state, 'advisor-1')
  const secondDraw = drawMockCard(state, 'ceo-1')

  assert.equal(secondDraw, null)
  assert.equal(state.deck.length, 1)
  assert.equal(state.currentPlayer.hand.length, 2)
})
