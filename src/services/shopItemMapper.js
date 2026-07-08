import { getCardSkinThemeLogo } from "@/constants/cardSkinThemes.js";

const shopTypeCategoryMap = {
  avatar: "avatar",
  board_skin: "board",
  card_back: "card-back",
  card_skin: "card-front",
  gacha_ticket: "ticket",
};

const currencyColumnMap = {
  coin: "coins",
  diamond: "gems",
  ticket: "tickets",
};

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Number(value) || 0);
}

function getCurrencyBalance(currency, balances = {}) {
  const key = currencyColumnMap[currency] ?? "coins";

  return Number(balances[key] ?? 0);
}

function getOwnedShopItemIdSet(playerItems = []) {
  return new Set(
    playerItems
      .map((item) => Number(item.shopItemId ?? item.shop_item_id))
      .filter((itemId) => Number.isInteger(itemId)),
  );
}

function normalizeShopItem(item, options = {}) {
  const {
    categories = [],
    fallbackImage = "",
    ownedShopItemIds = new Set(),
  } = options;
  const id = Number(item.id);
  const category = shopTypeCategoryMap[item.type] ?? item.type;
  const categoryMeta = categories.find((candidate) => candidate.id === category);
  const isOwned = ownedShopItemIds.has(id);
  const isAvailable = item.isActive !== false;

  return {
    id,
    category,
    categoryLabel: categoryMeta?.name ?? item.type,
    name: item.name,
    description: item.description || "",
    summary: item.description || "",
    price: formatNumber(item.price),
    rawPrice: Number(item.price) || 0,
    currency: item.currency ?? "coin",
    actionLabel: isOwned ? "已擁有" : isAvailable ? "立即購買" : "敬請期待",
    actionState: isOwned ? "owned" : isAvailable ? "buy" : "coming",
    previewImage:
      (item.type === "card_skin" ? getCardSkinThemeLogo(item) : "") ||
      item.imageUrl ||
      item.image_url ||
      fallbackImage,
    shopItem: item,
  };
}

export {
  currencyColumnMap,
  formatNumber,
  getCurrencyBalance,
  getOwnedShopItemIdSet,
  normalizeShopItem,
  shopTypeCategoryMap,
};
