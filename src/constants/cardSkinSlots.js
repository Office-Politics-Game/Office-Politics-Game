const CARD_SKIN_SLOT_ORDER = [
  "intern",
  "cleaner",
  "manager",
  "senior",
  "pm",
  "hr",
  "advisor",
  "ceo",
];

const CARD_SKIN_SLOT_LABELS = {
  intern: "Intern",
  cleaner: "Cleaner",
  manager: "Manager",
  senior: "Senior",
  pm: "PM",
  hr: "HR",
  advisor: "Advisor",
  ceo: "CEO",
};

function sanitizeCardSkinOverrides(overrides = {}) {
  if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) {
    return {};
  }

  return Object.fromEntries(
    CARD_SKIN_SLOT_ORDER.filter((slotKey) => overrides[slotKey] !== undefined && overrides[slotKey] !== null)
      .map((slotKey) => [slotKey, overrides[slotKey]]),
  );
}

export {
  CARD_SKIN_SLOT_LABELS,
  CARD_SKIN_SLOT_ORDER,
  sanitizeCardSkinOverrides,
};
