<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import LoadingScreen from '@/components/common/LoadingScreen.vue'
import GameStage from '@/components/game/GameStage.vue'
import {
  cardAssetKeyByRank,
  cardAssetsByKey,
} from '@/constants/cardAssets'
import {
  drawCard as drawGameCard,
  getRoomGameState,
  playCard as playGameCard,
} from '@/services/gameActionApi'
import { useGameStateStore } from '@/stores/gameStateStore'
import { normalizeCard } from '@/utils/cardUtils'
import { resolveAvatarUrl } from '@/utils/playerUtils'

const route = useRoute()
const gameStateStore = useGameStateStore()
const {
  gameState,
  currentPlayer,
  currentPlayerId,
  currentTurnPlayerId,
  isLoading,
} = storeToRefs(gameStateStore)

const seatPositions = ['top', 'left', 'right', 'bottom']
const LOADING_PROGRESS_TRANSITION_MS = 240
const roomPlayerMetadata = ref({})
const hasLoadedInitialState = ref(false)
const initialLoadError = ref('')
const loadingProgress = ref(0)
const gameStage = ref(null)
const isDrawing = ref(false)

const turnStatus = computed(() => ({
  roundNumber: gameState.value?.roundNumber ?? gameState.value?.round ?? 1,
  currentPhase: selfPlayer.value?.username ?? selfPlayer.value?.name ?? '無資料',
  currentStep: canCurrentPlayerAct.value ? '輪到你' : '等待對手出牌',
}))

const normalizedRoomCode = computed(() => normalizeQueryValue(route.query.roomCode))
const requestedPlayerId = computed(() => normalizeQueryValue(route.query.playerId))
const resolvedCurrentPlayerId = computed(() =>
  String(requestedPlayerId.value ?? currentPlayerId.value ?? ''),
)

const publicPlayers = computed(() => {
  const players = gameState.value?.players

  return Array.isArray(players) ? players : []
})

const publicPlayersWithMetadata = computed(() =>
  publicPlayers.value.map((player) => ({
    ...roomPlayerMetadata.value[String(getPlayerId(player))],
    ...player,
  })),
)

const selfPlayer = computed(() => {
  const selfId = resolvedCurrentPlayerId.value

  return (
    publicPlayersWithMetadata.value.find((player) => String(getPlayerId(player)) === selfId) ??
    currentPlayer.value ??
    null
  )
})

const players = computed(() => {
  const sortedPlayers = [...publicPlayersWithMetadata.value].sort(
    (a, b) => Number(a.seatOrder ?? 0) - Number(b.seatOrder ?? 0),
  )

  const selfIndex = sortedPlayers.findIndex(
    (player) => String(getPlayerId(player)) === resolvedCurrentPlayerId.value,
  )
  const viewerRelativePlayers = selfIndex >= 0
    ? [
        sortedPlayers[(selfIndex + 2) % sortedPlayers.length],
        sortedPlayers[(selfIndex + 3) % sortedPlayers.length],
        sortedPlayers[(selfIndex + 1) % sortedPlayers.length],
        sortedPlayers[selfIndex],
      ].filter(Boolean)
    : sortedPlayers

  return viewerRelativePlayers.slice(0, 4).map((player, index) => {
    const playerId = String(getPlayerId(player) ?? `player-${index + 1}`)

    return {
      id: playerId,
      name: player.username ?? player.name ?? `Player ${index + 1}`,
      avatarUrl: resolveAvatarUrl(player.avatarUrl ?? player.avatarId, index),
      roundWins: normalizeRoundWins(player.roundWins ?? player.score ?? 0),
      level: player.level ?? 1,
      position: seatPositions[index] ?? 'bottom',
      isCurrentPlayer: playerId === resolvedCurrentPlayerId.value,
      isTurnPlayer: playerId === String(currentTurnPlayerId.value ?? ''),
      isProtected: Boolean(player.isProtected),
      isEliminated: Boolean(player.isEliminated),
    }
  })
})

const handCards = computed(() => {
  const hand = selfPlayer.value?.hand

  return Array.isArray(hand) ? hand.map((card, index) => normalizeCard(card, index)) : []
})

const discardCards = computed(() => {
  const discardPile = gameState.value?.discardPile

  return Array.isArray(discardPile)
    ? discardPile.map((card, index) => normalizeCard(card, index))
    : []
})

const discardCard = computed(() => discardCards.value.at(-1) ?? null)
const deckCount = computed(() => gameState.value?.deckCount ?? 0)
const drawPlayerId = computed(() => resolvedCurrentPlayerId.value || null)
const canCurrentPlayerAct = computed(() => {
  if (!currentTurnPlayerId.value || !resolvedCurrentPlayerId.value) {
    return true
  }

  return String(currentTurnPlayerId.value) === resolvedCurrentPlayerId.value
})

