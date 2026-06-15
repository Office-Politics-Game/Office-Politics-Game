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

test('game view provides exactly two default hand cards through the stage', async () => {
  const gameViewSource = await readSource('src/views/GameView.vue')
  const gameStageSource = await readSource('src/components/game/GameStage.vue')

  assert.match(gameViewSource, /card-bg-ceo\.webp/)
  assert.match(gameViewSource, /card-frame-ceo\.webp/)
  assert.match(gameViewSource, /card-bg-advisor\.webp/)
  assert.match(gameViewSource, /card-frame-advisor\.webp/)
  assert.match(gameViewSource, /const handCards = \[/)
  assert.equal((gameViewSource.match(/id: 'hand-/g) ?? []).length, 2)
  assert.match(gameViewSource, /:hand-cards="handCards"/)

  assert.match(gameStageSource, /handCards:/)
  assert.match(gameStageSource, /import PlayerHand from '\.\/PlayerHand\.vue'/)
  assert.match(gameStageSource, /<PlayerHand :cards="handCards"/)
})

test('discard pile reuses the layered game card', async () => {
  const source = await readSource('src/components/game/TableCardPiles.vue')

  assert.match(source, /import GameCard from '\.\/GameCard\.vue'/)
  assert.match(source, /<GameCard/)
  assert.match(source, /:background-url="discardCard\.backgroundUrl"/)
  assert.match(source, /:frame-url="discardCard\.frameUrl"/)
})

test('player hand remains static and non-interactive', async () => {
  const source = await readSource('src/components/game/PlayerHand.vue')

  assert.doesNotMatch(source, /gsap|<button|@click|@mouseenter|@mouseleave|tabindex|draggable|:hover/)
  assert.doesNotMatch(source, /rounded-/)
})
