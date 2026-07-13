import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('game stage displays a round start notice with FlyInTextModal text from roundNumber', async () => {
  const stageSource = await readSource('src/components/game/ui/GameStage.vue')
  const noticeSource = await readSource('src/composables/useGameStageNotices.js')

  assert.match(stageSource, /import FlyInTextModal from ["']\.\.\/animations\/FlyInTextModal\.vue["']/)
  assert.match(noticeSource, /const isRoundStartNoticeOpen = ref\(false\)/)
  assert.match(noticeSource, /roundStartNoticeText\.value = `\u7b2c \$\{props\.roundNumber\} \u56de\u5408\u958b\u59cb`/)
  assert.match(stageSource, /:is-open="isRoundStartNoticeOpen"[\s\S]*:text="roundStartNoticeText"[\s\S]*@close="closeRoundStartNotice"/)
})

test('round start notice is awaited before the current-player turn notice', async () => {
  const source = await readSource('src/composables/useGameStageDrawSequence.js')
  const initialDealFunction = source.slice(
    source.indexOf('async function playInitialRoundDrawSequence'),
    source.indexOf('return {'),
  )

  assert.match(initialDealFunction, /await waitForTutorialSettlement\(\)/)
  assert.match(initialDealFunction, /await playRoundStartNotice\(signature\)/)
  assert.match(initialDealFunction, /playTurnNotice\(\{ force: true \}\)/)
  assert.ok(
    initialDealFunction.indexOf('await waitForTutorialSettlement()') <
      initialDealFunction.indexOf('await playRoundStartNotice(signature)'),
  )
  assert.ok(
    initialDealFunction.indexOf('await playRoundStartNotice(signature)') <
      initialDealFunction.indexOf('playTurnNotice({ force: true })'),
  )
  const noticeSource = await readSource('src/composables/useGameStageNotices.js')
  assert.match(noticeSource, /function playTurnNotice[\s\S]*isRoundStartNoticeOpen\.value/)
})

test('round start notice observes roundNumber without adding backend contracts', async () => {
  const stageSource = await readSource('src/components/game/ui/GameStage.vue')
  const roundServiceSource = await readSource('server/src/services/roundService.js')
  const initialStateSource = await readSource('server/src/game/initialState.js')

  assert.match(stageSource, /watch\(\s*\(\) => props\.roundNumber/)
  const noticeSource = await readSource('src/composables/useGameStageNotices.js')
  assert.match(noticeSource, /function getRoundStartNoticeKey\(signature\)[\s\S]*`\$\{props\.roundNumber\}:\$\{signature\}`/)
  assert.doesNotMatch(roundServiceSource, /roundNumber/)
  assert.doesNotMatch(initialStateSource, /roundNumber/)
})

test('game stage displays an eliminated player notice with avatar and name', async () => {
  const stageSource = await readSource('src/components/game/ui/GameStage.vue')
  const noticeSource = await readSource('src/composables/useGameStageNotices.js')

  assert.match(noticeSource, /const isPlayerEliminatedNoticeOpen = ref\(false\)/)
  assert.match(noticeSource, /const playerEliminatedNotice = ref\(null\)/)
  assert.match(noticeSource, /function playPlayerEliminatedNotice\(player\)/)
  assert.match(noticeSource, /function getEliminatedSnapshot\(players\)/)
  assert.match(noticeSource, /Boolean\(player\.isEliminated\)/)
  assert.match(
    stageSource,
    /Boolean\(nextEliminated\[playerId\]\)[\s\S]*&&[\s\S]*!Boolean\(previousEliminated\[playerId\]\)/,
  )
  assert.match(stageSource, /playPlayerEliminatedNotice\(eliminatedPlayer\)/)
  assert.match(stageSource, /:is-open="isPlayerEliminatedNoticeOpen"[\s\S]*text="\u73a9\u5bb6\u6dd8\u6c70"[\s\S]*:player-name="playerEliminatedNotice\?\.name \?\? ''"[\s\S]*:avatar-url="playerEliminatedNotice\?\.avatarUrl \?\? ''"[\s\S]*tone="danger"/)
})
