<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import LoadingScreen from '@/components/common/LoadingScreen.vue'
import GameStage from '@/components/game/ui/GameStage.vue'
import {
  cardAssetKeyByRank,
  cardAssetsByKey,
} from '@/constants/cardAssets'
import { getCardSkinThemeSlotImage } from '@/constants/cardSkinThemes'
import {
  drawCard as drawGameCard,
  getRoomGameState,
  playCard as playGameCard,
} from '@/services/gameActionApi'
import { connectSocket, emitWithAck } from '@/services/socketClient'
import { useAppearanceStore } from '@/stores/appearanceStore'
import { useGameStateStore } from '@/stores/gameStateStore'
import { normalizeCard } from '@/utils/cardUtils'
import { resolveAvatarUrl } from '@/utils/playerUtils'

const route = useRoute()
const appearanceStore = useAppearanceStore()
const gameStateStore = useGameStateStore()
const {
  gameState,
  currentPlayer,
  currentPlayerId,
  currentTurnPlayerId,
  isLoading,
} = storeToRefs(gameStateStore)
const { cardSkinUrl } = storeToRefs(appearanceStore)

const seatPositions = ['top', 'left', 'right', 'bottom']
const LOADING_PROGRESS_TRANSITION_MS = 240
const roomPlayerMetadata = ref({})
const hasLoadedInitialState = ref(false)
const initialLoadError = ref('')
const loadingProgress = ref(0)
const gameStage = ref(null)
const isDrawing = ref(false)
const isSocketActionSubmitting = ref(false)
const isPlayingSocketAction = ref(false)
const pendingSocketGameState = ref(null)
let effectAnimationSequence = 0
let activeGameSocket = null
let socketActionQueue = Promise.resolve()
let pendingSocketActionCount = 0
const handledSocketActionIds = new Set()

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

  return Array.isArray(hand)
    ? hand.map((card, index) =>
        normalizeCardForPlayer(
          card,
          resolveCardOwnerPlayerId(card, resolvedCurrentPlayerId.value),
          index,
        ),
      )
    : []
})

const discardCards = computed(() => {
  const discardPile = gameState.value?.discardPile

  return Array.isArray(discardPile)
    ? discardPile.map((card, index) =>
        normalizeCardForPlayer(card, resolveCardOwnerPlayerId(card), index),
      )
    : []
})

const deckCount = computed(() => gameState.value?.deckCount ?? 0)
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
        cardSkinUrl: player.cardSkinUrl,
        cardSkinOverrides: player.cardSkinOverrides,
      },
    ]),
  )
}

function getPlayerCardSkinUrl(playerId, cardKey = "") {
  if (playerId === null || playerId === undefined) {
    return ''
  }

  const player = publicPlayersWithMetadata.value.find(
    (candidate) => String(getPlayerId(candidate)) === String(playerId),
  )

  const overrideUrl =
    cardKey &&
    player?.cardSkinOverrides &&
    typeof player.cardSkinOverrides === 'object'
      ? player.cardSkinOverrides[cardKey]
      : ''

  if (typeof overrideUrl === 'string' && overrideUrl) {
    const overrideThemeSlotUrl = getCardSkinThemeSlotImage(overrideUrl, cardKey)

    if (overrideThemeSlotUrl) {
      return overrideThemeSlotUrl
    }

    return overrideUrl
  }

  const themeSlotUrl = getCardSkinThemeSlotImage(player?.cardSkinUrl, cardKey)

  if (themeSlotUrl) {
    return themeSlotUrl
  }

  return typeof player?.cardSkinUrl === 'string' ? player.cardSkinUrl : ''
}

function normalizeCardForPlayer(rawCard = {}, ownerPlayerId = null, fallbackIndex = 0) {
  const normalizedCard = normalizeCard(rawCard, fallbackIndex)
  const playerCardSkinUrl = getPlayerCardSkinUrl(ownerPlayerId, normalizedCard.assetKey)

  if (!playerCardSkinUrl) {
    return normalizedCard
  }

  return {
    ...normalizedCard,
    backgroundUrl: playerCardSkinUrl,
  }
}

