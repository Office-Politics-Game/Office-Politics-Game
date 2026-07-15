import { apiClient } from "./apiClient.js";

const PLAYER_API_PATH = "/players";

function updatePlayerAvatar(playerId, avatarId) {
  return apiClient.patch(`${PLAYER_API_PATH}/${playerId}/avatar`, {
    avatarId,
  });
}

export { updatePlayerAvatar };
