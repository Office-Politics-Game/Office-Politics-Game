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

test('game view derives deck count, draw eligibility, and hand cards from game state', async () => {
  const gameViewSource = await readSource('src/views/GameView.vue')
  const gameStageSource = await readSource('src/components/game/GameStage.vue')

  assert.match(gameViewSource, /const deckCount = computed\(\(\) => gameState\.value\?\.deckCount \?\? 0\)/)
  assert.match(gameViewSource, /const handCards = computed\(/)
  assert.match(gameViewSource, /selfPlayer\.value\?\.hand/)
  assert.match(gameViewSource, /const canDraw = computed\(/)
  assert.match(gameViewSource, /handCards\.value\.length < 2/)
  assert.match(gameViewSource, /:hand-cards="handCards"/)
  assert.match(gameViewSource, /:can-draw="canDraw"/)
  assert.match(gameViewSource, /@draw-request="handleDrawRequest"/)

  assert.match(gameStageSource, /handCards:/)
  assert.match(gameStageSource, /canDraw:/)
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
  assert.match(source, /:tabindex="isCardDisabled\(card\) \? -1 : 0"/)
  assert.match(source, /@pointerdown="!isCardDisabled\(card\) && emit\('card-pointerdown', card, \$event\)"/)
  assert.match(source, /draggingCardId:/)
  assert.match(source, /game-card-arrangement--dragging/)
  assert.doesNotMatch(source, /gsap|<button|@click|@mouseenter|@mouseleave|draggable/)
  assert.doesNotMatch(source, /rounded-/)
})

test('player hand supports shared hover message and prevents guarded pointer emit', async () => {
  const playerHandSource = await readSource('src/components/game/PlayerHand.vue')
  const gameStageSource = await readSource('src/components/game/GameStage.vue')
  const hoverHintSource = await readSource('src/components/game/HoverBlockHint.vue')

  assert.match(playerHandSource, /import HoverBlockHint from '\.\/HoverBlockHint\.vue'/)
  assert.match(playerHandSource, /isInteractionDisabled:/)
  assert.match(playerHandSource, /disabledMessage:/)
  assert.match(playerHandSource, /props\.isInteractionDisabled \|\| props\.disabledCardIds\.includes\(card\.id\)/)
  assert.match(playerHandSource, /game-card-arrangement--interaction-disabled/)
  assert.match(playerHandSource, /'hover-block-hint-target': props\.isInteractionDisabled/)
  assert.match(playerHandSource, /<HoverBlockHint/)
  assert.match(playerHandSource, /:message="props\.disabledMessage"/)
  assert.doesNotMatch(playerHandSource, /game-card-arrangement__disabled-message/)
  assert.doesNotMatch(playerHandSource, /:title=/)
  assert.match(playerHandSource, /@pointerdown="!isCardDisabled\(card\) && emit\('card-pointerdown', card, \$event\)"/)
  assert.match(playerHandSource, /\.game-card-arrangement--rule-disabled,[\s\S]*cursor: not-allowed/)
  assert.match(playerHandSource, /\.game-card-arrangement--interaction-disabled,[\s\S]*cursor: default/)

  assert.match(hoverHintSource, /message:/)
  assert.match(hoverHintSource, /class="hover-block-hint"/)
  assert.match(hoverHintSource, /display:\s*none/)
  assert.match(hoverHintSource, /:global\(\.hover-block-hint-target:hover \.hover-block-hint\)\s*\{[\s\S]*display:\s*block/)
  assert.match(hoverHintSource, /background:\s*rgba\(15,\s*23,\s*42/)
  assert.match(hoverHintSource, /color:\s*#f8fafc/)
  assert.match(hoverHintSource, /padding:\s*4px 8px/)
  assert.doesNotMatch(hoverHintSource, /transition|animation|box-shadow|backdrop|modal/i)

  assert.match(gameStageSource, /const isHandDrawRequired = computed\(\(\) => props\.canDraw\)/)
  assert.match(gameStageSource, /isPlayInteractionLocked\.value \|\| isHandDrawRequired\.value/)
  assert.match(gameStageSource, /isHandDrawRequired\.value \? '請先抽下一張牌' : ''/)
  assert.match(gameStageSource, /:is-interaction-disabled="isHandDrawRequired"/)
  assert.match(gameStageSource, /:disabled-message="handDisabledMessage"/)
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