function resolveCardOwnerPlayerId(rawCard = {}, fallbackPlayerId = null) {
  return (
    rawCard?.ownerPlayerId ??
    rawCard?.sourcePlayerId ??
    rawCard?.playerId ??
    fallbackPlayerId ??
    null
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

function normalizeAnimationPlayerId(playerId) {
  if (playerId === null || playerId === undefined) {
    return null
  }

  return String(playerId)
}

function normalizeEffectAnimationResult(result) {
  if (!result?.type) {
    return null
  }

  const id = result.id ?? `effect-${Date.now()}-${++effectAnimationSequence}`

  switch (result.type) {
    case 'cleaner': {
      const targetPlayerId = normalizeAnimationPlayerId(result.targetPlayerId)
      const targetCard = result.targetCard
        ? normalizeCardForPlayer(result.targetCard, targetPlayerId)
        : null
      const revealCard = result.revealCard !== false

      return targetPlayerId && (targetCard || !revealCard)
        ? {
            ...result,
            id,
            targetPlayerId,
            viewerPlayerId:
              normalizeAnimationPlayerId(result.viewerPlayerId) ??
              resolvedCurrentPlayerId.value,
            targetCard,
            revealCard,
          }
        : null
    }

    case 'intern': {
      const targetPlayerId = normalizeAnimationPlayerId(result.targetPlayerId)
      const targetCard = result.targetCard
        ? normalizeCardForPlayer(result.targetCard, targetPlayerId)
        : null

      return (
        targetPlayerId &&
        targetCard &&
        ['correct', 'incorrect'].includes(result.outcome)
      )
        ? {
            ...result,
            id,
            targetPlayerId,
            targetCard,
          }
        : null
    }

    case 'protection': {
      const targetPlayerId = normalizeAnimationPlayerId(result.targetPlayerId)

      return targetPlayerId
        ? {
            ...result,
            id,
            targetPlayerId,
          }
        : null
    }

    case 'manager': {
      const sourcePlayerId = normalizeAnimationPlayerId(result.sourcePlayerId)
      const targetPlayerId = normalizeAnimationPlayerId(result.targetPlayerId)
      const sourceCard = result.sourceCard
        ? normalizeCardForPlayer(result.sourceCard, sourcePlayerId)
        : null
      const targetCard = result.targetCard
        ? normalizeCardForPlayer(result.targetCard, targetPlayerId)
        : null

      return (
        sourcePlayerId &&
        targetPlayerId &&
        sourceCard &&
        targetCard &&
        ['win', 'lose', 'draw'].includes(result.outcome)
      )
        ? {
            ...result,
            id,
            sourcePlayerId,
            targetPlayerId,
            sourceCard,
            targetCard,
            revealCards: result.revealCards !== false,
          }
        : null
    }

    case 'pm': {
      const targetPlayerId = normalizeAnimationPlayerId(result.targetPlayerId)
      const discardedCard = result.discardedCard
        ? normalizeCardForPlayer(
            result.discardedCard,
            resolveCardOwnerPlayerId(result.discardedCard, targetPlayerId),
          )
        : null

      return targetPlayerId && discardedCard
        ? {
            ...result,
            id,
            targetPlayerId,
            discardedCard,
            newCard: result.newCard
              ? normalizeCardForPlayer(
                  result.newCard,
                  resolveCardOwnerPlayerId(result.newCard, targetPlayerId),
                )
              : null,
          }
        : null
    }

    case 'swap': {
      const sourcePlayerId = normalizeAnimationPlayerId(result.sourcePlayerId)
      const targetPlayerId = normalizeAnimationPlayerId(result.targetPlayerId)
      const sourceCard = result.sourceCard
        ? normalizeCardForPlayer(result.sourceCard, sourcePlayerId)
        : null
      const targetCard = result.targetCard
        ? normalizeCardForPlayer(result.targetCard, targetPlayerId)
        : null

      return sourcePlayerId && targetPlayerId && sourceCard && targetCard
        ? {
            ...result,
            id,
            sourcePlayerId,
            targetPlayerId,
            sourceCard,
            targetCard,
          }
        : null
    }

    default:
      return null
  }
}

function getStatePayload(data) {
  return data?.state ?? data?.gameState ?? data ?? null
}

function applyGameStatePayload(data) {
  const nextGameState = getStatePayload(data)
  const nextPlayers = Array.isArray(nextGameState?.players) ? nextGameState.players : []

  if (nextPlayers.length === 0) {
    return false
  }

  rememberRoomPlayerMetadata(nextPlayers)

  const nextCurrentPlayerId =
    requestedPlayerId.value ?? currentPlayerId.value ?? resolvedCurrentPlayerId.value
  const nextCurrentPlayer = nextPlayers.find(
    (player) => String(getPlayerId(player)) === String(nextCurrentPlayerId),
  ) ?? null

  gameStateStore.$patch({
    gameState: nextGameState,
    currentPlayer: nextCurrentPlayer,
    currentPlayerId: nextCurrentPlayerId,
    currentTurnPlayerId:
      nextGameState?.currentTurnPlayerId ??
      data?.currentTurnPlayerId ??
      null,
  })

  return true
}

function shouldDeferSocketState() {
  return isDrawing.value || isPlayingSocketAction.value || isSocketActionSubmitting.value
}

function handleSocketGameState(data) {
  if (shouldDeferSocketState()) {
    pendingSocketGameState.value = data
    return
  }

  applyGameStatePayload(data)
}

function flushPendingSocketGameState() {
  if (shouldDeferSocketState() || !pendingSocketGameState.value) {
    return
  }

  const nextState = pendingSocketGameState.value
  pendingSocketGameState.value = null
  applyGameStatePayload(nextState)
}

function rememberSocketAction(actionId) {
  if (!actionId) {
    return false
  }

  if (handledSocketActionIds.has(actionId)) {
    return true
  }

  handledSocketActionIds.add(actionId)

  if (handledSocketActionIds.size > 100) {
    handledSocketActionIds.clear()
  }

  return false
}

async function playSocketGameAction(event) {
  if (!event?.type || event.roomCode !== normalizedRoomCode.value) {
    return
  }

  await nextTick()

  if (event.type === 'draw-card') {
    const playerId = normalizeAnimationPlayerId(event.playerId)
    const drawnCard = event.drawnCard
      ? normalizeCardForPlayer(
          event.drawnCard,
          resolveCardOwnerPlayerId(event.drawnCard, playerId),
        )
      : null

    if (animationRectsSelfPlayer(playerId) && !drawnCard) {
      return
    }

    await gameStage.value?.playDrawAnimation?.(drawnCard, playerId)
    return
  }

  if (event.type === 'play-card') {
    const animationResult = normalizeEffectAnimationResult(event.animationResult)
    const discardedCard = event.discardedCard
      ? normalizeCardForPlayer(
          event.discardedCard,
          resolveCardOwnerPlayerId(event.discardedCard, event.playerId),
        )
      : null

    await gameStage.value?.playRemoteCardPlayAnimation?.({
      ...event,
      discardedCard,
    })

    if (animationResult) {
      await gameStage.value?.playEffectAnimation?.(animationResult)
    }
  }
}

function animationRectsSelfPlayer(playerId) {
  return !playerId || String(playerId) === String(resolvedCurrentPlayerId.value)
}

function handleSocketGameAction(event) {
  if (event?.roomCode !== normalizedRoomCode.value || rememberSocketAction(event.id)) {
    return
  }

  pendingSocketActionCount += 1
  isPlayingSocketAction.value = true

  socketActionQueue = socketActionQueue
    .then(() => playSocketGameAction(event))
    .catch((error) => {
      console.warn('[game:view] socket-action:animation-failed', {
        event,
        error,
      })
    })
    .finally(() => {
      pendingSocketActionCount = Math.max(0, pendingSocketActionCount - 1)

      if (pendingSocketActionCount === 0) {
        isPlayingSocketAction.value = false
        flushPendingSocketGameState()
      }
    })
}

function bindGameSocketListeners(socket) {
  socket.off('game:action', handleSocketGameAction)
  socket.off('game:state', handleSocketGameState)
  socket.on('game:action', handleSocketGameAction)
  socket.on('game:state', handleSocketGameState)
}

async function subscribeGameSocket() {
  if (!normalizedRoomCode.value || !resolvedCurrentPlayerId.value) {
    return
  }

  activeGameSocket = connectSocket()
  bindGameSocketListeners(activeGameSocket)

  try {
    await emitWithAck('game:subscribe', {
      roomCode: normalizedRoomCode.value,
      playerId: resolvedCurrentPlayerId.value,
    })
  } catch (error) {
    console.warn('[game:view] socket-subscribe:failed', {
      roomCode: normalizedRoomCode.value,
      playerId: resolvedCurrentPlayerId.value,
      error,
    })
  }
}

async function refreshRoomState({ onProgress } = {}) {
  if (!normalizedRoomCode.value || !requestedPlayerId.value) {
    throw new Error('Missing roomCode or playerId')
  }

  const roomStateResponse = await gameStateStore.fetchRoomState(normalizedRoomCode.value, {
    playerId: requestedPlayerId.value,
  })
  onProgress?.(40)
  rememberRoomPlayerMetadata(roomStateResponse?.players ?? [])

  const data = await getRoomGameState(normalizedRoomCode.value, requestedPlayerId.value)
  onProgress?.(80)

  const nextGameState = data?.state ?? data?.gameState ?? null

  if (!nextGameState) {
    throw new Error('Game state response did not include state')
  }

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
      data?.currentTurnPlayerId ??
      null,
  })
  onProgress?.(100)
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
    const data = await emitWithAck('game:draw-card', {
      roomCode: normalizedRoomCode.value,
      playerId: resolvedCurrentPlayerId.value,
    })

    if (data?.state) {
      pendingSocketGameState.value = data.state
    }
  } catch (error) {
    console.warn('[game:view] draw-card:socket-failed', {
      roomCode: normalizedRoomCode.value,
      playerId: resolvedCurrentPlayerId.value,
      error,
      errorData: error?.data,
    })

    try {
      const data = await drawGameCard(normalizedRoomCode.value, {
        playerId: resolvedCurrentPlayerId.value,
      })
      const rawDrawnCard = data?.drawnCard ?? data?.card ?? null

      if (!rawDrawnCard) {
        throw new Error('Draw card response did not include a card')
      }

      const drawnCard = normalizeCardForPlayer(
        rawDrawnCard,
        resolveCardOwnerPlayerId(rawDrawnCard, resolvedCurrentPlayerId.value),
      )

      await nextTick()

      if (!gameStage.value?.playDrawAnimation) {
        throw new Error('Game stage draw animation is unavailable')
      }

      await gameStage.value.playDrawAnimation(
        drawnCard,
        resolvedCurrentPlayerId.value,
      )
      await refreshRoomState()
    } catch (fallbackError) {
      console.warn('[game:view] draw-card:fallback-failed', fallbackError)

      try {
        await refreshRoomState()
      } catch (refreshError) {
        console.warn('[game:view] draw-card:refresh-failed', refreshError)
      }
    }
  } finally {
    isDrawing.value = false
    flushPendingSocketGameState()
  }
}

