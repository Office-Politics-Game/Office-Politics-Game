import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('card guess selector renders rank choices and excludes intern guesses', async () => {
  const componentUrl = new URL(
    '../src/components/game/CardGuessSelector.vue',
    import.meta.url,
  )

  await access(componentUrl)
  const source = await readFile(componentUrl, 'utf8')

  assert.match(source, /guessOptions:/)
  assert.match(source, /excludedRanks:/)
  assert.match(source, /availableGuessOptions/)
  assert.match(source, /!excludedRankSet\.value\.has\(option\.rank\)/)
  assert.match(source, /emit\('select', option\.rank\)/)
  assert.match(source, /card-guess-selector__option--selected/)
  assert.doesNotMatch(source, /rounded-/)
})

test('player seats support avatar target selection without changing seat layout', async () => {
  const source = await readSource('src/components/game/PlayerSeats.vue')

  assert.match(source, /isTargetSelectionActive:/)
  assert.match(source, /selectablePlayerIds:/)
  assert.match(source, /selectedTargetPlayerId:/)
  assert.match(source, /defineEmits\(\['target-select'\]\)/)
  assert.match(source, /selectablePlayerIdSet/)
  assert.match(source, /player-seats__target-button/)
  assert.match(source, /player-seats__target-button--selected/)
  assert.match(source, /emit\('target-select', player\.id\)/)
})

test('game stage coordinates pending play target and guess confirmation', async () => {
  const source = await readSource('src/components/game/GameStage.vue')

  assert.match(source, /import CardGuessSelector from '\.\/CardGuessSelector\.vue'/)
  assert.match(source, /const pendingPlay = ref\(null\)/)
  assert.match(source, /const selectedTargetPlayerId = ref\(null\)/)
  assert.match(source, /const selectedGuessRank = ref\(null\)/)
  assert.match(source, /selectableTargetPlayerIds/)
  assert.match(source, /function confirmPendingPlay\(\)/)
  assert.match(source, /function cancelPendingPlay\(\)/)
  assert.match(source, /emit\('play-card'/)
  assert.match(source, /<CardGuessSelector/)
  assert.match(source, /@target-select="selectTargetPlayer"/)
  assert.match(source, /:disabled="!canConfirmPendingPlay"/)
})
