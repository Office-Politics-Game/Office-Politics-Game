import { nextTick, ref } from 'vue'

const SWAP_REVEAL_STAGES = new Set(['before-swap', 'after-swap', 'never'])

export function useGameSocketActions({
  normalizedRoomCode,
  resolvedCurrentPlayerId,
  canDraw,
  gameStage,
  applyGameStatePayload,
  refreshRoomState,
  connectSocket,
  emitWithAck,
  drawGameCard,
  playGameCard,
  normalizeCard,
  cardAssetKeyByRank,
  cardAssetsByKey,
} = {}) {
  const isDrawing = ref(false)
  const isSocketActionSubmitting = ref(false)
  const isPlayingSocketAction = ref(false)
  const pendingSocketGameStatesByActionId = new Map()
  const completedSocketActionIds = new Set()
  const handledSocketActionIds = new Set()
  let effectAnimationSequence = 0
  let activeGameSocket = null
  let socketActionQueue = Promise.resolve()
  let pendingSocketActionCount = 0

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
    return playerId === null || playerId === undefined ? null : String(playerId)
  }

  function normalizeEffectAnimationResult(result) {
    if (!result?.type) {
      return null
    }

    const id = result.id ?? `effect-${Date.now()}-${++effectAnimationSequence}`

    switch (result.type) {
      case 'cleaner': {
        const targetPlayerId = normalizeAnimationPlayerId(result.targetPlayerId)
        const targetCard = result.targetCard ? normalizeCard(result.targetCard) : null
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
        const targetCard = result.targetCard ? normalizeCard(result.targetCard) : null
        const guessedCardName = typeof result.guessedCardName === 'string'
          ? result.guessedCardName.trim()
          : ''

        return targetPlayerId && targetCard && guessedCardName &&
          ['correct', 'incorrect'].includes(result.outcome)
          ? { ...result, id, targetPlayerId, targetCard, guessedCardName }
          : null
      }
      case 'protection': {
        const targetPlayerId = normalizeAnimationPlayerId(result.targetPlayerId)

        return targetPlayerId ? { ...result, id, targetPlayerId } : null
      }
      case 'manager': {
        const sourcePlayerId = normalizeAnimationPlayerId(result.sourcePlayerId)
        const targetPlayerId = normalizeAnimationPlayerId(result.targetPlayerId)
        const sourceCard = result.sourceCard ? normalizeCard(result.sourceCard) : null
        const targetCard = result.targetCard ? normalizeCard(result.targetCard) : null

        return sourcePlayerId && targetPlayerId && sourceCard && targetCard &&
          ['win', 'lose', 'draw'].includes(result.outcome)
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
          ? normalizeCard(result.discardedCard)
          : null
        const newCard = result.newCard ? normalizeCard(result.newCard) : null
        const newCardDrawn = result.newCardDrawn === true || Boolean(newCard)

        return targetPlayerId && discardedCard
          ? {
              ...result,
              id,
              targetPlayerId,
              discardedCard,
              newCardDrawn,
              newCard,
            }
          : null
      }
      case 'swap': {
        const sourcePlayerId = normalizeAnimationPlayerId(result.sourcePlayerId)
        const targetPlayerId = normalizeAnimationPlayerId(result.targetPlayerId)
        const sourceCard = result.sourceCard ? normalizeCard(result.sourceCard) : null
        const targetCard = result.targetCard ? normalizeCard(result.targetCard) : null

        const normalizeRevealStage = (stage, card) =>
          card && SWAP_REVEAL_STAGES.has(stage) ? stage : 'never'
        const sourceCardReveal = normalizeRevealStage(
          result.sourceCardReveal,
          sourceCard,
        )
        const targetCardReveal = normalizeRevealStage(
          result.targetCardReveal,
          targetCard,
        )

        return sourcePlayerId && targetPlayerId
          ? {
              ...result,
              id,
              sourcePlayerId,
              targetPlayerId,
              sourceCard,
              targetCard,
              sourceCardReveal,
              targetCardReveal,
            }
          : null
      }
      default:
        return null
    }
  }

  function normalizeShowdownResult(result) {
    if (result === null || result === undefined) {
      return null
    }

    const rejectInvalidResult = () => {
      console.warn('[game:view] invalid-showdown-result', { result })
      return null
    }

    if (
      result.reason !== 'deck-empty' ||
      result.winnerPlayerId === null ||
      result.winnerPlayerId === undefined ||
      !Array.isArray(result.players) ||
      result.players.length === 0 ||
      result.players.length > 4
    ) {
      return rejectInvalidResult()
    }

    const winnerPlayerId = normalizeAnimationPlayerId(result.winnerPlayerId)
    const players = result.players.map((player, index) => {
      const playerId = normalizeAnimationPlayerId(player?.playerId)

      if (!playerId || !player?.card) {
        return null
      }

      return {
        playerId,
        card: normalizeCard(player.card, index),
      }
    })

    if (
      !winnerPlayerId ||
      players.some((player) => !player) ||
      !players.some((player) => player.playerId === winnerPlayerId)
    ) {
      return rejectInvalidResult()
    }

    return {
      ...result,
      winnerPlayerId,
      players,
    }
  }

  async function sendReadyForComputerTurn(reason) {
    if (!normalizedRoomCode.value || !resolvedCurrentPlayerId.value) {
      return
    }

    try {
      await emitWithAck('game:ready-for-computer-turn', {
        roomCode: normalizedRoomCode.value,
        playerId: resolvedCurrentPlayerId.value,
        reason,
      })
    } catch (error) {
      console.warn('[game:view] ready-for-computer-turn:failed', {
        roomCode: normalizedRoomCode.value,
        playerId: resolvedCurrentPlayerId.value,
        reason,
        error,
      })
    }
  }

  async function applySocketGameStateAfterAnimation(data, reason = 'action-complete') {
    if (!applyGameStatePayload(data)) {
      return
    }

    gameStage.value?.clearStagedDiscardCard?.()
    await nextTick()
    await nextTick()
    await gameStage.value?.waitForNoticeIdle?.()

    if (data?.readyForComputerTurn !== false && pendingSocketActionCount === 0) {
      await sendReadyForComputerTurn(reason)
    }
  }

  function handleSocketGameState(data) {
    const afterActionId = data?.afterActionId

    if (!afterActionId) {
      if (applyGameStatePayload(data)) {
        gameStage.value?.clearStagedDiscardCard?.()
      }
      return
    }

    if (completedSocketActionIds.has(afterActionId)) {
      completedSocketActionIds.delete(afterActionId)
      void applySocketGameStateAfterAnimation(data)
      return
    }

    pendingSocketGameStatesByActionId.set(afterActionId, data)
  }

  function completeSocketAction(actionId) {
    if (!actionId) {
      return
    }

    const pendingState = pendingSocketGameStatesByActionId.get(actionId)

    if (pendingState) {
      pendingSocketGameStatesByActionId.delete(actionId)
      void applySocketGameStateAfterAnimation(pendingState)
      return
    }

    completedSocketActionIds.add(actionId)
    if (completedSocketActionIds.size > 100) {
      completedSocketActionIds.clear()
    }
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
      const drawnCard = event.drawnCard ? normalizeCard(event.drawnCard) : null

      if ((!playerId || playerId === resolvedCurrentPlayerId.value) && !drawnCard) {
        return
      }

      await gameStage.value?.playDrawAnimation?.(drawnCard, playerId)
      return
    }

    if (event.type === 'play-card') {
      const animationResult = normalizeEffectAnimationResult(event.animationResult)
      const showdownResult = normalizeShowdownResult(event.showdownResult)
      const discardedCard = event.discardedCard
        ? normalizeCard(event.discardedCard)
        : null

      await gameStage.value?.playRemoteCardPlayAnimation?.({ ...event, discardedCard })
      if (discardedCard) {
        await gameStage.value?.stageDiscardedCard?.(discardedCard)
      }
      if (animationResult) {
        await gameStage.value?.playEffectAnimation?.(animationResult)
      }
      if (showdownResult) {
        await gameStage.value?.playRoundShowdownAnimation?.(showdownResult)
      }
    }
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
        console.warn('[game:view] socket-action:animation-failed', { event, error })
      })
      .finally(() => {
        pendingSocketActionCount = Math.max(0, pendingSocketActionCount - 1)
        completeSocketAction(event.id)
        if (pendingSocketActionCount === 0) {
          isPlayingSocketAction.value = false
        }
      })
  }

  function cleanupGameSocket() {
    activeGameSocket?.off('game:action', handleSocketGameAction)
    activeGameSocket?.off('game:state', handleSocketGameState)
    activeGameSocket = null
  }

  async function subscribeGameSocket() {
    cleanupGameSocket()
    if (!normalizedRoomCode.value || !resolvedCurrentPlayerId.value) {
      return
    }

    activeGameSocket = connectSocket()
    activeGameSocket.off('game:action', handleSocketGameAction)
    activeGameSocket.off('game:state', handleSocketGameState)
    activeGameSocket.on('game:action', handleSocketGameAction)
    activeGameSocket.on('game:state', handleSocketGameState)

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

  async function handleDrawRequest() {
    if (
      isDrawing.value ||
      !canDraw() ||
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
      if (data?.afterActionId) {
        handleSocketGameState(data)
      } else {
        applyGameStatePayload(data)
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

        const drawnCard = normalizeCard(rawDrawnCard)
        await nextTick()
        if (!gameStage.value?.playDrawAnimation) {
          throw new Error('Game stage draw animation is unavailable')
        }
        await gameStage.value.playDrawAnimation(drawnCard, resolvedCurrentPlayerId.value)
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
      if (data?.afterActionId) {
        handleSocketGameState(data)
      } else {
        if (applyGameStatePayload(data)) {
          gameStage.value?.clearStagedDiscardCard?.()
        }
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
        const showdownResult = normalizeShowdownResult(data?.showdownResult)
        const discardedCard = data?.discardedCard
          ? normalizeCard(data.discardedCard)
          : null
        if (discardedCard) {
          await gameStage.value?.stageDiscardedCard?.(discardedCard)
        }
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
        if (showdownResult && gameStage.value?.playRoundShowdownAnimation) {
          try {
            await gameStage.value.playRoundShowdownAnimation(showdownResult)
          } catch (animationError) {
            console.warn('[game:view] play-card:showdown-animation-failed', {
              showdownResult,
              error: animationError,
            })
          }
        }
        if (!applyGameStatePayload(data)) {
          await refreshRoomState()
        }
        gameStage.value?.clearStagedDiscardCard?.()
      } catch (fallbackError) {
        console.warn('[game:view] play-card:fallback-failed', {
          roomCode: normalizedRoomCode.value,
          playPayload,
          error: fallbackError,
          errorData: fallbackError?.data,
        })
        await refreshRoomState()
        gameStage.value?.clearStagedDiscardCard?.()
      }
    } finally {
      isSocketActionSubmitting.value = false
    }
  }

  function handleRoundSequenceComplete() {
    void sendReadyForComputerTurn('round-start')
  }

  return {
    isDrawing,
    isSocketActionSubmitting,
    isPlayingSocketAction,
    subscribeGameSocket,
    cleanupGameSocket,
    handleDrawRequest,
    handlePlayCard,
    handleRoundSequenceComplete,
  }
}
