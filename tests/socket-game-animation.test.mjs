import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('game socket handlers broadcast animation actions before private state updates', async () => {
  const source = await readSource('server/src/socket/gameHandlers.js')
  const drawHandler = source.slice(
    source.indexOf('socket.on("game:draw-card"'),
    source.indexOf('socket.on("game:play-card"'),
  )
  const playHandler = source.slice(source.indexOf('socket.on("game:play-card"'))

  assert.match(source, /function createGameActionPayload/)
  assert.match(source, /function emitGameAction/)
  assert.match(source, /emit\("game:action"/)
  assert.match(source, /function emitDrawCardActionToPlayers/)
  assert.match(drawHandler, /type: "draw-card"/)
  assert.match(drawHandler, /playerId: Number\(playerId\)/)
  assert.match(source, /const playerRoom = `game:\$\{roomCode\}:player:\$\{action\.playerId\}`/)
  assert.match(source, /io\.to\(playerRoom\)\.emit\("game:action"[\s\S]*drawnCard/)
  assert.match(source, /io\.to\(`game:\$\{roomCode\}`\)\.except\(playerRoom\)\.emit\("game:action", actionPayload\)/)
  assert.ok(
    drawHandler.indexOf('emitDrawCardActionToPlayers') <
      drawHandler.indexOf('await emitGameStateAfterActionToPlayers'),
  )
  assert.match(playHandler, /type: "play-card"/)
  assert.match(playHandler, /discardedCard: result\.discardedCard/)
  assert.match(playHandler, /animationResult: result\.animationResult/)
  assert.match(playHandler, /showdownResult: result\.showdownResult/)
  assert.match(playHandler, /afterActionId: playActionId/)
  assert.ok(
    playHandler.indexOf('emitPlayCardActionToPlayers') <
      playHandler.indexOf('await emitGameStateAfterActionToPlayers'),
  )
})

test('game view subscribes to socket actions and defers state while animations run', async () => {
  const source = await readSource('src/composables/useGameSocketActions.js')

  assert.match(source, /activeGameSocket\.on\('game:action', handleSocketGameAction\)/)
  assert.match(source, /activeGameSocket\.on\('game:state', handleSocketGameState\)/)
  assert.match(source, /await emitWithAck\('game:subscribe'/)
  assert.match(source, /await emitWithAck\('game:draw-card'/)
  assert.match(source, /await emitWithAck\('game:play-card'/)
  assert.match(source, /pendingSocketGameStatesByActionId\.set\(afterActionId, data\)/)
  assert.match(source, /isPlayingSocketAction\.value/)
  assert.match(source, /socketActionQueue = socketActionQueue/)
  assert.match(source, /playDrawAnimation\?\.\(drawnCard, playerId\)/)
  assert.match(source, /const discardedCard = event\.discardedCard[\s\S]*normalizeCard\(event\.discardedCard\)/)
  assert.match(source, /playRemoteCardPlayAnimation\?\.\(\{[\s\S]*discardedCard/)
  assert.match(source, /playEffectAnimation\?\.\(animationResult\)/)
  assert.match(source, /playRoundShowdownAnimation\?\.\(showdownResult\)/)
  assert.ok(
    source.indexOf('playRemoteCardPlayAnimation') <
      source.indexOf('playEffectAnimation?.(animationResult)'),
  )
  assert.match(source, /function cleanupGameSocket\(\)[\s\S]*off\('game:action'/)
  assert.match(source, /function cleanupGameSocket\(\)[\s\S]*off\('game:state'/)
})

test('game view defers action-bound draw and play states until their animations complete', async () => {
  const source = await readSource('src/composables/useGameSocketActions.js')
  const drawHandler = source.slice(
    source.indexOf('async function handleDrawRequest'),
    source.indexOf('async function handlePlayCard'),
  )
  const playHandler = source.slice(
    source.indexOf('async function handlePlayCard'),
    source.indexOf('function handleRoundSequenceComplete'),
  )

  assert.match(drawHandler, /const data = await emitWithAck\('game:draw-card'/)
  assert.match(drawHandler, /if \(data\?\.afterActionId\)[\s\S]*handleSocketGameState\(data\)[\s\S]*else[\s\S]*applyGameStatePayload\(data\)/)
  assert.doesNotMatch(drawHandler, /void data/)
  assert.match(playHandler, /const data = await emitWithAck\('game:play-card'/)
  assert.match(playHandler, /if \(data\?\.afterActionId\)[\s\S]*handleSocketGameState\(data\)[\s\S]*else[\s\S]*applyGameStatePayload\(data\)/)
  assert.doesNotMatch(playHandler, /void data/)
})

test('game stage exposes remote opponent play animation for socket play-card actions', async () => {
  const source = await readSource('src/components/game/ui/GameStage.vue')
  const cardPlaySource = await readSource('src/composables/useGameStageCardPlay.js')
  const remotePlayFunction = cardPlaySource.slice(
    cardPlaySource.indexOf('async function playRemoteCardPlayAnimation'),
    cardPlaySource.indexOf('function cleanupCardPlay'),
  )

  assert.match(source, /playRemoteCardPlayAnimation,/)
  assert.match(remotePlayFunction, /animationRects\.isSelfPlayer\(playerId\)/)
  assert.match(remotePlayFunction, /return false/)
  assert.match(remotePlayFunction, /animationRects\.getPlayerHandRect\(playerId\)/)
  assert.match(remotePlayFunction, /animationRects\.getDiscardRect\(\)/)
  assert.match(remotePlayFunction, /cardPlayAnimation\.value\?\.play/)
  assert.match(remotePlayFunction, /position: player\?\.position \?\? ["']top["']/)
  assert.match(remotePlayFunction, /faceUp: false/)
})

test('socket client exposes a timeout ack helper for game actions', async () => {
  const source = await readSource('src/services/socketClient.js')

  assert.match(source, /const DEFAULT_ACK_TIMEOUT_MS = 5000/)
  assert.match(source, /function emitWithAck/)
  assert.match(source, /activeSocket\.timeout\(timeout\)\.emit/)
  assert.match(source, /response\?\.ok === false/)
  assert.match(source, /resolve\(response\?\.data \?\? response\)/)
  assert.match(source, /emitWithAck,/)
})
