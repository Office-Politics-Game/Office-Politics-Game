import assert from "node:assert/strict";
import {
  getCurrencyBalance,
  getOwnedShopItemIdSet,
  normalizeShopItem,
} from "../src/services/shopItemMapper.js";

const categories = [
  { id: "card-front", name: "卡面" },
  { id: "ticket", name: "抽卡券" },
];

const ownedShopItemIds = getOwnedShopItemIdSet([
  { playerId: 1, shopItemId: 2, quantity: 1 },
]);

const buyableItem = normalizeShopItem(
  {
    id: 1,
    name: "顧問風格卡面",
    description: "以資深顧問卡面為基底。",
    type: "card_skin",
    price: 620,
    currency: "coin",
    imageUrl: "/images/card-bg-advisor.webp",
    isActive: true,
  },
  { categories, ownedShopItemIds },
);

assert.equal(buyableItem.category, "card-front");
assert.equal(buyableItem.categoryLabel, "卡面");
assert.equal(buyableItem.price, "620");
assert.equal(buyableItem.actionState, "buy");
assert.equal(buyableItem.actionLabel, "立即購買");

const repeatableTicketItem = normalizeShopItem(
  {
    id: 2,
    name: "單張抽卡券",
    type: "gacha_ticket",
    price: 100,
    currency: "ticket",
    imageUrl: "/images/lottery-ticket.webp",
    isActive: true,
  },
  { categories, fallbackImage: "/fallback.webp", ownedShopItemIds },
);

assert.equal(repeatableTicketItem.category, "ticket");
assert.equal(repeatableTicketItem.previewImage, "/images/lottery-ticket.webp");
assert.equal(repeatableTicketItem.previewImageClass, "item-card__preview-image--ticket");
assert.equal(repeatableTicketItem.actionState, "buy");
assert.equal(repeatableTicketItem.actionLabel, "立即購買");
assert.equal(getCurrencyBalance("ticket", { coins: 12, tickets: 3 }), 3);

console.log("mall shop item mapper tests passed");