async function handlePlayCard(payload) {
  if (!normalizedRoomCode.value || !resolvedCurrentPlayerId.value || !payload?.card) {
    return
  }

  const playPayload = {
    playerId: resolvedCurrentPlayerId.value,
    cardId: restoreApiCard(payload.card).id,
    targetPlayerId: payload.targetPlayerId,
    guessedCardName: getGuessedCardName(payload.guessedRank),
  }

  isSocketActionSubmitting.value = true

  try {
    const data = await emitWithAck('game:play-card', {
      roomCode: normalizedRoomCode.value,
      ...playPayload,
    })

    if (data?.state) {
      pendingSocketGameState.value = data.state
    }
  } catch (error) {
    console.warn('[game:view] play-card:socket-failed', {
      roomCode: normalizedRoomCode.value,
      playPayload,
      error,
      errorData: error?.data,
    })

    try {
      const data = await playGameCard(normalizedRoomCode.value, playPayload)
      const animationResult = normalizeEffectAnimationResult(data?.animationResult)

      if (animationResult && gameStage.value?.playEffectAnimation) {
        try {
          await gameStage.value.playEffectAnimation(animationResult)
        } catch (animationError) {
          console.warn('[game:view] play-card:animation-failed', {
            animationResult,
            error: animationError,
          })
        }
      }

      await refreshRoomState()
    } catch (fallbackError) {
      console.warn('[game:view] play-card:fallback-failed', {
        roomCode: normalizedRoomCode.value,
        playPayload,
        error: fallbackError,
        errorData: fallbackError?.data,
      })
      await refreshRoomState()
    }
  } finally {
    isSocketActionSubmitting.value = false
    flushPendingSocketGameState()
  }
}

onMounted(() => {
  loadInitialRoomState()
  subscribeGameSocket()
})

onBeforeUnmount(() => {
  activeGameSocket?.off('game:action', handleSocketGameAction)
  activeGameSocket?.off('game:state', handleSocketGameState)
})

watch(
  () => [normalizedRoomCode.value, requestedPlayerId.value],
  ([roomCode, playerId], [previousRoomCode, previousPlayerId]) => {
    if (roomCode === previousRoomCode && playerId === previousPlayerId) {
      return
    }

    loadInitialRoomState()
    subscribeGameSocket()
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
    :discard-cards="discardCards"
    :players="players"
    :player-hand-card-counts="playerHandCardCounts"
    :hand-cards="handCards"
    :can-draw="canDraw"
    :draw-player-id="resolvedCurrentPlayerId || null"
    :current-player-id="resolvedCurrentPlayerId"
    :current-turn-player-id="currentTurnPlayerId"
    :is-loading="isLoading || isDrawing || isSocketActionSubmitting || isPlayingSocketAction"
    @draw-request="handleDrawRequest"
    @play-card="handlePlayCard"
  />
</template>
