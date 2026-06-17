import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('game stage imports and renders the table card piles', async () => {
  const source = await readSource('src/components/game/GameStage.vue')

  assert.match(source, /import TableCardPiles from '\.\/TableCardPiles\.vue'/)
  assert.match(source, /<TableCardPiles/)
  assert.match(source, /ref="tableCardPiles"/)
  assert.match(source, /:deck-count="deckCount"/)
  assert.match(source, /:discard-card="discardCard"/)
  assert.match(source, /:is-draw-disabled="isDrawAnimating \|\| !drawCard"/)
  assert.match(source, /@draw="playDrawAnimation"/)
})

test('table card piles use scoped GSAP pointer tilt with lifecycle cleanup', async () => {
  const source = await readSource('src/components/game/TableCardPiles.vue')

  assert.match(source, /import \{ gsap \} from 'gsap'/)
  for (const vueImport of ['onMounted', 'onUnmounted', 'ref']) {
    assert.match(source, new RegExp(`\\b${vueImport}\\b`))
  }
  assert.match(source, /const pileArea = ref\(null\)/)
  assert.match(source, /const deckPile = ref\(null\)/)
  assert.match(source, /const discardPile = ref\(null\)/)
  assert.match(source, /gsap\.context\(/)
  assert.match(source, /gsap\.matchMedia\(\)/)
  assert.match(source, /\(pointer: fine\) and \(prefers-reduced-motion: no-preference\)/)
  assert.match(source, /gsap\.quickTo\(/)
  assert.match(source, /pointermove/)
  assert.match(source, /pointerleave/)
  assert.match(source, /onUnmounted\(/)
  assert.match(source, /\.revert\(\)/)
})

test('deck and discard piles keep distinct tabletop rotations and shadows', async () => {
  const source = await readSource('src/components/game/TableCardPiles.vue')

  assert.match(source, /ref="deckPile"/)
  assert.match(source, /ref="discardPile"/)
  assert.match(source, /const TABLE_ROTATION_X = 58/)
  assert.match(source, /rotationX:\s*TABLE_ROTATION_X/)
  assert.match(source, /moveY\(TABLE_ROTATION_X \+ offsetY \* -4\)/)
  assert.match(source, /moveY\(TABLE_ROTATION_X\)/)
  assert.match(source, /rotationZ:\s*-2/)
  assert.match(source, /rotationZ:\s*2/)
  assert.equal((source.match(/class="table-card-pile/g) ?? []).length, 2)
  assert.match(source, /\.table-card-pile::after/)
  assert.match(source, /rotateX\(58deg\) rotateZ\(-2deg\)/)
  assert.match(source, /rotateX\(58deg\) rotateZ\(2deg\)/)
  assert.match(source, /transform-style:\s*preserve-3d/)
  assert.match(source, /will-change:\s*transform/)
})

test('deck pile is an accessible draw button with disabled and focus states', async () => {
  const source = await readSource('src/components/game/TableCardPiles.vue')

  assert.match(source, /isDrawDisabled:/)
  assert.match(source, /defineEmits\(\['draw'\]\)/)
  assert.match(source, /<button/)
  assert.match(source, /type="button"/)
  assert.match(source, /:disabled="isDeckInteractionDisabled"/)
  assert.match(source, /:aria-label="`從牌庫抽牌，剩餘 \$\{deckCount\} 張`"/)
  assert.match(source, /\.table-card-pile--deck:focus-visible/)
  assert.match(source, /cursor:\s*pointer/)
  assert.match(source, /border-radius:\s*0/)
})

test('deck click feedback emits draw after a guarded GSAP timeline', async () => {
  const source = await readSource('src/components/game/TableCardPiles.vue')

  assert.match(source, /const isDeckPressing = ref\(false\)/)
  assert.match(source, /function handleDeckDraw\(\)/)
  assert.match(source, /if \(isDeckInteractionDisabled\.value/)
  assert.match(source, /pressTimeline = gsap\.timeline\(/)
  assert.match(source, /scale:\s*0\.96/)
  assert.match(source, /y:\s*5/)
  assert.match(source, /ease:\s*'back\.out/)
  assert.match(source, /emit\('draw'\)/)
  assert.match(source, /prefers-reduced-motion:\s*reduce/)
  assert.match(source, /pressTimeline\?\.kill\(\)/)
})
