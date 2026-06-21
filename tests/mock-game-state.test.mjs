import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createMockGameState,
  drawMockCard,
  drawMockOpponentCard,
} from '../src/mocks/mockGameState.js'

test('mock game state starts with one player hand card and a drawable deck', () => {
  const state = createMockGameState()

  assert.equal(state.currentPlayer.hand.length, 1)
  assert.equal(state.opponents.length, 3)
  assert.deepEqual(
    state.opponents.map((opponent) => opponent.id),
    ['player-top', 'player-left', 'player-right'],
  )
  assert.equal(state.opponents.every((opponent) => opponent.hand.length === 1), true)
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

test('opponent drawing moves the top deck card into the selected opponent hand', () => {
  const state = createMockGameState()
  const drawnCard = drawMockOpponentCard(state, 'player-left', 'advisor-1')
  const opponent = state.opponents.find(({ id }) => id === 'player-left')

  assert.equal(drawnCard.id, 'advisor-1')
  assert.equal(state.deck.length, 1)
  assert.equal(opponent.hand.length, 2)
  assert.equal(opponent.hand.at(-1), drawnCard)
})

test('opponent drawing rejects invalid targets, stale cards, full hands, and empty decks', () => {
  const state = createMockGameState()

  assert.equal(drawMockOpponentCard(state, 'missing-player'), null)
  assert.equal(drawMockOpponentCard(state, 'player-left', 'wrong-card'), null)
  assert.equal(state.deck.length, 2)
  assert.equal(state.opponents.find(({ id }) => id === 'player-left').hand.length, 1)

  drawMockOpponentCard(state, 'player-left', 'advisor-1')
  assert.equal(drawMockOpponentCard(state, 'player-left', 'ceo-1'), null)
  assert.equal(state.deck.length, 1)
  assert.equal(state.opponents.find(({ id }) => id === 'player-left').hand.length, 2)

  state.deck.length = 0
  assert.equal(drawMockOpponentCard(state, 'player-right'), null)
  assert.equal(state.opponents.find(({ id }) => id === 'player-right').hand.length, 1)
})
