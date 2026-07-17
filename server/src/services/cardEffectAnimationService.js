import { cardNamesMatch } from '../game/cardNames.js'

function findPlayerById(state, playerId) {
  return (
    state?.players?.find(
      (player) => Number(player.playerId ?? player.id) === Number(playerId),
    ) ?? null
  )
}

function attachCardOwner(card, playerId) {
  if (!card) {
    return card
  }

  return {
    ...card,
    ownerPlayerId: Number(playerId),
  }
}

function createCardEffectAnimationContext({
  state,
  card,
  playerId,
  targetPlayerId,
  guessedCardName,
}) {
  const sourcePlayer = findPlayerById(state, playerId)
  const targetPlayer = findPlayerById(state, targetPlayerId)

  return {
    state,
    cardName: card?.name ?? null,
    playerId,
    targetPlayerId,
    guessedCardName,
    sourceCard: attachCardOwner(sourcePlayer?.hand?.[0] ?? null, playerId),
    targetCard: attachCardOwner(targetPlayer?.hand?.[0] ?? null, targetPlayerId),
    targetProtected: Boolean(targetPlayer?.isProtected),
  }
}

function buildCardEffectAnimationResult(context, effectResult) {
  if (!context) {
    return null
  }

  const {
    state,
    cardName,
    playerId,
    targetPlayerId,
    guessedCardName,
    sourceCard,
    targetCard,
    targetProtected,
  } = context

  switch (cardName) {
    case 'Cleaner':
      if (targetProtected) {
        return {
          type: 'protection',
          targetPlayerId,
          sourceType: 'cleaner',
        }
      }

      return targetCard
        ? {
            type: 'cleaner',
            targetPlayerId,
            viewerPlayerId: playerId,
            targetCard,
            revealCard: true,
          }
        : null

    case 'Intern':
      if (targetProtected) {
        return {
          type: 'protection',
          targetPlayerId,
          sourceType: 'intern',
        }
      }

      return targetCard
        ? {
            type: 'intern',
            targetPlayerId,
            targetCard,
            guessedCardName,
            outcome: cardNamesMatch(targetCard.name, guessedCardName)
              ? 'correct'
              : 'incorrect',
          }
        : null

    case 'Manager': {
      if (targetProtected) {
        return {
          type: 'protection',
          targetPlayerId,
          sourceType: 'manager',
        }
      }

      if (!sourceCard || !targetCard) {
        return null
      }

      const sourceCardId = Number(sourceCard.id)
      const targetCardId = Number(targetCard.id)
      const outcome =
        sourceCardId > targetCardId
          ? 'win'
          : sourceCardId < targetCardId
            ? 'lose'
            : 'draw'

      return {
        type: 'manager',
        sourcePlayerId: playerId,
        targetPlayerId,
        sourceCard,
        targetCard,
        outcome,
        revealCards: true,
      }
    }

    case 'Senior':
      return {
        type: 'protection',
        targetPlayerId: playerId,
        sourceType: 'senior',
      }

    case 'PM': {
      if (!effectResult?.discardedCard) {
        return null
      }

      const newCard = effectResult.newCardDrawn
        ? attachCardOwner(
            findPlayerById(state, targetPlayerId)?.hand?.[0] ?? null,
            targetPlayerId,
          )
        : null

      return {
        type: 'pm',
        targetPlayerId,
        discardedCard: effectResult.discardedCard,
        newCardDrawn: Boolean(effectResult.newCardDrawn),
        newCard,
      }
    }

    case 'HR':
      if (targetProtected) {
        return {
          type: 'protection',
          targetPlayerId,
          sourceType: 'hr',
        }
      }

      return sourceCard && targetCard
        ? {
            type: 'swap',
            sourcePlayerId: playerId,
            targetPlayerId,
            sourceCard,
            targetCard,
          }
        : null

    default:
      return null
  }
}

function createCardEffectAnimationResultForViewer(
  animationResult,
  viewerPlayerId,
  sourcePlayerId,
) {
  if (!animationResult?.type) {
    return animationResult
  }

  const numericViewerPlayerId = Number(viewerPlayerId)

  if (animationResult.type === 'cleaner') {
    const numericSourcePlayerId = Number(sourcePlayerId)

    if (numericViewerPlayerId === numericSourcePlayerId) {
      return {
        ...animationResult,
        viewerPlayerId: numericSourcePlayerId,
        revealCard: true,
      }
    }

    return {
      type: 'cleaner',
      targetPlayerId: animationResult.targetPlayerId,
      viewerPlayerId: numericSourcePlayerId,
      revealCard: false,
    }
  }

  if (animationResult.type === 'pm') {
    const isTargetPlayer =
      numericViewerPlayerId === Number(animationResult.targetPlayerId)

    return {
      ...animationResult,
      newCard: isTargetPlayer ? animationResult.newCard ?? null : null,
    }
  }

  if (animationResult.type === 'swap') {
    const isSourcePlayer =
      numericViewerPlayerId === Number(animationResult.sourcePlayerId)
    const isTargetPlayer =
      numericViewerPlayerId === Number(animationResult.targetPlayerId)

    if (isSourcePlayer) {
      return {
        ...animationResult,
        sourceCardReveal: 'before-swap',
        targetCardReveal: 'after-swap',
      }
    }

    if (isTargetPlayer) {
      return {
        ...animationResult,
        sourceCardReveal: 'after-swap',
        targetCardReveal: 'before-swap',
      }
    }

    return {
      ...animationResult,
      sourceCard: null,
      targetCard: null,
      sourceCardReveal: 'never',
      targetCardReveal: 'never',
    }
  }

  return animationResult
}

export {
  buildCardEffectAnimationResult,
  createCardEffectAnimationResultForViewer,
  createCardEffectAnimationContext,
}
