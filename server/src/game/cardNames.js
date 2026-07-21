const ADVISER_CARD_NAME = 'Adviser'
const ADVISER_CARD_ALIASES = new Set([ADVISER_CARD_NAME, 'Advisor'])

function normalizeCardName(cardName) {
  return ADVISER_CARD_ALIASES.has(cardName) ? ADVISER_CARD_NAME : cardName
}

function cardNamesMatch(cardName, guessedCardName) {
  return normalizeCardName(cardName) === normalizeCardName(guessedCardName)
}

export { cardNamesMatch }
