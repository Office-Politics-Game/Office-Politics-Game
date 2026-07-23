const CARD_SKIN_SLOT_ORDER = [
  "intern",
  "cleaner",
  "manager",
  "senior",
  "pm",
  "hr",
  "advisor",
  "ceo",
]

function sanitizeCardSkinOverrideIds(overrides = {}) {
  if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) {
    return {}
  }

  return Object.fromEntries(
    CARD_SKIN_SLOT_ORDER.flatMap((slotKey) => {
      const itemId = Number(overrides[slotKey])

      if (!Number.isInteger(itemId) || itemId <= 0) {
        return []
      }

      return [[slotKey, itemId]]
    }),
  )
}

export { CARD_SKIN_SLOT_ORDER, sanitizeCardSkinOverrideIds }
