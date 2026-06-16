import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('card draw animation renders card back and front faces', async () => {
  const componentUrl = new URL(
    '../src/components/game/CardDrawAnimation.vue',
    import.meta.url,
  )

  await access(componentUrl)
  const source = await readFile(componentUrl, 'utf8')

  assert.match(source, /card-bg-back\.webp/)
  assert.match(source, /card-draw__face--back/)
  assert.match(source, /card-draw__face--front/)
  assert.match(source, /<GameCard/)
  assert.match(source, /rotationY/)
  assert.match(source, /backface-visibility:\s*hidden/)
})

test('card draw animation uses a scoped GSAP timeline with cleanup and reduced motion', async () => {
  const source = await readSource('src/components/game/CardDrawAnimation.vue')

  assert.match(source, /import \{ gsap \} from 'gsap'/)
  assert.match(source, /gsap\.timeline\(/)
  assert.match(source, /function play\(/)
  assert.match(source, /prefers-reduced-motion:\s*reduce/)
  assert.match(source, /onUnmounted\(/)
  assert.match(source, /timeline\?\.kill\(\)/)
  assert.match(source, /defineExpose\(\{\s*play/)
  assert.match(source, /autoAlpha/)
})

test('card stays face down while flying and flips only after reaching the hand', async () => {
  const source = await readSource('src/components/game/CardDrawAnimation.vue')
  const fullMotionSource = source.slice(source.indexOf('function playFullMotion'))

  assert.match(
    fullMotionSource,
    /x:\s*endX[\s\S]*rotationY:\s*180[\s\S]*\.call\(onLanded\)/,
  )
})

test('game stage coordinates deck origin, hand target, data commit, and replay locking', async () => {
  const source = await readSource('src/components/game/GameStage.vue')

  assert.match(source, /import CardDrawAnimation from '\.\/CardDrawAnimation\.vue'/)
  assert.match(source, /const isDrawAnimating = ref\(false\)/)
  assert.match(source, /async function playDrawAnimation\(\)/)
  assert.match(source, /getDeckRect\(\)/)
  assert.match(source, /prepareDrawTarget\(\)/)
  assert.match(source, /getDrawTargetRect\(\)/)
  assert.match(source, /emit\('draw-complete', activeDrawCard\.value\)/)
  assert.match(source, /finishDraw\(\)/)
  assert.match(source, /:is-draw-disabled="isDrawAnimating \|\| !drawCard"/)
  assert.match(source, /@draw="playDrawAnimation"/)
  assert.match(source, /<CardDrawAnimation/)
})

test('table card piles expose the current deck rectangle', async () => {
  const source = await readSource('src/components/game/TableCardPiles.vue')

  assert.match(source, /function getDeckRect\(\)/)
  assert.match(source, /deckPile\.value\?\.getBoundingClientRect\(\)/)
  assert.match(source, /defineExpose\(\{\s*getDeckRect/)
})
