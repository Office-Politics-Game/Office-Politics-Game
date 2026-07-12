import { apiClient } from "./apiClient.js"

const PLAYER_API_PATH = "/players"

function getPlayerAchievements(playerId) {
  return apiClient.get(`${PLAYER_API_PATH}/${playerId}/achievements`)
}

export { getPlayerAchievements }
