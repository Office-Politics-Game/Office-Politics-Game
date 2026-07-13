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
            outcome: targetCard.name === guessedCardName ? 'correct' : 'incorrect',
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

    case 'PM':
      return effectResult?.discardedCard
        ? {
            type: 'pm',
            targetPlayerId,
            discardedCard: effectResult.discardedCard,
            newCard: effectResult.newCard ?? null,
          }
        : null

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

export {
  buildCardEffectAnimationResult,
  createCardEffectAnimationContext,
}
