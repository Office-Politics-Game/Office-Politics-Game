import { getCardSkinThemeLogo } from "@/constants/cardSkinThemes.js";
import { resolveImageAssetUrl } from "@/utils/assetUrlResolver.js";

const EQUIPMENT_CATEGORY_ORDER = [
  "avatar",
  "card_skin",
  "card_back",
  "board_skin",
];

const EQUIPMENT_CATEGORY_META = {
  avatar: {
    id: "avatar",
    label: "頭像",
    equippedKey: "avatarItemId",
    emptyText: "尚未擁有可切換的頭像。",
  },
  card_skin: {
    id: "card_skin",
    label: "卡面",
    equippedKey: "cardSkinItemId",
    emptyText: "尚未擁有可切換的卡面。",
  },
  card_back: {
    id: "card_back",
    label: "卡背",
    equippedKey: "cardBackItemId",
    emptyText: "尚未擁有可切換的卡背。",
  },
  board_skin: {
    id: "board_skin",
    label: "盤面",
    equippedKey: "boardSkinItemId",
    emptyText: "尚未擁有可切換的盤面。",
  },
};

function createDefaultEquippedState(playerId = null) {
  return {
    playerId,
    avatarId: null,
    avatarItemId: null,
    cardSkinItemId: null,
    cardSkinOverrides: {},
    cardBackItemId: null,
    boardSkinItemId: null,
    updatedAt: null,
  };
}

function normalizeEquippedItems(equipped, playerId = null) {
  if (!equipped) {
    return createDefaultEquippedState(playerId);
  }

  return {
    ...createDefaultEquippedState(playerId),
    ...equipped,
    cardSkinOverrides:
      equipped?.cardSkinOverrides && typeof equipped.cardSkinOverrides === "object"
        ? equipped.cardSkinOverrides
        : {},
  };
}

function normalizeEquipmentInventory(items = [], equipped = createDefaultEquippedState()) {
  const equippedState = normalizeEquippedItems(equipped);

  return items
    .map((entry) => {
      const item = entry?.item;

      if (!item || !EQUIPMENT_CATEGORY_META[item.type]) {
        return null;
      }

      const categoryMeta = EQUIPMENT_CATEGORY_META[item.type];
      const equippedItemId = equippedState[categoryMeta.equippedKey];

      return {
        selectionId: String(item.id),
        inventoryId: entry.id,
        shopItemId: item.id,
        shopItem: item,
        playerId: entry.playerId,
        quantity: Number(entry.quantity) || 0,
        type: item.type,
        categoryId: categoryMeta.id,
        categoryLabel: categoryMeta.label,
        name: item.name,
        description: item.description || "",
        previewImage:
          (item.type === "card_skin" ? getCardSkinThemeLogo(item) : "") ||
          resolveImageAssetUrl(item.imageUrl || item.image_url) ||
          "",
        price: item.price,
        currency: item.currency,
        isOwned: (Number(entry.quantity) || 0) > 0,
        isEquipped: item.id === equippedItemId,
      };
    })
    .filter(Boolean);
}

function buildEquipmentSections(items = [], equipped = createDefaultEquippedState()) {
  const normalizedItems = normalizeEquipmentInventory(items, equipped);

  return EQUIPMENT_CATEGORY_ORDER.map((categoryId) => {
    const categoryMeta = EQUIPMENT_CATEGORY_META[categoryId];
    const categoryItems = normalizedItems.filter((item) => item.categoryId === categoryId);

    return {
      ...categoryMeta,
      count: categoryItems.length,
      equippedItemId: equipped?.[categoryMeta.equippedKey] ?? null,
      items: categoryItems,
    };
  });
}

function getEquipmentCategoryMeta(categoryId) {
  return EQUIPMENT_CATEGORY_META[categoryId] ?? null;
}

function patchEquippedState(equipped, categoryId, shopItemId) {
  const categoryMeta = getEquipmentCategoryMeta(categoryId);

  if (!categoryMeta) {
    return normalizeEquippedItems(equipped);
  }

  return {
    ...normalizeEquippedItems(equipped),
    [categoryMeta.equippedKey]: shopItemId,
    updatedAt: new Date().toISOString(),
  };
}

export {
  EQUIPMENT_CATEGORY_META,
  EQUIPMENT_CATEGORY_ORDER,
  buildEquipmentSections,
  createDefaultEquippedState,
  getEquipmentCategoryMeta,
  normalizeEquipmentInventory,
  normalizeEquippedItems,
  patchEquippedState,
};
