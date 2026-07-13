import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('protection success label stays for 1.5 seconds without changing aura geometry', async () => {
  const source = await readSource('src/components/game/animations/ProtectionAura.vue')

  assert.match(source, /showSuccessLabel:[\s\S]*type: Boolean,[\s\S]*default: false/)
  assert.match(source, /const SUCCESS_LABEL_DURATION_MS = 1500/)
  assert.match(source, /isSuccessLabelVisible\.value = props\.showSuccessLabel/)
  assert.match(source, /successLabelTimeout = window\.setTimeout[\s\S]*SUCCESS_LABEL_DURATION_MS/)
  assert.match(source, /window\.clearTimeout\(successLabelTimeout\)/)
  assert.match(source, /aria-label="特休假"/)
  assert.match(source, /<span>特<\/span><span>休<\/span><span>假<\/span>/)
  assert.match(source, /animation: protectionSuccessLabel 1\.5s ease-out forwards/)
  assert.match(source, /color: #fff/)
  assert.match(source, /rgba\(70, 70, 70, 0\.92\)/)
  assert.match(source, /rgba\(70, 70, 70, 0\.72\)/)
  assert.doesNotMatch(source, /rgba\(134, 179, 224, 0\.92\)/)
  assert.doesNotMatch(source, /rgba\(0, 70, 244, 0\.58\)/)
  assert.match(source, /isSuccessFlashing\.value = false;[\s\S]*}, 760\)/)
  assert.match(source, /--protection-aura-left/)
  assert.match(source, /--protection-aura-top/)
  assert.match(source, /--protection-aura-width/)
  assert.match(source, /--protection-aura-height/)
})

test('side labels are vertical and all positions counter-rotate toward the table center', async () => {
  const source = await readSource('src/components/game/animations/ProtectionAura.vue')

  assert.match(source, /protection-aura--left[\s\S]*--protection-label-counter-rotation: -90deg/)
  assert.match(source, /protection-aura--right[\s\S]*--protection-label-counter-rotation: 90deg/)
  assert.match(source, /protection-aura--top[\s\S]*--protection-label-counter-rotation: -180deg/)
  assert.match(source, /protection-aura--bottom[\s\S]*--protection-label-counter-rotation: 0deg/)
  assert.match(source, /protection-aura--left \.protection-aura__success-label,[\s\S]*protection-aura--right \.protection-aura__success-label[\s\S]*flex-direction: column/)
  assert.match(source, /top: -48px/)
  assert.match(source, /@media \(min-width: 1024px\)[\s\S]*top: -64px/)
})

test('only blocked non-senior effects opt into the success label', async () => {
  const stage = await readSource('src/components/game/ui/GameStage.vue')
  const effectAnimation = await readSource('src/composables/useGameStageEffectAnimation.js')
  const demo = await readSource('src/views/CardPlayTestView.vue')

  assert.match(stage, /Boolean\(activeEffectResult\.sourceType\) && activeEffectResult\.sourceType !== 'senior'/)
  assert.match(effectAnimation, /nextResult\.type === "protection" \? 1600 : 8000/)
  assert.match(demo, /const showProtectionSuccessLabel = ref\(false\)/)
  assert.match(demo, /showProtectionSuccessLabel\.value = true[\s\S]*protectionSuccessKey\.value \+= 1/)
  assert.match(demo, /:show-success-label="showProtectionSuccessLabel"/)
})
