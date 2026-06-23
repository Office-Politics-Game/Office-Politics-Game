<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import advisorBackgroundUrl from '@/assets/images/card-bg-advisor.webp'
import advisorFrameUrl from '@/assets/images/card-frame-advisor.webp'
import ceoBackgroundUrl from '@/assets/images/card-bg-ceo.webp'
import ceoFrameUrl from '@/assets/images/card-frame-ceo.webp'
import cleanerBackgroundUrl from '@/assets/images/card-bg-cleaner.webp'
import cleanerFrameUrl from '@/assets/images/card-frame-cleaner.webp'
import hrBackgroundUrl from '@/assets/images/card-bg-hr.webp'
import hrFrameUrl from '@/assets/images/card-frame-hr.webp'
import internBackgroundUrl from '@/assets/images/card-bg-intern.webp'
import internFrameUrl from '@/assets/images/card-frame-intern.webp'
import managerBackgroundUrl from '@/assets/images/card-bg-manager.webp'
import managerFrameUrl from '@/assets/images/card-frame-manager.webp'
import pmBackgroundUrl from '@/assets/images/card-bg-pm.webp'
import pmFrameUrl from '@/assets/images/card-frame-pm.webp'
import seniorBackgroundUrl from '@/assets/images/card-bg-senior.webp'
import seniorFrameUrl from '@/assets/images/card-frame-senior.webp'
import playerOneUrl from '@/assets/images/player-1.png'
import playerTwoUrl from '@/assets/images/player-2.png'
import playerThreeUrl from '@/assets/images/player-3.png'
import playerFourUrl from '@/assets/images/player-4.png'
import GameStage from '@/components/game/GameStage.vue'
import {
  drawCard as drawGameCard,
  getRoomGameState,
  playCard as playGameCard,
} from '@/services/gameActionApi'
import { useGameStateStore } from '@/stores/gameStateStore'

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
const fallbackAvatars = [playerTwoUrl, playerThreeUrl, playerFourUrl, playerOneUrl]
const roomPlayerMetadata = ref({})
const fallbackPlayers = [
  {
    id: 'player-top',
    name: 'Waiting',
    avatarUrl: playerTwoUrl,
    roundWins: 0,
    level: 1,
    position: 'top',
    isCurrentPlayer: false,
  },
  {
    id: 'player-left',
    name: 'Waiting',
    avatarUrl: playerThreeUrl,
    roundWins: 0,
    level: 1,
    position: 'left',
    isCurrentPlayer: false,
  },
  {
    id: 'player-right',
    name: 'Waiting',
    avatarUrl: playerFourUrl,
    roundWins: 0,
    level: 1,
    position: 'right',
    isCurrentPlayer: false,
  },
  {
    id: 'player-bottom',
    name: 'You',
    avatarUrl: playerOneUrl,
    roundWins: 0,
    level: 1,
    position: 'bottom',
    isCurrentPlayer: true,
  },
]

const turnStatus = computed(() => ({
  roundNumber: gameState.value?.roundNumber ?? gameState.value?.round ?? 1,
  currentPhase: gameState.value?.phase ?? 'playing',
  currentStep: canCurrentPlayerAct.value ? 'Your turn' : 'Waiting',
}))

