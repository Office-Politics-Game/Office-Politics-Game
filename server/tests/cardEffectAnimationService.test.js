import {
  buildCardEffectAnimationResult,
  createCardEffectAnimationResultForViewer,
  createCardEffectAnimationContext,
} from '../src/services/cardEffectAnimationService.js'

function createInternContext(guessedCardName) {
  return createCardEffectAnimationContext({
    state: {
      players: [
        { playerId: 1, hand: [{ id: 1, name: 'Intern' }] },
        { playerId: 2, hand: [{ id: 3, name: 'Manager' }] },
      ],
    },
    card: { id: 1, name: 'Intern' },
    playerId: 1,
    targetPlayerId: 2,
    guessedCardName,
  })
}

describe('intern card effect animation result', () => {
  test('preserves an incorrect submitted guess', () => {
    const result = buildCardEffectAnimationResult(createInternContext('CEO'))

    expect(result).toMatchObject({
      type: 'intern',
      targetPlayerId: 2,
      guessedCardName: 'CEO',
      outcome: 'incorrect',
    })
  })

  test('preserves a correct submitted guess', () => {
    const result = buildCardEffectAnimationResult(createInternContext('Manager'))

    expect(result).toMatchObject({
      type: 'intern',
      targetPlayerId: 2,
      guessedCardName: 'Manager',
      outcome: 'correct',
    })
  })
})

describe('project manager card effect animation result', () => {
  function createPmAnimationResult({ newCardDrawn = true } = {}) {
    const state = {
      players: [
        { playerId: 1, hand: [{ id: 5, name: 'PM' }] },
        { playerId: 2, hand: [{ id: 3, name: 'Manager' }] },
      ],
    }
    const context = createCardEffectAnimationContext({
      state,
      card: { id: 5, name: 'PM' },
      playerId: 1,
      targetPlayerId: 2,
    })

    state.players[1].hand = newCardDrawn
      ? [{ id: 6, name: 'HR' }]
      : []

    return buildCardEffectAnimationResult(context, {
      discardedCard: { id: 3, name: 'Manager', ownerPlayerId: 2 },
      newCardDrawn,
    })
  }

  test('includes the replacement card in the private animation result', () => {
    expect(createPmAnimationResult()).toEqual({
      type: 'pm',
      targetPlayerId: 2,
      discardedCard: { id: 3, name: 'Manager', ownerPlayerId: 2 },
      newCardDrawn: true,
      newCard: { id: 6, name: 'HR', ownerPlayerId: 2 },
    })
  })

  test('reveals the replacement only to the target player', () => {
    const animationResult = createPmAnimationResult()
    const targetResult = createCardEffectAnimationResultForViewer(
      animationResult,
      2,
      1,
    )
    const sourceResult = createCardEffectAnimationResultForViewer(
      animationResult,
      1,
      1,
    )

    expect(targetResult.newCard).toEqual({
      id: 6,
      name: 'HR',
      ownerPlayerId: 2,
    })
    expect(sourceResult).toMatchObject({
      type: 'pm',
      targetPlayerId: 2,
      newCardDrawn: true,
      newCard: null,
    })
  })

  test('does not request a draw after the target discards CEO', () => {
    expect(createPmAnimationResult({ newCardDrawn: false })).toMatchObject({
      type: 'pm',
      newCardDrawn: false,
      newCard: null,
    })
  })
})

describe('hr card effect animation result privacy', () => {
  const animationResult = {
    type: 'swap',
    sourcePlayerId: 1,
    targetPlayerId: 2,
    sourceCard: { id: 2, name: 'Cleaner', ownerPlayerId: 1 },
    targetCard: { id: 8, name: 'CEO', ownerPlayerId: 2 },
  }

  test('reveals the old card before the swap and the incoming card after it', () => {
    expect(
      createCardEffectAnimationResultForViewer(animationResult, 1, 1),
    ).toMatchObject({
      sourceCardReveal: 'before-swap',
      targetCardReveal: 'after-swap',
      sourceCard: animationResult.sourceCard,
      targetCard: animationResult.targetCard,
    })

    expect(
      createCardEffectAnimationResultForViewer(animationResult, 2, 1),
    ).toMatchObject({
      sourceCardReveal: 'after-swap',
      targetCardReveal: 'before-swap',
      sourceCard: animationResult.sourceCard,
      targetCard: animationResult.targetCard,
    })
  })

  test('keeps both cards redacted and face down for bystanders', () => {
    expect(
      createCardEffectAnimationResultForViewer(animationResult, 3, 1),
    ).toEqual({
      type: 'swap',
      sourcePlayerId: 1,
      targetPlayerId: 2,
      sourceCard: null,
      targetCard: null,
      sourceCardReveal: 'never',
      targetCardReveal: 'never',
    })
  })
})
