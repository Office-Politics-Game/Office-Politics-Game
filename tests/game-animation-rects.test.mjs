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
  assert.match(source, /getHandRect/)
  assert.match(source, /getHandTargetRect/)
  assert.match(source, /getDeckRect/)
  assert.match(source, /getDiscardRect/)
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
    const source = await readSource(`src/components/game/${filename}`)
    assert.match(source, /@\/composables\/useGameAnimationRects/)
    assert.match(source, /createFixedCardRect/)
    assert.match(source, /getEffectCardHeight/)
    assert.match(source, /rectToFixedStyle/)
    assert.match(source, /getScaleForHeight/)
  }

  const stage = await readSource('src/components/game/GameStage.vue')
  assert.match(stage, /useGameAnimationRects/)
  assert.match(stage, /const animationRects = useGameAnimationRects/)
  assert.match(stage, /animationRects\.getPlayerHandRect/)
  assert.match(stage, /animationRects\.getDiscardRect/)
  assert.match(stage, /animationRects\.getDeckRect/)
  assert.match(stage, /animationRects\.isSelfPlayer/)
})
