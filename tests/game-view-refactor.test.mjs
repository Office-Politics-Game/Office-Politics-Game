import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { ref } from 'vue'
import {
  orderPlayersForViewer,
  useGameViewModel,
} from '../src/composables/useGameViewModel.js'
import { useGameRoomState } from '../src/composables/useGameRoomState.js'

const readSource = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('view model keeps the viewer at the bottom and preserves draw guards', () => {
  const rawPlayers = [
    { playerId: 1, seatOrder: 0, handCount: 1 },
    { playerId: 2, seatOrder: 1, handCount: 1, username: 'Computer 2' },
    { playerId: 3, seatOrder: 2, handCount: 1 },
    { playerId: 4, seatOrder: 3, hand: [{ id: 1 }], level: 1 },
  ]

  assert.deepEqual(
    orderPlayersForViewer(rawPlayers, '4').map((player) => player.playerId),
    [2, 3, 1, 4],
  )

  const isDrawing = ref(false)
  const model = useGameViewModel({
    gameState: ref({ players: rawPlayers, discardPile: [{ id: 2 }], deckCount: 5 }),
    currentPlayer: ref(null),
    currentTurnPlayerId: ref(2),
    resolvedCurrentPlayerId: ref('4'),
    roomPlayerMetadata: ref({}),
    viewerProfile: ref({ level: 8 }),
    isDrawing,
    normalizeCard: (card) => ({ ...card, normalized: true }),
    resolveAvatarUrl: (_, index) => `avatar-${index}`,
  })

  assert.deepEqual(model.players.value.map((player) => player.position), [
    'top',
    'left',
    'right',
    'bottom',
  ])
  assert.equal(model.players.value.at(-1).isCurrentPlayer, true)
  assert.equal(model.players.value.at(-1).level, 8)
  assert.equal(model.handCards.value[0].normalized, true)
  assert.equal(model.discardCards.value[0].normalized, true)
  assert.equal(model.canDraw.value, false)
  assert.equal(model.turnStatus.value.currentPhase, 'Computer 2')

  isDrawing.value = true
  assert.equal(model.canDraw.value, false)
})

test('room state validates route identity and patches a four-player response', async () => {
  const patches = []
  const gameStateStore = {
    async fetchRoomState() {
      return { players: [{ playerId: 1, username: 'Viewer', level: 9 }] }
    },
    $patch(payload) {
      patches.push(payload)
    },
  }
  const route = { query: { roomCode: ['ROOM'], playerId: ['1'] } }
  const fourPlayers = Array.from({ length: 4 }, (_, index) => ({
    playerId: index + 1,
  }))
  const roomState = useGameRoomState({
    route,
    gameStateStore,
    currentPlayerId: ref(null),
    getRoomGameState: async () => ({
      state: { players: fourPlayers, currentTurnPlayerId: 2 },
    }),
  })
  const progress = []

  await roomState.refreshRoomState({ onProgress: (value) => progress.push(value) })

  assert.equal(roomState.normalizedRoomCode.value, 'ROOM')
  assert.equal(roomState.resolvedCurrentPlayerId.value, '1')
  assert.deepEqual(progress, [40, 80, 100])
  assert.equal(patches.at(-1).currentPlayer.playerId, 1)
  assert.equal(patches.at(-1).currentTurnPlayerId, 2)
  assert.equal(roomState.roomPlayerMetadata.value['1'].username, 'Viewer')
  assert.equal(roomState.roomPlayerMetadata.value['1'].level, 9)

  const missingIdentityState = useGameRoomState({
    route: { query: {} },
    gameStateStore,
    currentPlayerId: ref(null),
    getRoomGameState: async () => ({ state: { players: fourPlayers } }),
  })
  await assert.rejects(
    missingIdentityState.refreshRoomState(),
    /Missing roomCode or playerId/,
  )
})

test('game view remains a thin lifecycle and template coordination layer', async () => {
  const viewSource = await readSource('src/views/GameView.vue')
  const modelSource = await readSource('src/composables/useGameViewModel.js')
  const roomSource = await readSource('src/composables/useGameRoomState.js')
  const socketSource = await readSource('src/composables/useGameSocketActions.js')

  assert.match(viewSource, /useGameViewModel\(\{/)
  assert.match(viewSource, /useProfileStore\(\)/)
  assert.match(viewSource, /viewerProfile,/)
  assert.match(viewSource, /useGameRoomState\(\{/)
  assert.match(viewSource, /useGameSocketActions\(\{/)
  assert.match(viewSource, /onMounted\(\(\) => \{[\s\S]*loadInitialRoomState\(\)[\s\S]*subscribeGameSocket\(\)/)
  assert.match(viewSource, /onBeforeUnmount\(\(\) => \{[\s\S]*cleanupGameSocket\(\)/)
  assert.match(viewSource, /watch\([\s\S]*loadInitialRoomState\(\)[\s\S]*subscribeGameSocket\(\)/)
  assert.match(viewSource, /:player-hand-card-counts="playerHandCardCounts"/)
  assert.match(viewSource, /@round-sequence-complete="handleRoundSequenceComplete"/)
  assert.doesNotMatch(viewSource, /pendingSocketGameStatesByActionId|normalizeRoundWins/)

  assert.doesNotMatch(modelSource, /useRoute|useGameStateStore|useGameRoomState\(|useGameSocketActions\(/)
  assert.doesNotMatch(roomSource, /useRoute|useGameStateStore|useGameViewModel\(|useGameSocketActions\(/)
  assert.doesNotMatch(socketSource, /useRoute|useGameStateStore|useGameViewModel\(|useGameRoomState\(/)
})
