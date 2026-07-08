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

function equipShopItem({ playerId, shopItemId }) {
  return apiClient.post(`${SHOP_API_PATH}/equip`, {
    playerId,
    shopItemId,
  });
}

export {
  equipShopItem,
  getPlayerEquippedItems,
  getPlayerShopItems,
  getShopItems,
  purchaseShopItem,
};
