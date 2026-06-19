import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('cardplay test models card effects for avatar target selection and intern guesses', async () => {
  const source = await readSource('src/views/CardPlayTestView.vue')

  assert.match(source, /rank:\s*1[\s\S]*effectKey:\s*'guess'/)
  assert.match(source, /rank:\s*2[\s\S]*targetMode:\s*'opponent'/)
  assert.match(source, /rank:\s*4[\s\S]*targetMode:\s*'none'/)
  assert.match(source, /rank:\s*5[\s\S]*targetMode:\s*'anyPlayer'/)
  assert.match(source, /const guessOptions = \[/)
  assert.doesNotMatch(source, /guessOptions[\s\S]*rank:\s*1/)
})

test('cardplay test keeps played card pending until confirm or cancel', async () => {
  const source = await readSource('src/views/CardPlayTestView.vue')

  assert.match(source, /const pendingPlay = ref\(null\)/)
  assert.match(source, /const selectedTargetPlayerId = ref\(null\)/)
  assert.match(source, /const selectedGuessRank = ref\(null\)/)
  assert.match(source, /function preparePendingPlay\(/)
  assert.match(source, /function confirmPendingPlay\(/)
  assert.match(source, /function cancelPendingPlay\(/)
  assert.match(source, /canConfirmPendingPlay/)
  assert.match(source, /playerHandCards\.value = playerHandCards\.value\.filter/)
})

test('cardplay test renders clickable avatar targets and guess options', async () => {
  const source = await readSource('src/views/CardPlayTestView.vue')

  assert.match(source, /cardplay-test__avatar-targets/)
  assert.match(source, /selectableTargetPlayers/)
  assert.match(source, /selectTargetPlayer\(player\.id\)/)
  assert.match(source, /cardplay-test__avatar-target--selected/)
  assert.match(source, /cardplay-test__guess-options/)
  assert.match(source, /selectGuess\(option\.rank\)/)
  assert.match(source, /:disabled="!canConfirmPendingPlay"/)
})
