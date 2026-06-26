function findPlayerById(state, playerId) {
  return (
    state?.players?.find(
      (player) => Number(player.playerId ?? player.id) === Number(playerId),
    ) ?? null
  )
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
    sourceCard: sourcePlayer?.hand?.[0] ?? null,
    targetCard: targetPlayer?.hand?.[0] ?? null,
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
  } = context

  switch (cardName) {
    case 'Cleaner':
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
      return targetCard
        ? {
            type: 'intern',
            targetPlayerId,
            targetCard,
            outcome: targetCard.name === guessedCardName ? 'correct' : 'incorrect',
          }
        : null

    case 'Manager': {
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

    case 'PM':
      return effectResult?.discardedCard
        ? {
            type: 'pm',
            targetPlayerId,
            discardedCard: effectResult.discardedCard,
            newCard: effectResult.newCard ?? null,
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