const cardAssetsByKey = {
  intern: {
    backgroundUrl: internBackgroundUrl,
    frameUrl: internFrameUrl,
    color: '#fb923c',
    type: 'Guess',
    name: 'Intern',
    effectKey: 'guess',
    targetMode: 'opponent',
    requiresGuess: true,
  },
  cleaner: {
    backgroundUrl: cleanerBackgroundUrl,
    frameUrl: cleanerFrameUrl,
    color: '#22c55e',
    type: 'Peek',
    name: 'Cleaner',
    effectKey: 'peek',
    targetMode: 'opponent',
    requiresGuess: false,
  },
  manager: {
    backgroundUrl: managerBackgroundUrl,
    frameUrl: managerFrameUrl,
    color: '#fb7185',
    type: 'Duel',
    name: 'Manager',
    effectKey: 'compare',
    targetMode: 'opponent',
    requiresGuess: false,
  },
  senior: {
    backgroundUrl: seniorBackgroundUrl,
    frameUrl: seniorFrameUrl,
    color: '#60a5fa',
    type: 'Shield',
    name: 'Senior',
    effectKey: 'protect',
    targetMode: 'none',
    requiresGuess: false,
  },
  pm: {
    backgroundUrl: pmBackgroundUrl,
    frameUrl: pmFrameUrl,
    color: '#f97316',
    type: 'Redraw',
    name: 'PM',
    effectKey: 'redraw',
    targetMode: 'anyPlayer',
    requiresGuess: false,
  },
  hr: {
    backgroundUrl: hrBackgroundUrl,
    frameUrl: hrFrameUrl,
    color: '#a78bfa',
    type: 'Swap',
    name: 'HR',
    effectKey: 'swap',
    targetMode: 'opponent',
    requiresGuess: false,
  },
  advisor: {
    backgroundUrl: advisorBackgroundUrl,
    frameUrl: advisorFrameUrl,
    color: '#38bdf8',
    type: 'Force',
    name: 'Advisor',
    effectKey: 'force-discard',
    targetMode: 'none',
    requiresGuess: false,
  },
  ceo: {
    backgroundUrl: ceoBackgroundUrl,
    frameUrl: ceoFrameUrl,
    color: '#facc15',
    type: 'Boss',
    name: 'CEO',
    effectKey: 'self-eliminate',
    targetMode: 'none',
    requiresGuess: false,
  },
}

const cardAssetKeyByRank = {
  1: 'intern',
  2: 'cleaner',
  3: 'manager',
  4: 'senior',
  5: 'pm',
  6: 'hr',
  7: 'advisor',
  8: 'ceo',
}

const cardAssetKeyByName = {
  intern: 'intern',
  cleaner: 'cleaner',
  manager: 'manager',
  senior: 'senior',
  veteran: 'senior',
  pm: 'pm',
  hr: 'hr',
  advisor: 'advisor',
  adviser: 'advisor',
  ceo: 'ceo',
}

const cardAssetKeyByEffect = {
  guess: 'intern',
  peek: 'cleaner',
  compare: 'manager',
  protect: 'senior',
  redraw: 'pm',
  swap: 'hr',
  'force-discard': 'advisor',
  'self-eliminate': 'ceo',
}

