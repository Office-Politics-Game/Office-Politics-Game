import { apiClient } from "./apiClient.js";

const GACHA_API_PATH = "/gacha";

function drawGacha({ playerId, count = 1, poolId = "role_cards" }) {
  return apiClient.post(`${GACHA_API_PATH}/draw`, {
    playerId,
    count,
    poolId,
  });
}

function getOwnedGachaCards({ playerId, poolId = "role_cards" }) {
  return apiClient.get(`${GACHA_API_PATH}/owned-cards`, {
    params: { playerId, poolId },
  });
}

export {
  drawGacha,
  getOwnedGachaCards,
};
