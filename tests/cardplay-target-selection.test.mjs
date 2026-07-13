import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('cardplay test models card effects for avatar target selection and intern guesses', async () => {
  const source = await readSource('src/constants/cardAssets.js')
  const mockStateSource = await readSource('src/mocks/mockGameState.js')
  const gameStageSource = await readSource('src/components/game/ui/GameStage.vue')

  assert.match(mockStateSource, /rank:\s*1[\s\S]*effectKey:\s*['"]guess['"]/)
  assert.match(source, /cleaner:[\s\S]*targetMode:\s*['"]opponent['"]/)
  assert.match(source, /senior:[\s\S]*targetMode:\s*['"]none['"]/)
  assert.match(source, /pm:[\s\S]*targetMode:\s*['"]anyPlayer['"]/)
  assert.match(source, /1:\s*['"]intern['"]/)
  assert.match(source, /2:\s*['"]cleaner['"]/)
  assert.match(source, /4:\s*['"]senior['"]/)
  assert.match(source, /5:\s*['"]pm['"]/)
  assert.match(gameStageSource, /const guessOptions = \[/)
  assert.doesNotMatch(gameStageSource, /guessOptions[\s\S]*rank:\s*1/)
})

test('cardplay test keeps played card pending until confirm or cancel', async () => {
  const source = await readSource('src/composables/useGameStageCardPlay.js')

  assert.match(source, /const pendingPlay = ref\(null\)/)
  assert.match(source, /const selectedTargetPlayerId = ref\(null\)/)
  assert.match(source, /const selectedGuessRank = ref\(null\)/)
  assert.match(source, /function preparePendingPlay\(/)
  assert.match(source, /function confirmPendingPlay\(/)
  assert.match(source, /function cancelPendingPlay\(/)
  assert.match(source, /canConfirmPendingPlay/)
  assert.match(source, /visibleHandCards/)
  assert.match(source, /pendingCardId/)
})

test('cardplay test uses the original player seats as target choices', async () => {
  const source = await readSource('src/components/game/ui/GameStage.vue')
  const cardPlaySource = await readSource('src/composables/useGameStageCardPlay.js')
  const confirmPanelSource = await readSource('src/components/game/ui/CardPlayConfirmPanel.vue')

  assert.doesNotMatch(source, /cardplay-test__avatar-targets/)
  assert.doesNotMatch(source, /cardplay-test__avatar-target/)
  assert.match(cardPlaySource, /selectableTargetPlayerIds/)
  assert.match(source, /:is-target-selection-active="\s*Boolean\(pendingPlay\) && pendingRequiresTarget\s*"/)
  assert.match(source, /:selectable-player-ids="selectableTargetPlayerIds"/)
  assert.match(source, /:selected-target-player-id="selectedTargetPlayerId"/)
  assert.match(source, /@target-select="selectTargetPlayer"/)
  assert.match(source, /v-if="pendingPlay"[\s\S]*class="play-target-backdrop"/)
  assert.match(source, /\.play-target-backdrop \{[\s\S]*z-index: 44[\s\S]*background: rgba\(0, 0, 0, 0\.42\)[\s\S]*backdrop-filter: blur\(5px\)/)
  assert.match(confirmPanelSource, /<CardGuessSelector/)
  assert.match(confirmPanelSource, /@select="emit\('select-guess', \$event\)"/)
  assert.match(confirmPanelSource, /:disabled="!canConfirmPendingPlay"/)
  assert.match(confirmPanelSource, /\.play-confirm-panel \{[\s\S]*left: 50%[\s\S]*top: 50%[\s\S]*transform: translate\(-50%, -50%\)/)
  assert.match(confirmPanelSource, /\.play-confirm-panel \{[\s\S]*max-height: min\(420px, calc\(100dvh - 224px\)\)[\s\S]*overflow: auto/)
})
