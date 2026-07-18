import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('round showdown reveals survivor cards and emphasizes only the winner', async () => {
  const source = await readSource('src/components/game/animations/RoundShowdownAnimation.vue')

  assert.match(source, /const WINNER_SCALE = 2/)
  assert.match(source, /const SHOWDOWN_HOLD_SECONDS = 5/)
  assert.match(source, /props\.getPlayerHandRect\?\.\(playerId\)/)
  assert.match(source, /props\.isSelfPlayer\?\.\(playerId\) === true/)
  assert.match(source, /rotationY: layer\.isSelf \? 0 : 180/)
  assert.match(source, /opponentFlippers[\s\S]*getFlipVars\(0, timing\.flip\)/)
  assert.match(source, /getEmphasisVars\(WINNER_SCALE/)
  assert.match(source, /zIndex: playerId === winnerPlayerId \? 4 : 2/)
  assert.match(source, /duration: SHOWDOWN_HOLD_SECONDS/)
})

test('round showdown hides original opponent card backs while proxy cards flip', async () => {
  const animation = await readSource('src/components/game/animations/RoundShowdownAnimation.vue')
  const stage = await readSource('src/components/game/ui/GameStage.vue')
  const visibility = await readSource('src/composables/useGameStageCardVisibility.js')

  assert.match(animation, /defineEmits\(\['hidden-player-ids-change'\]\)/)
  assert.match(animation, /entries[\s\S]*\.filter\(\(entry\) => !entry\.isSelf\)/)
  assert.match(animation, /emit\('hidden-player-ids-change', hiddenPlayerIds\)/)
  assert.match(animation, /emit\('hidden-player-ids-change', \[\]\)/)
  assert.match(stage, /roundShowdownHiddenPlayerIds/)
  assert.match(stage, /@hidden-player-ids-change="handleShowdownHiddenPlayerIdsChange"/)
  assert.match(visibility, /roundShowdownHiddenPlayerIds/)
  assert.match(visibility, /new Set\(\[\.\.\.effectPlayerIds, \.\.\.showdownPlayerIds\]\)/)
})

test('round showdown supports reduced motion without shortening the result hold', async () => {
  const source = await readSource('src/components/game/animations/RoundShowdownAnimation.vue')

  assert.match(source, /const reduced = isReducedMotion\(\)/)
  assert.match(source, /const timing = getCardMotionTiming\(reduced\)/)
  assert.match(source, /duration: timing\.emphasis[\s\S]*reduced/)
  assert.match(source, /\.to\(\{\}, \{ duration: SHOWDOWN_HOLD_SECONDS \}\)/)
})

test('round showdown fails open and settles cancellation paths', async () => {
  const source = await readSource('src/components/game/animations/RoundShowdownAnimation.vue')

  assert.match(source, /if \(!player\.card \|\| !rect\)[\s\S]*return null/)
  assert.match(source, /entries\.some\(\(entry\) => !entry\)/)
  assert.match(source, /timeline\?\.kill\(\)/)
  assert.match(source, /gsap\.killTweensOf\(targets\)/)
  assert.match(source, /settle\(value\)/)
  assert.match(source, /onBeforeUnmount\(\(\) => stop\(false\)\)/)
})

test('round showdown overlay follows Square UI colors and prevents viewport overflow', async () => {
  const source = await readSource('src/components/game/animations/RoundShowdownAnimation.vue')

  assert.match(source, /overflow: hidden/)
  assert.match(source, /pointer-events: none/)
  assert.match(source, /background: rgba\(0, 19, 50, 0\.58\)/)
  assert.doesNotMatch(source, /border-radius/)
})

test('game stage exposes showdown playback at existing player hand anchors', async () => {
  const source = await readSource('src/components/game/ui/GameStage.vue')

  assert.match(source, /import RoundShowdownAnimation from ["']\.\.\/animations\/RoundShowdownAnimation\.vue["']/)
  assert.match(source, /ref="roundShowdownAnimation"/)
  assert.match(source, /:get-player-hand-rect="animationRects\.getPlayerHandRect"/)
  assert.match(source, /:is-self-player="animationRects\.isSelfPlayer"/)
  assert.match(source, /playRoundShowdownAnimation:[\s\S]*roundShowdownAnimation\.value\?\.play/)
  assert.match(source, /roundShowdownAnimation\.value\?\.stop\?\.\(\)/)
})

test('socket action sequence reveals showdown before applying the action-bound state', async () => {
  const source = await readSource('src/composables/useGameSocketActions.js')
  const actionFunction = source.slice(
    source.indexOf('async function playSocketGameAction'),
    source.indexOf('function handleSocketGameAction'),
  )
  const playHandler = source.slice(
    source.indexOf('async function handlePlayCard'),
    source.indexOf('function handleRoundSequenceComplete'),
  )

  assert.match(actionFunction, /playRemoteCardPlayAnimation/)
  assert.match(actionFunction, /playEffectAnimation/)
  assert.match(actionFunction, /playRoundShowdownAnimation/)
  assert.ok(actionFunction.indexOf('playRemoteCardPlayAnimation') < actionFunction.indexOf('playEffectAnimation'))
  assert.ok(actionFunction.indexOf('playEffectAnimation') < actionFunction.indexOf('playRoundShowdownAnimation'))
  assert.match(playHandler, /if \(data\?\.afterActionId\)[\s\S]*handleSocketGameState\(data\)/)
})

test('showdown normalization rejects malformed payloads and restores card assets', async () => {
  const source = await readSource('src/composables/useGameSocketActions.js')
  const normalizeFunction = source.slice(
    source.indexOf('function normalizeShowdownResult'),
    source.indexOf('async function sendReadyForComputerTurn'),
  )

  assert.match(normalizeFunction, /result === null \|\| result === undefined/)
  assert.match(normalizeFunction, /result\.reason !== 'deck-empty'/)
  assert.match(normalizeFunction, /result\.players\.length === 0/)
  assert.match(normalizeFunction, /result\.players\.length > 4/)
  assert.match(normalizeFunction, /!playerId \|\| !player\?\.card/)
  assert.match(normalizeFunction, /normalizeCard\(player\.card, index\)/)
  assert.match(normalizeFunction, /!players\.some\(\(player\) => player\.playerId === winnerPlayerId\)/)
  assert.match(normalizeFunction, /console\.warn\('\[game:view\] invalid-showdown-result'/)
})

test('HTTP fallback plays a valid showdown and legacy acknowledgements stay compatible', async () => {
  const source = await readSource('src/composables/useGameSocketActions.js')
  const playHandler = source.slice(
    source.indexOf('async function handlePlayCard'),
    source.indexOf('function handleRoundSequenceComplete'),
  )

  assert.match(playHandler, /const showdownResult = normalizeShowdownResult\(data\?\.showdownResult\)/)
  assert.match(playHandler, /await gameStage\.value\.playRoundShowdownAnimation\(showdownResult\)/)
  assert.match(playHandler, /else \{[\s\S]*applyGameStatePayload\(data\)/)
  assert.match(playHandler, /if \(!applyGameStatePayload\(data\)\)[\s\S]*await refreshRoomState\(\)/)
})
