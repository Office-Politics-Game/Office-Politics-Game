import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('game card renders separate full-size background and frame layers', async () => {
  const source = await readSource('src/components/game/GameCard.vue')

  for (const propName of ['name', 'backgroundUrl', 'frameUrl']) {
    assert.match(source, new RegExp(`${propName}:`))
  }

  assert.equal((source.match(/absolute inset-0 block size-full/g) ?? []).length, 2)
  assert.match(source, /:src="backgroundUrl"/)
  assert.match(source, /:src="frameUrl"/)
  assert.match(source, /:aria-label="name"/)
})

test('player hand uses separate arrangement and future motion layers', async () => {
  const source = await readSource('src/components/game/PlayerHand.vue')

  assert.match(source, /cards:/)
  assert.match(source, /game-card-arrangement/)
  assert.match(source, /game-card-motion/)
  assert.match(source, /clamp\(126px,\s*31vh,\s*230px\)/)
  assert.match(source, /rotate\(-5deg\)/)
  assert.match(source, /rotate\(5deg\)/)
  assert.match(source, /<GameCard/)
})

test('game view derives deck count, draw card, and hand cards from mock game state', async () => {
  const gameViewSource = await readSource('src/views/GameView.vue')
  const gameStageSource = await readSource('src/components/game/GameStage.vue')

  assert.match(gameViewSource, /createMockGameState/)
  assert.match(gameViewSource, /drawMockCard/)
  assert.match(gameViewSource, /const gameState = reactive\(createMockGameState\(\)\)/)
  assert.match(gameViewSource, /const deckCount = computed\(\(\) => gameState\.deck\.length\)/)
  assert.match(gameViewSource, /const handCards = computed\(/)
  assert.match(gameViewSource, /const drawCard = computed\(/)
  assert.match(gameViewSource, /gameState\.currentPlayer\.hand\.length >= 2/)
  assert.match(gameViewSource, /:hand-cards="handCards"/)
  assert.match(gameViewSource, /:draw-card="drawCard"/)
  assert.match(gameViewSource, /@draw-complete="handleDrawComplete"/)

  assert.match(gameStageSource, /handCards:/)
  assert.match(gameStageSource, /drawCard:/)
  assert.match(gameStageSource, /import PlayerHand from '\.\/PlayerHand\.vue'/)
  assert.match(gameStageSource, /<PlayerHand/)
})

test('discard pile reuses the layered game card', async () => {
  const source = await readSource('src/components/game/TableCardPiles.vue')

  assert.match(source, /import GameCard from '\.\/GameCard\.vue'/)
  assert.match(source, /discardCards:/)
  assert.match(source, /normalizedDiscardCards/)
  assert.match(source, /topDiscardCard/)
  assert.match(source, /<GameCard/)
  assert.match(source, /:background-url="card\.backgroundUrl"/)
  assert.match(source, /:frame-url="card\.frameUrl"/)
})

test('player hand exposes card pointer interaction without owning play logic', async () => {
  const source = await readSource('src/components/game/PlayerHand.vue')

  assert.match(source, /defineEmits\(\['card-pointerdown'\]\)/)
  assert.match(source, /role="button"/)
  assert.match(source, /tabindex="0"/)
  assert.match(source, /@pointerdown="emit\('card-pointerdown', card, \$event\)"/)
  assert.match(source, /draggingCardId:/)
  assert.match(source, /game-card-arrangement--dragging/)
  assert.doesNotMatch(source, /gsap|<button|@click|@mouseenter|@mouseleave|draggable|:hover/)
  assert.doesNotMatch(source, /rounded-/)
})

test('player hand exposes a draw target and renders its final cards from data', async () => {
  const source = await readSource('src/components/game/PlayerHand.vue')

  assert.doesNotMatch(source, /previewCard:/)
  assert.match(source, /const drawTarget = ref\(null\)/)
  assert.match(source, /function prepareDrawTarget\(\)/)
  assert.match(source, /function getDrawTargetRect\(\)/)
  assert.match(source, /function finishDraw\(\)/)
  assert.match(source, /defineExpose\(\{/)
  assert.match(source, /v-for="card in cards"/)
  assert.match(source, /player-hand--drawing/)
})