const canDraw = computed(() =>
  canCurrentPlayerAct.value &&
  handCards.value.length < 2 &&
  deckCount.value > 0 &&
  !isDrawing.value,
)

const playerHandCardCounts = computed(() =>
  Object.fromEntries(
    players.value.map((player) => {
      const publicPlayer = publicPlayers.value.find(
        (candidate) => String(getPlayerId(candidate)) === player.id,
      )

      if (player.isCurrentPlayer) {
        return [player.id, handCards.value.length]
      }

      return [player.id, getPublicHandCount(publicPlayer)]
    }),
  ),
)

function getStoreDebugSnapshot(label, extra = {}) {
  return {
    label,
    routeQuery: { ...route.query },
    roomCode: normalizedRoomCode.value,
    requestedPlayerId: requestedPlayerId.value,
    currentPlayerId: currentPlayerId.value,
    resolvedCurrentPlayerId: resolvedCurrentPlayerId.value,
    currentTurnPlayerId: currentTurnPlayerId.value,
    isLoading: isLoading.value,
    isDrawing: isDrawing.value,
    rawGameState: gameState.value,
    rawCurrentPlayer: currentPlayer.value,
    publicPlayers: publicPlayers.value,
    publicPlayersWithMetadata: publicPlayersWithMetadata.value,
    derivedPlayers: players.value,
    handCards: handCards.value,
    discardCards: discardCards.value,
    deckCount: deckCount.value,
    canDraw: canDraw.value,
    playerHandCardCounts: playerHandCardCounts.value,
    ...extra,
  }
}

function logStoreState(label, extra = {}) {
  console.log('[game:view]', getStoreDebugSnapshot(label, extra))
}

function normalizeQueryValue(value) {
  return Array.isArray(value) ? value[0] : value
}

function getPlayerId(player) {
  return player?.playerId ?? player?.id ?? null
}

function normalizeRoundWins(value) {
  const numberValue = Number(value)

  return Number.isInteger(numberValue) ? Math.min(Math.max(numberValue, 0), 3) : 0
}

function getPublicHandCount(player) {
  const count = Number(
    player?.handCount ??
    player?.cardCount ??
    player?.handCardCount ??
    0,
  )

  return Number.isInteger(count) ? Math.max(count, 0) : 0
}

function rememberRoomPlayerMetadata(players = []) {
  roomPlayerMetadata.value = Object.fromEntries(
    players.map((player) => [
      String(getPlayerId(player)),
      {
        playerId: getPlayerId(player),
        username: player.username,
        name: player.name,
        avatarId: player.avatarId ?? player.avatar_id,
        avatarUrl: player.avatarUrl,
      },
    ]),
  )
}

function getGuessedCardName(rank) {
  const assetKey = cardAssetKeyByRank[rank]

  return assetKey ? cardAssetsByKey[assetKey]?.name : undefined
}

function restoreApiCard(card) {
  const numericId = Number(card.id)

  return {
    ...card,
    id: Number.isInteger(numericId) ? numericId : card.id,
  }
}

async function refreshRoomState({ onProgress } = {}) {
  if (!normalizedRoomCode.value || !requestedPlayerId.value) {
    logStoreState('missing-query')
    throw new Error('Missing roomCode or playerId')
  }

  logStoreState('refresh:start')

  const roomStateResponse = await gameStateStore.fetchRoomState(normalizedRoomCode.value, {
    playerId: requestedPlayerId.value,
  })
  onProgress?.(40)
  rememberRoomPlayerMetadata(roomStateResponse?.players ?? [])
  logStoreState('room-state:fetched', { roomStateResponse })

  const data = await getRoomGameState(normalizedRoomCode.value, requestedPlayerId.value)
  onProgress?.(80)
  logStoreState('game-state:fetched', { gameStateResponse: data })

  const nextGameState = data.state ?? data.gameState ?? null
  const nextPlayers = Array.isArray(nextGameState?.players) ? nextGameState.players : []

  if (nextPlayers.length !== 4) {
    throw new Error('Game state must contain exactly four players')
  }

  const nextCurrentPlayer = nextPlayers.find(
    (player) => String(getPlayerId(player)) === String(requestedPlayerId.value),
  ) ?? null

  gameStateStore.$patch({
    gameState: nextGameState,
    currentPlayer: nextCurrentPlayer,
    currentPlayerId: requestedPlayerId.value,
    currentTurnPlayerId:
      nextGameState?.currentTurnPlayerId ??
      data.currentTurnPlayerId ??
      null,
  })
  onProgress?.(100)

  logStoreState('store:patched')
}

