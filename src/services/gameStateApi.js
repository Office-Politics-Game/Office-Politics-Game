import { apiClient } from "./apiClient.js";

const ROOM_API_PATH = "/rooms";
const PLAYER_API_PATH = "/players";

function createGuestPlayer(payload) {
  return apiClient.post(`${PLAYER_API_PATH}/guest`, payload);
}

function getRoomState(roomCode, payload) {
  const params = {};

  if (payload) {
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params[key] = value;
      }
    });
  }

  return apiClient.get(`${ROOM_API_PATH}/${encodeURIComponent(roomCode)}/state`, {
    params,
  });
}

export { getRoomState, createGuestPlayer };
