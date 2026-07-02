import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('game animation rects centralizes live DOM rect providers and geometry helpers', async () => {
  const source = await readSource(
    'src/composables/useGameAnimationRects.js',
  )

  assert.match(source, /export function useGameAnimationRects/)
  assert.match(source, /function getDrawRect\(kind, playerId = null\)/)
  assert.match(source, /function getPlayRect\(kind\)/)
  assert.match(source, /getHandRect/)
  assert.match(source, /getHandTargetRect/)
  assert.match(source, /getDeckRect/)
  assert.match(source, /getDiscardRect/)
  assert.match(source, /return getDrawRect\('source'\)/)
  assert.match(source, /return getDrawRect\('target', playerId\)/)
  assert.match(source, /return getPlayRect\('discard'\)/)
  assert.match(source, /return getPlayRect\('zone'\)/)
  assert.match(source, /window\.innerWidth \/ 2/)
  assert.match(source, /window\.innerHeight \/ 2/)
  assert.match(source, /function getEffectCardHeight/)
  assert.match(source, /function getRectCenter/)
  assert.match(source, /function getTranslation/)
  assert.match(source, /function createFixedCardRect/)
  assert.match(source, /function rectToFixedStyle/)
  assert.match(source, /function getScaleForHeight/)
  assert.match(source, /function isSelfPlayer/)
})

test('all four card animations use the shared geometry helpers', async () => {
  for (const filename of [
    'InternAnimation.vue',
    'CleanerAnimation.vue',
    'ManagerAnimation.vue',
    'PMAnimation.vue',
  ]) {
    const source = await readSource(`src/components/game/animations/${filename}`)
    assert.match(source, /@\/composables\/useGameAnimationRects/)
    assert.match(source, /createFixedCardRect/)
    assert.match(source, /getEffectCardHeight/)
    assert.match(source, /rectToFixedStyle/)
    assert.match(source, /getScaleForHeight/)
  }

  const stage = await readSource('src/components/game/ui/GameStage.vue')
  assert.match(stage, /useGameAnimationRects/)
  assert.match(stage, /const animationRects = useGameAnimationRects/)
  assert.match(stage, /animationRects\.getDrawRect\(["']source["']\)/)
  assert.match(stage, /animationRects\.getDrawRect\(["']target["']/)
  assert.match(stage, /animationRects\.getPlayRect\(["']discard["']\)/)
  assert.match(stage, /animationRects\.getPlayRect\(["']zone["']\)/)
  assert.match(stage, /animationRects\.isSelfPlayer/)
})
