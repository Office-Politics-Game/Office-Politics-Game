import { apiClient } from "./apiClient.js";

const SHOP_API_PATH = "/shop";

function getShopItems(params = {}) {
  return apiClient.get(`${SHOP_API_PATH}/items`, { params });
}

function getPlayerShopItems(playerId) {
  return apiClient.get(`${SHOP_API_PATH}/players/${playerId}/items`);
}

function getPlayerEquippedItems(playerId) {
  return apiClient.get(`${SHOP_API_PATH}/players/${playerId}/equipped`);
}

function purchaseShopItem({ playerId, shopItemId, quantity = 1 }) {
  return apiClient.post(`${SHOP_API_PATH}/purchase`, {
    playerId,
    shopItemId,
    quantity,
  });
}

function equipShopItem({ playerId, shopItemId = null, categoryId = null }) {
  return apiClient.post(`${SHOP_API_PATH}/equip`, {
    playerId,
    shopItemId,
    categoryId,
  });
}

function updateCardSkinLoadout({ playerId, cardSkinItemId = null, cardSkinOverrides = {} }) {
  return apiClient.post(`${SHOP_API_PATH}/equip-card-skins`, {
    playerId,
    cardSkinItemId,
    cardSkinOverrides,
  });
}

function unequipShopItem({ playerId, categoryId }) {
  return apiClient.post(`${SHOP_API_PATH}/unequip`, {
    playerId,
    categoryId,
  });
}

function getCloudinaryUploadConfig() {
  return apiClient.get(`${SHOP_API_PATH}/cloudinary/config`);
}

function createCloudinaryUploadSignature(payload = {}) {
  return apiClient.post(`${SHOP_API_PATH}/cloudinary/sign-upload`, payload);
}

export {
  createCloudinaryUploadSignature,
  equipShopItem,
  getCloudinaryUploadConfig,
  getPlayerEquippedItems,
  getPlayerShopItems,
  getShopItems,
  purchaseShopItem,
  unequipShopItem,
  updateCardSkinLoadout,
};
