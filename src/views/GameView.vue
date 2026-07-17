<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from "vue-router"
import { storeToRefs } from 'pinia'
import { computed, nextTick } from 'vue'
import LoadingScreen from '@/components/common/LoadingScreen.vue'
import GameStage from '@/components/game/ui/GameStage.vue'
import { useGameRoomState } from '@/composables/useGameRoomState'
import { useGameSocketActions } from '@/composables/useGameSocketActions'
import { useGameViewModel } from '@/composables/useGameViewModel'
import { cardAssetKeyByRank, cardAssetsByKey } from '@/constants/cardAssets'
import { getCardSkinThemeSlotAsset } from '@/constants/cardSkinThemes'
import {
  drawCard as drawGameCard,
  getRoomGameState,
  playCard as playGameCard,
} from '@/services/gameActionApi'
import { connectSocket, emitWithAck } from '@/services/socketClient'
import { useAppearanceStore } from '@/stores/appearanceStore'
import { useAuthStore } from '@/stores/authStore'
import { useGameStateStore } from '@/stores/gameStateStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useProfileStore } from '@/stores/profileStore'
import { normalizeCard } from '@/utils/cardUtils'
import { resolveAvatarUrl } from '@/utils/playerUtils'

const route = useRoute()
const router = useRouter()
const hasNavigatedToResult = ref(false)
const appearanceStore = useAppearanceStore()
const authStore = useAuthStore()
const gameStateStore = useGameStateStore()
const playerStore = usePlayerStore()
const profileStore = useProfileStore()
const { gameState, currentPlayer, currentPlayerId, currentTurnPlayerId, isLoading } =
  storeToRefs(gameStateStore)
const viewerProfile = computed(
  () =>
    profileStore.profile ??
    authStore.currentPlayer ??
    playerStore.currentPlayer ??
    currentPlayer.value ??
    null,
)
const {
  cardSkinUrl,
  cardSkinOverrides,
  isHydrated: isAppearanceHydrated,
} = storeToRefs(appearanceStore)
const gameStage = ref(null)
const isSkippingComputerFinish = ref(false)

function getViewerCardSkinSource(cardKey = '') {
  const overrideUrl =
    cardKey &&
    cardSkinOverrides.value &&
    typeof cardSkinOverrides.value === 'object'
      ? cardSkinOverrides.value[cardKey]
      : ''

  if (typeof overrideUrl === 'string' && overrideUrl) {
    return overrideUrl
  }

  return typeof cardSkinUrl.value === 'string' ? cardSkinUrl.value : ''
}

function getViewerCardAssetUrls(cardKey = '') {
  const source = getViewerCardSkinSource(cardKey)
  const themeAssets = getCardSkinThemeSlotAsset(source, cardKey)

  return {
    backgroundUrl: themeAssets.backgroundUrl || source,
    frameUrl: themeAssets.frameUrl,
  }
}

function normalizeCardForViewer(rawCard = {}, fallbackIndex = 0) {
  const normalizedCard = normalizeCard(rawCard, fallbackIndex)
  const viewerAssets = getViewerCardAssetUrls(normalizedCard.assetKey)

  if (!viewerAssets.backgroundUrl && !viewerAssets.frameUrl) {
    return normalizedCard
  }

  return {
    ...normalizedCard,
    ...(viewerAssets.backgroundUrl ? { backgroundUrl: viewerAssets.backgroundUrl } : {}),
    ...(viewerAssets.frameUrl ? { frameUrl: viewerAssets.frameUrl } : {}),
  }
}

async function ensureViewerAppearanceHydrated(viewerPlayerId) {
  const numericPlayerId = Number(viewerPlayerId ?? currentPlayerId.value)

  if (!Number.isInteger(numericPlayerId) || numericPlayerId <= 0) {
    return
  }

  if (
    isAppearanceHydrated.value &&
    String(appearanceStore.playerId ?? '') === String(numericPlayerId)
  ) {
    return
  }

  try {
    await appearanceStore.hydrateForPlayer(numericPlayerId)
  } catch (error) {
    console.warn('[game:view] hydrate-viewer-appearance:failed', {
      playerId: numericPlayerId,
      error,
    })
  }
}

const {
  normalizedRoomCode,
  requestedPlayerId,
  resolvedCurrentPlayerId,
  roomPlayerMetadata,
  hasLoadedInitialState,
  initialLoadError,
  loadingProgress,
  applyGameStatePayload,
  refreshRoomState,
  loadInitialRoomState,
} = useGameRoomState({
  route,
  gameStateStore,
  currentPlayerId,
  getRoomGameState,
  beforeRefresh: ensureViewerAppearanceHydrated,
})

