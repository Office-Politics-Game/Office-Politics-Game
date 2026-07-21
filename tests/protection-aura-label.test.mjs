import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('protection label stays visible with the aura without changing aura geometry', async () => {
  const source = await readSource('src/components/game/animations/ProtectionAura.vue')

  assert.doesNotMatch(source, /showSuccessLabel/)
  assert.match(source, /showLabel:/)
  assert.doesNotMatch(source, /SUCCESS_LABEL_DURATION_MS/)
  assert.doesNotMatch(source, /isSuccessLabelVisible/)
  assert.doesNotMatch(source, /successLabelTimeout/)
  assert.match(source, /aria-label="免疫狀態"/)
  assert.match(source, /<span>免<\/span><span>疫<\/span><span>狀<\/span><span>態<\/span>/)
  assert.doesNotMatch(source, /animation: protectionSuccessLabel/)
  assert.match(source, /color: #fff/)
  assert.match(source, /rgba\(0, 19, 50, 0\.95\)/)
  assert.match(source, /filter: drop-shadow\(0 3px 5px rgba\(0, 19, 50, 0\.76\)\);/)
  assert.doesNotMatch(source, /rgba\(134, 179, 224, 0\.92\)/)
  assert.doesNotMatch(source, /rgba\(0, 70, 244, 0\.58\)/)
  assert.match(source, /isSuccessFlashing\.value = false;[\s\S]*}, 760\)/)
  assert.match(source, /--protection-aura-left/)
  assert.match(source, /--protection-aura-top/)
  assert.match(source, /--protection-aura-width/)
  assert.match(source, /--protection-aura-height/)
  assert.match(source, /opacity: 0\.82/)
  assert.match(source, /opacity: 0\.96/)
})

test('side labels are vertical and all positions counter-rotate toward the table center', async () => {
  const source = await readSource('src/components/game/animations/ProtectionAura.vue')

  assert.match(source, /protection-aura--left[\s\S]*--protection-label-counter-rotation: -90deg/)
  assert.match(source, /protection-aura--right[\s\S]*--protection-label-counter-rotation: 90deg/)
  assert.match(source, /protection-aura--top[\s\S]*--protection-label-counter-rotation: -180deg/)
  assert.match(source, /protection-aura--bottom[\s\S]*--protection-label-counter-rotation: 0deg/)
  assert.match(source, /protection-aura--left \.protection-aura__success-label,[\s\S]*protection-aura--right \.protection-aura__success-label[\s\S]*flex-direction: column/)
  assert.match(source, /top: -32px/)
  assert.match(source, /@media \(min-width: 1024px\)[\s\S]*top: -44px/)
  assert.match(source, /@media \(max-width: 767px\)[\s\S]*\.protection-aura--anchored \.protection-aura__success-label-anchor \{[\s\S]*display: none;/)
})

test('protection flash is separate from the always-visible label', async () => {
  const stage = await readSource('src/components/game/ui/GameStage.vue')
  const effectAnimation = await readSource('src/composables/useGameStageEffectAnimation.js')
  const demo = await readSource('src/views/CardPlayTestView.vue')

  assert.doesNotMatch(stage, /show-success-label/)
  assert.match(stage, /:show-label="!player\.isCurrentPlayer"/)
  assert.match(stage, /:show-label="!activeProtectionAnimationPlayer\.isCurrentPlayer"/)
  assert.match(effectAnimation, /nextResult\.type === "protection" \? 1600 : 8000/)
  assert.doesNotMatch(demo, /showProtectionSuccessLabel/)
  assert.doesNotMatch(demo, /show-success-label/)
  assert.match(demo, /protectionSuccessKey\.value \+= 1/)
})