const defaultDiscardCard = normalizeCard({
  id: 'discard-placeholder',
  name: 'Advisor',
  rank: 7,
  backgroundUrlKey: 'advisor',
  frameUrlKey: 'advisor',
})

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

  if (sortedPlayers.length === 0) {
    return fallbackPlayers.map((player) => ({
      ...player,
      id: player.isCurrentPlayer && resolvedCurrentPlayerId.value
        ? resolvedCurrentPlayerId.value
        : player.id,
    }))
  }

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

  const resolvedPlayers = viewerRelativePlayers.slice(0, 4).map((player, index) => {
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

  return fallbackPlayers.map((fallback, index) => resolvedPlayers[index] ?? fallback)
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

const discardCard = computed(() => discardCards.value.at(-1) ?? defaultDiscardCard)
const deckCount = computed(() => gameState.value?.deckCount ?? 0)
const drawPlayerId = computed(() => resolvedCurrentPlayerId.value || null)
const canCurrentPlayerAct = computed(() => {
  if (!currentTurnPlayerId.value || !resolvedCurrentPlayerId.value) {
    return true
  }

  return String(currentTurnPlayerId.value) === resolvedCurrentPlayerId.value
})

const drawCard = computed(() => {
  if (!canCurrentPlayerAct.value || handCards.value.length >= 2 || deckCount.value <= 0) {
    return null
  }

  return normalizeCard({
    id: 'draw-preview',
    name: 'Intern',
    rank: 1,
    backgroundUrlKey: 'intern',
    frameUrlKey: 'intern',
  })
})

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
    rawGameState: gameState.value,
    rawCurrentPlayer: currentPlayer.value,
    publicPlayers: publicPlayers.value,
    publicPlayersWithMetadata: publicPlayersWithMetadata.value,
    derivedPlayers: players.value,
    handCards: handCards.value,
    discardCards: discardCards.value,
    deckCount: deckCount.value,
    drawCard: drawCard.value,
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

function resolveAvatarUrl(value, index) {
  const avatarMap = {
    1: playerOneUrl,
    2: playerTwoUrl,
    3: playerThreeUrl,
    4: playerFourUrl,
    'player-1': playerOneUrl,
    'player-2': playerTwoUrl,
    'player-3': playerThreeUrl,
    'player-4': playerFourUrl,
  }

  return avatarMap[value] ?? avatarMap[String(value)] ?? fallbackAvatars[index] ?? playerOneUrl
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

function inferAssetKeyFromText(value) {
  if (!value) {
    return null
  }

  const text = String(value).toLowerCase()

  return Object.entries(cardAssetKeyByName).find(([name]) => text.includes(name))?.[1] ?? null
}

function normalizeCard(rawCard = {}, fallbackIndex = 0) {
  const rawRank = Number(rawCard.rank ?? rawCard.cardRank ?? rawCard.id)
  const inferredAssetKeyFromName = inferAssetKeyFromText(rawCard.name)
  const fallbackRank = fallbackIndex + 1
  const rank = Number.isFinite(rawRank)
    ? rawRank
    : Number(Object.entries(cardAssetKeyByRank).find(
        ([, key]) => key === inferredAssetKeyFromName,
      )?.[0] ?? fallbackRank)
  const assetKey =
    rawCard.backgroundUrlKey ??
    rawCard.frameUrlKey ??
    rawCard.assetKey ??
    rawCard.cardKey ??
    inferredAssetKeyFromName ??
    cardAssetKeyByEffect[rawCard.effectKey] ??
    cardAssetKeyByRank[rank] ??
    inferAssetKeyFromText(rawCard.id) ??
    'intern'
  const assets = cardAssetsByKey[assetKey] ?? cardAssetsByKey.intern

  return {
    ...rawCard,
    id: String(rawCard.id ?? `${assetKey}-${fallbackIndex}`),
    name: rawCard.name ?? assets.name,
    type: rawCard.type ?? assets.type,
    rank: Number.isFinite(rank) ? rank : 1,
    effectKey: rawCard.effectKey ?? assets.effectKey,
    targetMode: rawCard.targetMode ?? assets.targetMode,
    requiresGuess: Boolean(rawCard.requiresGuess ?? assets.requiresGuess),
    backgroundUrl: rawCard.backgroundUrl ?? assets.backgroundUrl,
    frameUrl: rawCard.frameUrl ?? assets.frameUrl,
    color: rawCard.color ?? assets.color,
  }
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

async function refreshRoomState() {
  if (!normalizedRoomCode.value || !requestedPlayerId.value) {
    logStoreState('missing-query')
    return
  }

  logStoreState('refresh:start')

  const roomStateResponse = await gameStateStore.fetchRoomState(normalizedRoomCode.value, {
    playerId: requestedPlayerId.value,
  })
  rememberRoomPlayerMetadata(roomStateResponse?.players ?? [])
  logStoreState('room-state:fetched', { roomStateResponse })

  const data = await getRoomGameState(normalizedRoomCode.value, requestedPlayerId.value)
  logStoreState('game-state:fetched', { gameStateResponse: data })

  const nextGameState = data.state ?? data.gameState ?? null
  const nextPlayers = Array.isArray(nextGameState?.players) ? nextGameState.players : []
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

  logStoreState('store:patched')
}

async function handleDrawComplete() {
  if (!normalizedRoomCode.value || !resolvedCurrentPlayerId.value) {
    return
  }

  await drawGameCard(normalizedRoomCode.value, {
    playerId: resolvedCurrentPlayerId.value,
  })
  logStoreState('draw-card:completed')
  await refreshRoomState()
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
  refreshRoomState().catch((error) => {
    console.warn('[game] fetch room state failed', error)
    logStoreState('refresh:error', { error })
  })
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
    refreshRoomState().catch((error) => {
      console.warn('[game] fetch room state failed after route query change', error)
      logStoreState('refresh:error', { error })
    })
  },
)
</script>

<template>
  <GameStage
    :round-number="turnStatus.roundNumber"
    :current-phase="turnStatus.currentPhase"
    :current-step="turnStatus.currentStep"
    :deck-count="deckCount"
    :discard-card="discardCard"
    :discard-cards="discardCards"
    :players="players"
    :player-hand-card-counts="playerHandCardCounts"
    :hand-cards="handCards"
    :draw-card="drawCard"
    :draw-player-id="drawPlayerId"
    :current-player-id="resolvedCurrentPlayerId"
    :current-turn-player-id="currentTurnPlayerId"
    :is-loading="isLoading"
    @draw-complete="handleDrawComplete"
    @play-card="handlePlayCard"
    @return-lobby="handleReturnLobby"
    @restart-game="handleRestartGame"
  />
</template>
