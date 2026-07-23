import { CARD_INFO_BY_RANK } from "@/constants/cardInfo";

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
  intern: CARD_INFO_BY_RANK[1].chinese,
  cleaner: CARD_INFO_BY_RANK[2].chinese,
  manager: CARD_INFO_BY_RANK[3].chinese,
  senior: CARD_INFO_BY_RANK[4].chinese,
  pm: CARD_INFO_BY_RANK[5].chinese,
  hr: CARD_INFO_BY_RANK[6].chinese,
  advisor: CARD_INFO_BY_RANK[7].chinese,
  ceo: CARD_INFO_BY_RANK[8].chinese,
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
