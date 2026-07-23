import { computed } from 'vue'

const SEAT_POSITIONS = ['top', 'left', 'right', 'bottom']

function getPlayerId(player) {
  return player?.playerId ?? player?.id ?? null
}

function normalizeRoundWins(value) {
  const numberValue = Number(value)

  return Number.isInteger(numberValue) ? Math.min(Math.max(numberValue, 0), 3) : 0
}

function normalizeLevel(value) {
  const numberValue = Number(value)

  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : 1
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

function orderPlayersForViewer(players, viewerPlayerId) {
  const sortedPlayers = [...players].sort(
    (a, b) => Number(a.seatOrder ?? 0) - Number(b.seatOrder ?? 0),
  )
  const selfIndex = sortedPlayers.findIndex(
    (player) => String(getPlayerId(player)) === String(viewerPlayerId),
  )

  if (selfIndex < 0) {
    return sortedPlayers
  }

  return [
    sortedPlayers[(selfIndex + 2) % sortedPlayers.length],
    sortedPlayers[(selfIndex + 3) % sortedPlayers.length],
    sortedPlayers[(selfIndex + 1) % sortedPlayers.length],
    sortedPlayers[selfIndex],
  ].filter(Boolean)
}

export function useGameViewModel({
  gameState,
  currentPlayer,
  currentTurnPlayerId,
  resolvedCurrentPlayerId,
  roomPlayerMetadata,
  viewerProfile,
  isDrawing,
  normalizeCard,
  resolveAvatarUrl,
} = {}) {
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

  const selfPlayer = computed(() =>
    publicPlayersWithMetadata.value.find(
      (player) => String(getPlayerId(player)) === resolvedCurrentPlayerId.value,
    ) ?? currentPlayer.value ?? null,
  )

  const players = computed(() =>
    orderPlayersForViewer(
      publicPlayersWithMetadata.value,
      resolvedCurrentPlayerId.value,
    ).slice(0, 4).map((player, index) => {
      const playerId = String(getPlayerId(player) ?? `player-${index + 1}`)
      const isCurrentPlayer = playerId === resolvedCurrentPlayerId.value

      return {
        id: playerId,
        name: player.username ?? player.name ?? `Player ${index + 1}`,
        avatarUrl: resolveAvatarUrl(player.avatarUrl ?? player.avatarId, index),
        roundWins: normalizeRoundWins(player.roundWins ?? player.score ?? 0),
        level: normalizeLevel(
          isCurrentPlayer ? viewerProfile?.value?.level ?? player.level : player.level,
        ),
        position: SEAT_POSITIONS[index] ?? 'bottom',
        isComputer: Boolean(player.isComputer),
        isCurrentPlayer,
        isTurnPlayer: playerId === String(currentTurnPlayerId.value ?? ''),
        isProtected: Boolean(player.isProtected),
        isEliminated: Boolean(player.isEliminated),
      }
    }),
  )

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

  const deckCount = computed(() => gameState.value?.deckCount ?? 0)
  const currentTurnPlayer = computed(() =>
    players.value.find((player) => player.isTurnPlayer) ?? null,
  )
  const canCurrentPlayerAct = computed(() => {
    if (!currentTurnPlayerId.value || !resolvedCurrentPlayerId.value) {
      return true
    }

    return (
      String(currentTurnPlayerId.value) === resolvedCurrentPlayerId.value &&
      !selfPlayer.value?.isComputer
    )
  })
  const canDraw = computed(() =>
    canCurrentPlayerAct.value &&
    handCards.value.length < 2 &&
    deckCount.value > 0 &&
    !isDrawing.value,
  )
  const turnStatus = computed(() => ({
    roundNumber: gameState.value?.roundNumber ?? gameState.value?.round ?? 1,
    currentPhase:
      currentTurnPlayer.value?.name ??
      selfPlayer.value?.username ??
      selfPlayer.value?.name ??
      '無資料',
    currentStep: canCurrentPlayerAct.value ? '輪到你' : '等待對手出牌',
  }))
  const playerHandCardCounts = computed(() =>
    Object.fromEntries(
      players.value.map((player) => {
        const publicPlayer = publicPlayers.value.find(
          (candidate) => String(getPlayerId(candidate)) === player.id,
        )

        return player.isCurrentPlayer
          ? [player.id, handCards.value.length]
          : [player.id, getPublicHandCount(publicPlayer)]
      }),
    ),
  )

  return {
    turnStatus,
    publicPlayers,
    selfPlayer,
    players,
    handCards,
    discardCards,
    deckCount,
    canCurrentPlayerAct,
    canDraw,
    playerHandCardCounts,
  }
}

export {
  getPlayerId,
  getPublicHandCount,
  normalizeLevel,
  normalizeRoundWins,
  orderPlayersForViewer,
}
