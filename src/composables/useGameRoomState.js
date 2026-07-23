import { computed, nextTick, ref } from 'vue'
import { getDisplayErrorMessage } from "@/utils/errorMessages.js"

const LOADING_PROGRESS_TRANSITION_MS = 240

function normalizeQueryValue(value) {
  return Array.isArray(value) ? value[0] : value
}

function getPlayerId(player) {
  return player?.playerId ?? player?.id ?? null
}

export function useGameRoomState({
  route,
  gameStateStore,
  currentPlayerId,
  getRoomGameState,
  beforeRefresh,
} = {}) {
  const roomPlayerMetadata = ref({})
  const hasLoadedInitialState = ref(false)
  const initialLoadError = ref('')
  const loadingProgress = ref(0)

  const normalizedRoomCode = computed(() => normalizeQueryValue(route.query.roomCode))
  const requestedPlayerId = computed(() => normalizeQueryValue(route.query.playerId))
  const resolvedCurrentPlayerId = computed(() =>
    String(requestedPlayerId.value ?? currentPlayerId.value ?? ''),
  )

  function rememberRoomPlayerMetadata(players = []) {
    roomPlayerMetadata.value = Object.fromEntries(
      players.map((player) => [
        String(getPlayerId(player)),
        {
          playerId: getPlayerId(player),
          username: player.username,
          name: player.name,
          level: player.level,
          avatarId: player.avatarId ?? player.avatar_id,
          avatarUrl: player.avatarUrl,
          cardSkinUrl: player.cardSkinUrl ?? '',
          cardSkinOverrides: player.cardSkinOverrides ?? {},
        },
      ]),
    )
  }

  function applyGameStatePayload(data) {
    const nextGameState = data?.state ?? data?.gameState ?? data ?? null
    const nextPlayers = Array.isArray(nextGameState?.players) ? nextGameState.players : []

    if (nextPlayers.length === 0) {
      return false
    }

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
        nextGameState?.currentTurnPlayerId ?? data?.currentTurnPlayerId ?? null,
    })

    return true
  }

  async function refreshRoomState({ onProgress } = {}) {
    if (!normalizedRoomCode.value || !requestedPlayerId.value) {
      throw new Error('缺少房間代碼或玩家資料')
    }

    if (typeof beforeRefresh === 'function') {
      await beforeRefresh(requestedPlayerId.value)
    }

    const roomStateResponse = await gameStateStore.fetchRoomState(
      normalizedRoomCode.value,
      { playerId: requestedPlayerId.value },
    )
    onProgress?.(40)
    rememberRoomPlayerMetadata(roomStateResponse?.players ?? [])

    const data = await getRoomGameState(
      normalizedRoomCode.value,
      requestedPlayerId.value,
    )
    onProgress?.(80)

    const nextGameState = data?.state ?? data?.gameState ?? null

    if (!nextGameState) {
      throw new Error('遊戲狀態回應缺少狀態資料')
    }

    const nextPlayers = Array.isArray(nextGameState.players) ? nextGameState.players : []

    if (nextPlayers.length !== 4) {
      throw new Error('遊戲狀態必須包含四位玩家')
    }

    applyGameStatePayload(data)
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
      initialLoadError.value = getDisplayErrorMessage(error, '載入遊戲狀態失敗')
      console.warn('[game] fetch initial room state failed', error)
    }
  }

  return {
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
  }
}

export { getPlayerId, normalizeQueryValue }
