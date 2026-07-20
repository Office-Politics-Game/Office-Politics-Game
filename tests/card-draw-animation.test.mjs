import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('card draw animation renders card back and front faces', async () => {
  const componentUrl = new URL(
    '../src/components/game/animations/CardDrawAnimation.vue',
    import.meta.url,
  )

  await access(componentUrl)
  const source = await readFile(componentUrl, 'utf8')
  const layerSource = await readSource('src/components/game/animations/EffectCardLayer.vue')

  assert.match(source, /import EffectCardLayer from '\.\/EffectCardLayer\.vue'/)
  assert.match(source, /<EffectCardLayer/)
  assert.match(source, /:card="card"/)
  assert.match(source, /:show-front="revealFront"/)
  assert.match(source, /front-flipped/)
  assert.match(layerSource, /card-bg-back\.webp/)
  assert.match(layerSource, /effect-card-layer__face--back/)
  assert.match(layerSource, /effect-card-layer__face--front/)
  assert.match(layerSource, /<GameCard/)
  assert.match(source, /rotationY/)
  assert.match(layerSource, /backface-visibility:\s*hidden/)
})

test('card draw animation uses a scoped GSAP timeline with cleanup and reduced motion', async () => {
  const source = await readSource('src/components/game/animations/CardDrawAnimation.vue')

  assert.match(source, /import \{ gsap \} from 'gsap'/)
  assert.match(source, /gsap\.timeline\(/)
  assert.match(source, /function selfDraw\(options\)/)
  assert.match(source, /function othersDraw\(options\)/)
  assert.match(source, /prefers-reduced-motion:\s*reduce/)
  assert.match(source, /onUnmounted\(/)
  assert.match(source, /timeline\?\.kill\(\)/)
  assert.match(source, /defineExpose\(\{[\s\S]*selfDraw[\s\S]*othersDraw[\s\S]*play/)
  assert.match(source, /autoAlpha/)
})

test('card draw animation tolerates missing landing callback and targets', async () => {
  const source = await readSource('src/components/game/animations/CardDrawAnimation.vue')

  assert.match(source, /onLanded = \(\) => \{\}/)
  assert.match(source, /!cardElement \|\| !flipperElement \|\| !targetRect/)
})

test('self draw stays face down while flying and flips only after reaching the hand', async () => {
  const source = await readSource('src/components/game/animations/CardDrawAnimation.vue')
  const fullMotionSource = source.slice(source.indexOf('function playFullMotion'))

  assert.match(source, /function selfDraw\(options\)[\s\S]*revealFront:\s*true/)
  assert.match(
    fullMotionSource,
    /x:\s*endX[\s\S]*if \(revealFront\)[\s\S]*rotationY:\s*180[\s\S]*\.call\(onLanded\)/,
  )
})

test('opponent draw keeps the card back visible for the whole flight', async () => {
  const source = await readSource('src/components/game/animations/CardDrawAnimation.vue')
  const layerSource = await readSource('src/components/game/animations/EffectCardLayer.vue')

  assert.match(source, /function othersDraw\(options\)[\s\S]*revealFront:\s*false/)
  assert.match(layerSource, /card-bg-back\.webp/)
  assert.match(layerSource, /v-show="showFront"/)
})

test('legacy play defaults to the self draw reveal behavior', async () => {
  const source = await readSource('src/components/game/animations/CardDrawAnimation.vue')

  assert.match(source, /const drawOptions = \{[\s\S]*revealFront: options\.revealFront \?\? true/)
  assert.match(source, /playReducedMotion\(drawOptions\) : playFullMotion\(drawOptions\)/)
})

test('game stage requests a draw and animates the real card supplied by its parent', async () => {
  const source = await readSource('src/components/game/ui/GameStage.vue')
  const cardPlaySource = await readSource('src/composables/useGameStageCardPlay.js')
  const drawSequenceSource = await readSource('src/composables/useGameStageDrawSequence.js')

  assert.match(source, /import CardDrawAnimation from ["']\.\.\/animations\/CardDrawAnimation\.vue["']/)
  assert.match(source, /const isDrawAnimating = ref\(false\)/)
  assert.match(source, /drawPlayerId:/)
  assert.match(source, /currentPlayerId:/)
  assert.match(source, /const playerSeats = ref\(null\)/)
  assert.match(source, /const resolvedCurrentPlayerId = computed\(/)
  assert.match(source, /canDraw:/)
  assert.match(cardPlaySource, /function requestDraw\(\)/)
  assert.match(cardPlaySource, /emit\(["']draw-request["']\)/)
  assert.match(drawSequenceSource, /async function playDrawAnimation\(card, playerId = null\)/)
  assert.match(drawSequenceSource, /getDrawRect\(["']source["']\)/)
  assert.match(drawSequenceSource, /prepareDrawTarget\(\)/)
  assert.match(drawSequenceSource, /animationRects\.getDrawRect\(["']target["']\)/)
  assert.match(drawSequenceSource, /animationRects\.getDrawRect\(["']target["'], activeDrawPlayerId\)/)
  assert.match(drawSequenceSource, /selfDraw\(\{/)
  assert.match(drawSequenceSource, /othersDraw\(\{/)
  assert.match(drawSequenceSource, /if \(shouldDrawSelf && !card\)/)
  assert.match(drawSequenceSource, /activeDrawCard\.value = card \? \{ \.\.\.card \} : null/)
  assert.doesNotMatch(source, /props\.drawCard/)
  assert.doesNotMatch(source, /emit\('draw-complete'/)
  assert.match(drawSequenceSource, /finishDraw\(\)/)
  assert.match(source, /:is-draw-disabled="isDeckDrawDisabled"/)
  assert.match(source, /@draw="requestDraw"/)
  assert.match(source, /<PlayerSeats[\s\S]*ref="playerSeats"/)
  assert.match(source, /<CardDrawAnimation[\s\S]*:card="activeDrawCard"/)
})

test('game view sends draws through socket actions and keeps REST fallback', async () => {
  const viewSource = await readSource('src/views/GameView.vue')
  const socketSource = await readSource(
    'src/composables/useGameSocketActions.js',
  )
  const handlerSource = socketSource.slice(
    socketSource.indexOf('async function handleDrawRequest'),
    socketSource.indexOf('async function handlePlayCard'),
  )

  assert.match(viewSource, /const gameStage = ref\(null\)/)
  assert.match(socketSource, /const isDrawing = ref\(false\)/)
  assert.match(viewSource, /canDraw: \(\) => canDraw\.value/)
  assert.match(handlerSource, /if \([\s\S]*isDrawing\.value[\s\S]*!canDraw\(\)/)
  assert.match(handlerSource, /isDrawing\.value = true/)
  assert.match(handlerSource, /await emitWithAck\('game:draw-card'/)
  assert.match(handlerSource, /applyGameStatePayload\(data\)/)
  assert.match(handlerSource, /await drawGameCard\(/)
  assert.match(handlerSource, /data\?\.drawnCard \?\? data\?\.card/)
  assert.match(handlerSource, /normalizeCard\(rawDrawnCard\)/)
  assert.match(handlerSource, /await gameStage\.value\.playDrawAnimation\(/)
  assert.match(socketSource, /pendingSocketGameStatesByActionId = new Map\(\)/)
  assert.match(socketSource, /completeSocketAction\(event\.id\)/)
  assert.match(handlerSource, /catch \(error\)[\s\S]*await refreshRoomState\(\)/)
  assert.match(handlerSource, /finally \{[\s\S]*isDrawing\.value = false/)
  assert.ok(
    handlerSource.indexOf("await emitWithAck('game:draw-card'") <
      handlerSource.indexOf('await drawGameCard('),
  )
  assert.ok(
    handlerSource.indexOf('await drawGameCard(') <
      handlerSource.indexOf('await gameStage.value.playDrawAnimation('),
  )
  assert.doesNotMatch(socketSource, /id:\s*'draw-preview'/)
  assert.doesNotMatch(socketSource, /backgroundUrlKey:\s*'intern'/)
  assert.match(viewSource, /ref="gameStage"/)
  assert.match(viewSource, /:can-draw="canDraw"/)
  assert.match(viewSource, /@draw-request="handleDrawRequest"/)
})

test('table card piles expose the current deck rectangle', async () => {
  const source = await readSource('src/components/game/ui/TableCardPiles.vue')

  assert.match(source, /function getDeckRect\(\)/)
  assert.match(source, /deckPile\.value\?\.getBoundingClientRect\(\)/)
  assert.match(source, /defineExpose\(\{\s*getDeckRect/)
})
