import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('game stage displays a round start notice with FlyInTextModal text from roundNumber', async () => {
  const source = await readSource('src/components/game/GameStage.vue')

  assert.match(source, /import FlyInTextModal from '\.\/FlyInTextModal\.vue'/)
  assert.match(source, /const isRoundStartNoticeOpen = ref\(false\)/)
  assert.match(source, /const roundStartNoticeText = computed\(\(\) =>[\s\S]*`第 \$\{props\.roundNumber\} 回合開始`/)
  assert.match(source, /:is-open="isRoundStartNoticeOpen"[\s\S]*:text="roundStartNoticeText"[\s\S]*@close="closeRoundStartNotice"/)
})

test('round start notice is awaited before the current-player turn notice', async () => {
  const source = await readSource('src/components/game/GameStage.vue')
  const initialDealFunction = source.slice(
    source.indexOf('async function playInitialRoundDrawSequence'),
    source.indexOf('function requestDraw'),
  )

  assert.match(initialDealFunction, /await playRoundStartNotice\(signature\)/)
  assert.match(initialDealFunction, /playTurnNotice\(\{ force: true \}\)/)
  assert.ok(
    initialDealFunction.indexOf('await playRoundStartNotice(signature)') <
      initialDealFunction.indexOf('playTurnNotice({ force: true })'),
  )
  assert.match(source, /function playTurnNotice[\s\S]*isRoundStartNoticeOpen\.value/)
})

test('round start notice observes roundNumber without adding backend contracts', async () => {
  const stageSource = await readSource('src/components/game/GameStage.vue')
  const roundServiceSource = await readSource('server/src/services/roundService.js')
  const initialStateSource = await readSource('server/src/game/initialState.js')

  assert.match(stageSource, /watch\(\s*\(\) => props\.roundNumber/)
  assert.match(stageSource, /function getRoundStartNoticeKey\(signature\)[\s\S]*`\$\{props\.roundNumber\}:\$\{signature\}`/)
  assert.doesNotMatch(roundServiceSource, /roundNumber/)
  assert.doesNotMatch(initialStateSource, /roundNumber/)
})
