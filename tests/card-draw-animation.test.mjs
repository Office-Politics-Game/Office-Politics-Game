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

  assert.match(source, /import CardDrawAnimation from ["']\.\.\/animations\/CardDrawAnimation\.vue["']/)
  assert.match(source, /const isDrawAnimating = ref\(false\)/)
  assert.match(source, /drawPlayerId:/)
  assert.match(source, /currentPlayerId:/)
  assert.match(source, /const playerSeats = ref\(null\)/)
  assert.match(source, /const resolvedCurrentPlayerId = computed\(/)
  assert.match(source, /canDraw:/)
  assert.match(source, /function requestDraw\(\)/)
  assert.match(source, /emit\(["']draw-request["']\)/)
  assert.match(source, /async function playDrawAnimation\(card, playerId = null\)/)
  assert.match(source, /getDrawRect\(["']source["']\)/)
  assert.match(source, /prepareDrawTarget\(\)/)
  assert.match(source, /animationRects\.getDrawRect\(["']target["']\)/)
  assert.match(source, /animationRects\.getDrawRect\(["']target["'], activeDrawPlayerId\)/)
  assert.match(source, /selfDraw\(\{/)
  assert.match(source, /othersDraw\(\{/)
  assert.match(source, /if \(shouldDrawSelf && !card\)/)
  assert.match(source, /activeDrawCard\.value = card \? \{ \.\.\.card \} : null/)
  assert.doesNotMatch(source, /props\.drawCard/)
  assert.doesNotMatch(source, /emit\('draw-complete'/)
  assert.match(source, /finishDraw\(\)/)
  assert.match(source, /:is-draw-disabled="isDeckDrawDisabled"/)
  assert.match(source, /@draw="requestDraw"/)
  assert.match(source, /<PlayerSeats[\s\S]*ref="playerSeats"/)
  assert.match(source, /<CardDrawAnimation[\s\S]*:card="activeDrawCard"/)
})

test('game view sends draws through socket actions and keeps REST fallback', async () => {
  const source = await readSource('src/views/GameView.vue')
  const handlerSource = source.slice(
    source.indexOf('async function handleDrawRequest'),
    source.indexOf('async function handlePlayCard'),
  )

  assert.match(source, /const gameStage = ref\(null\)/)
  assert.match(source, /const isDrawing = ref\(false\)/)
  assert.match(source, /const canDraw = computed\(/)
  assert.match(handlerSource, /if \([\s\S]*isDrawing\.value[\s\S]*!canDraw\.value/)
  assert.match(handlerSource, /isDrawing\.value = true/)
  assert.match(handlerSource, /await emitWithAck\('game:draw-card'/)
  assert.match(handlerSource, /await drawGameCard\(/)
  assert.match(handlerSource, /data\?\.drawnCard \?\? data\?\.card/)
  assert.match(handlerSource, /normalizeCard\(rawDrawnCard\)/)
  assert.match(handlerSource, /await gameStage\.value\.playDrawAnimation\(/)
  assert.match(handlerSource, /pendingSocketGameState\.value = data\.state/)
  assert.match(handlerSource, /flushPendingSocketGameState\(\)/)
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
  assert.doesNotMatch(source, /id:\s*'draw-preview'/)
  assert.doesNotMatch(source, /backgroundUrlKey:\s*'intern'/)
  assert.match(source, /ref="gameStage"/)
  assert.match(source, /:can-draw="canDraw"/)
  assert.match(source, /@draw-request="handleDrawRequest"/)
})

test('table card piles expose the current deck rectangle', async () => {
  const source = await readSource('src/components/game/ui/TableCardPiles.vue')

  assert.match(source, /function getDeckRect\(\)/)
  assert.match(source, /deckPile\.value\?\.getBoundingClientRect\(\)/)
  assert.match(source, /defineExpose\(\{\s*getDeckRect/)
})