const {
  isDrawing,
  isSocketActionSubmitting,
  isPlayingSocketAction,
  subscribeGameSocket,
  cleanupGameSocket,
  handleDrawRequest,
  handlePlayCard,
  handleRoundSequenceComplete,
} = useGameSocketActions({
  normalizedRoomCode,
  resolvedCurrentPlayerId,
  canDraw: () => canDraw.value,
  gameStage,
  applyGameStatePayload,
  refreshRoomState,
  connectSocket,
  emitWithAck,
  drawGameCard,
  playGameCard,
  normalizeCard: normalizeCardForViewer,
  cardAssetKeyByRank,
  cardAssetsByKey,
  isSkippingComputerFinish,
})

const {
  turnStatus,
  players,
  handCards,
  discardCards,
  deckCount,
  canDraw,
  playerHandCardCounts,
} = useGameViewModel({
  gameState,
  currentPlayer,
  currentTurnPlayerId,
  resolvedCurrentPlayerId,
  roomPlayerMetadata,
  viewerProfile,
  isDrawing,
  normalizeCard: normalizeCardForViewer,
  resolveAvatarUrl,
})

async function navigateToResult() {
  await gameStage.value?.playGameEndTransition?.()

  await router.push({
    name: "Result",
    query: {
      roomCode: normalizedRoomCode.value,
      playerId: resolvedCurrentPlayerId.value || requestedPlayerId.value || undefined,
      transition: "game-end",
    },
  })
}

onMounted(() => {
  void loadInitialRoomState()
  void subscribeGameSocket()
})

onBeforeUnmount(() => {
  cleanupGameSocket()
})

async function handleReturnLobby() {
  await router.push('/lobby')
}

async function handleAutoPlayTimeout(turnPlayerId) {
  if (!normalizedRoomCode.value || !resolvedCurrentPlayerId.value || !turnPlayerId) {
    return
  }

  try {
    await emitWithAck('game:auto-play-timeout', {
      roomCode: normalizedRoomCode.value,
      playerId: resolvedCurrentPlayerId.value,
      turnPlayerId,
    })
  } catch (error) {
    console.warn('[game:view] auto-play-timeout:failed', {
      roomCode: normalizedRoomCode.value,
      turnPlayerId,
      error,
    })
    await refreshRoomState()
  }
}

async function handleSkipComputerFinish() {
  if (
    isSkippingComputerFinish.value ||
    !normalizedRoomCode.value ||
    !resolvedCurrentPlayerId.value
  ) {
    return
  }

  isSkippingComputerFinish.value = true

  try {
    const data = await emitWithAck('game:simulate-computer-finish', {
      roomCode: normalizedRoomCode.value,
      playerId: resolvedCurrentPlayerId.value,
    }, { timeout: 30000 })

    if (data?.state) {
      applyGameStatePayload({ state: data.settlementState ?? data.state })
      await nextTick()

      if (data.roundWinnerPlayerId && data.settlementState) {
        await gameStage.value?.playSkippedRoundSettlement?.(
          data.roundWinnerPlayerId,
          async () => {
            applyGameStatePayload({ state: data.state })
            await nextTick()
          },
        )
      } else {
        applyGameStatePayload({ state: data.state })
      }
    }
  } catch (error) {
    console.warn('[game:view] simulate-computer-finish:failed', {
      roomCode: normalizedRoomCode.value,
      error,
    })
    await refreshRoomState()
  } finally {
    isSkippingComputerFinish.value = false
  }
}

watch(
  () => [normalizedRoomCode.value, requestedPlayerId.value],
  ([roomCode, playerId], [previousRoomCode, previousPlayerId]) => {
    if (roomCode === previousRoomCode && playerId === previousPlayerId) {
      return
    }

    void loadInitialRoomState()
    void subscribeGameSocket()
  },
)

watch(
  () => gameState.value?.phase,
  (phase) => {
    if (phase !== "finished" || hasNavigatedToResult.value) {
      return
    }

    hasNavigatedToResult.value = true

    void navigateToResult()
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
    :game-phase="gameState?.phase"
    :current-step="turnStatus.currentStep"
    :is-game-finished="gameState?.phase === 'finished'"
    :deck-count="deckCount"
    :discard-cards="discardCards"
    :players="players"
    :player-hand-card-counts="playerHandCardCounts"
    :hand-cards="handCards"
    :can-draw="canDraw"
    :draw-player-id="resolvedCurrentPlayerId || null"
    :current-player-id="resolvedCurrentPlayerId"
    :current-turn-player-id="currentTurnPlayerId"
    :has-any-card-been-played="Boolean(gameState?.hasAnyCardBeenPlayed)"
    :is-loading="isLoading || isDrawing || isSocketActionSubmitting || isPlayingSocketAction"
    :is-skipping-computer-finish="isSkippingComputerFinish"
    @draw-request="handleDrawRequest"
    @play-card="handlePlayCard"
    @return-lobby="handleReturnLobby"
    @auto-play-timeout="handleAutoPlayTimeout"
    @skip-computer-finish="handleSkipComputerFinish"
    @round-sequence-complete="handleRoundSequenceComplete"
  />
</template>