async function loadInitialRoomState() {
  hasLoadedInitialState.value = false
  initialLoadError.value = ''
  loadingProgress.value = 0

  try {
    await refreshRoomState({
      onProgress: (progress) => {
        loadingProgress.value = progress
      },
    })
    await nextTick()
    await new Promise((resolve) => {
      window.setTimeout(resolve, LOADING_PROGRESS_TRANSITION_MS)
    })
    hasLoadedInitialState.value = true
  } catch (error) {
    initialLoadError.value =
      error instanceof Error ? error.message : 'Failed to load game state'
    console.warn('[game] fetch initial room state failed', error)
    logStoreState('refresh:error', { error })
  }
}

async function handleDrawRequest() {
  if (
    isDrawing.value ||
    !canDraw.value ||
    !normalizedRoomCode.value ||
    !resolvedCurrentPlayerId.value
  ) {
    return
  }

  isDrawing.value = true

  try {
    const data = await drawGameCard(normalizedRoomCode.value, {
      playerId: resolvedCurrentPlayerId.value,
    })
    const rawDrawnCard = data?.drawnCard ?? data?.card ?? null

    if (!rawDrawnCard) {
      throw new Error('Draw card response did not include a card')
    }

    const drawnCard = normalizeCard(rawDrawnCard)
    logStoreState('draw-card:completed', { drawnCard })

    await nextTick()

    if (!gameStage.value?.playDrawAnimation) {
      throw new Error('Game stage draw animation is unavailable')
    }

    await gameStage.value.playDrawAnimation(
      drawnCard,
      resolvedCurrentPlayerId.value,
    )
    await refreshRoomState()
  } catch (error) {
    console.warn('[game:view] draw-card:failed', {
      roomCode: normalizedRoomCode.value,
      playerId: resolvedCurrentPlayerId.value,
      error,
      errorData: error?.data,
    })

    try {
      await refreshRoomState()
    } catch (refreshError) {
      console.warn('[game:view] draw-card:refresh-failed', refreshError)
    }
  } finally {
    isDrawing.value = false
  }
}

async function handlePlayCard(payload) {
  if (!normalizedRoomCode.value || !resolvedCurrentPlayerId.value || !payload?.card) {
    return
  }

  const playPayload = {
    playerId: resolvedCurrentPlayerId.value,
    card: restoreApiCard(payload.card),
    targetPlayerId: payload.targetPlayerId,
    guessedCardName: getGuessedCardName(payload.guessedRank),
  }

  console.log('[game:view] play-card:request', {
    roomCode: normalizedRoomCode.value,
    playPayload,
  })

  try {
    await playGameCard(normalizedRoomCode.value, playPayload)
    logStoreState('play-card:completed', { playPayload })
    await refreshRoomState()
  } catch (error) {
    console.warn('[game:view] play-card:failed', {
      roomCode: normalizedRoomCode.value,
      playPayload,
      error,
      errorData: error?.data,
    })
    await refreshRoomState()
  }
}

function handleReturnLobby() {
  // Reserved for the future multiplayer-aware lobby transition.
}

function handleRestartGame() {
  // Reserved for the future multiplayer-aware restart flow.
}

onMounted(() => {
  logStoreState('mounted')
  loadInitialRoomState()
})

watch(
  () => [normalizedRoomCode.value, requestedPlayerId.value],
  ([roomCode, playerId], [previousRoomCode, previousPlayerId]) => {
    if (roomCode === previousRoomCode && playerId === previousPlayerId) {
      return
    }

    logStoreState('route-query:changed', {
      previousRoomCode,
      previousPlayerId,
    })
    loadInitialRoomState()
  },
)
</script>

<template>
  <LoadingScreen
    v-if="!hasLoadedInitialState"
    :error-message="initialLoadError"
    :progress="loadingProgress"
    @retry="loadInitialRoomState"
  />

  <GameStage
    v-else
    ref="gameStage"
    :round-number="turnStatus.roundNumber"
    :current-phase="turnStatus.currentPhase"
    :current-step="turnStatus.currentStep"
    :deck-count="deckCount"
    :discard-card="discardCard"
    :discard-cards="discardCards"
    :players="players"
    :player-hand-card-counts="playerHandCardCounts"
    :hand-cards="handCards"
    :can-draw="canDraw"
    :draw-player-id="drawPlayerId"
    :current-player-id="resolvedCurrentPlayerId"
    :current-turn-player-id="currentTurnPlayerId"
    :is-loading="isLoading || isDrawing"
    @draw-request="handleDrawRequest"
    @play-card="handlePlayCard"
    @return-lobby="handleReturnLobby"
    @restart-game="handleRestartGame"
  />
</template>
