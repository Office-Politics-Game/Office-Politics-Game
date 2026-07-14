import {
  buildCardEffectAnimationResult,
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
