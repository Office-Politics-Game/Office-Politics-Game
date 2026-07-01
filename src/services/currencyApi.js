import { apiClient } from "./apiClient.js";

const PLAYER_API_PATH = "/players";

function getPlayerCurrency(playerId) {
  return apiClient.get(`${PLAYER_API_PATH}/${playerId}/currency`);
}

export { getPlayerCurrency };