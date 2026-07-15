<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
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
import { useGameStateStore } from '@/stores/gameStateStore'
import { normalizeCard } from '@/utils/cardUtils'
import { resolveAvatarUrl } from '@/utils/playerUtils'

const route = useRoute()
const appearanceStore = useAppearanceStore()
const gameStateStore = useGameStateStore()
const { gameState, currentPlayer, currentPlayerId, currentTurnPlayerId, isLoading } =
  storeToRefs(gameStateStore)
const {
  cardSkinUrl,
  cardSkinOverrides,
  isHydrated: isAppearanceHydrated,
} = storeToRefs(appearanceStore)
const gameStage = ref(null)

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
  isDrawing,
  normalizeCard: normalizeCardForViewer,
  resolveAvatarUrl,
})

onMounted(() => {
  void loadInitialRoomState()
  void subscribeGameSocket()
})

onBeforeUnmount(() => {
  cleanupGameSocket()
})

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
    :has-any-card-been-played="Boolean(gameState?.hasAnyCardBeenPlayed)"
    :is-loading="isLoading || isDrawing || isSocketActionSubmitting || isPlayingSocketAction"
    @draw-request="handleDrawRequest"
    @play-card="handlePlayCard"
    @round-sequence-complete="handleRoundSequenceComplete"
  />
</template>
