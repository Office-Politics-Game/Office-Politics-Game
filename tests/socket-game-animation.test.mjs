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
  assert.match(drawHandler, /type: "draw-card"/)
  assert.match(drawHandler, /playerId: Number\(playerId\)/)
  assert.match(drawHandler, /const playerRoom = `game:\$\{roomCode\}:player:\$\{playerId\}`/)
  assert.match(drawHandler, /io\.to\(playerRoom\)\.emit\("game:action"[\s\S]*drawnCard: result\.drawnCard/)
  assert.match(drawHandler, /io\.to\(`game:\$\{roomCode\}`\)\.except\(playerRoom\)\.emit\("game:action", drawAction\)/)
  assert.ok(
    drawHandler.indexOf('emit("game:action"') <
      drawHandler.indexOf('await emitGameStateToPlayers'),
  )
  assert.match(playHandler, /type: "play-card"/)
  assert.match(playHandler, /discardedCard: result\.discardedCard/)
  assert.match(playHandler, /animationResult: result\.animationResult/)
  assert.ok(
    playHandler.indexOf('emitGameAction') <
      playHandler.indexOf('await emitGameStateToPlayers'),
  )
})

test('game view subscribes to socket actions and defers state while animations run', async () => {
  const source = await readSource('src/views/GameView.vue')

  assert.match(source, /import \{ connectSocket, emitWithAck \} from '@\/services\/socketClient'/)
  assert.match(source, /socket\.on\('game:action', handleSocketGameAction\)/)
  assert.match(source, /socket\.on\('game:state', handleSocketGameState\)/)
  assert.match(source, /await emitWithAck\('game:subscribe'/)
  assert.match(source, /await emitWithAck\('game:draw-card'/)
  assert.match(source, /await emitWithAck\('game:play-card'/)
  assert.match(source, /pendingSocketGameState\.value = data/)
  assert.match(source, /isPlayingSocketAction\.value/)
  assert.match(source, /socketActionQueue = socketActionQueue/)
  assert.match(source, /playDrawAnimation\?\.\(drawnCard, playerId\)/)
  assert.match(source, /playEffectAnimation\?\.\(animationResult\)/)
  assert.match(source, /onBeforeUnmount\(\(\) => \{[\s\S]*off\('game:action'/)
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
