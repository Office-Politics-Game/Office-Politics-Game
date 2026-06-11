import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('table card piles use scoped GSAP pointer tilt with lifecycle cleanup', async () => {
  const source = await readSource('src/components/game/TableCardPiles.vue')

  assert.match(source, /import \{ gsap \} from 'gsap'/)
  assert.match(source, /import \{ onMounted, onUnmounted, ref \} from 'vue'/)
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
