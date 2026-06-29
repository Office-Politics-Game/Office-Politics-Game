import { apiClient } from "./apiClient.js";

const ROOM_API_PATH = "/rooms";
const GAME_STATE_API_PATH = "/game-states";

function getTrimmedRoomCode(roomCode) {
  return typeof roomCode === "string" ? roomCode.trim() : "";
}

function buildRoomPath(roomCode, action) {
  const normalizedRoomCode = getTrimmedRoomCode(roomCode);

  if (!normalizedRoomCode) {
    throw new Error("缺少房間代碼。");
  }

  return `${ROOM_API_PATH}/${encodeURIComponent(normalizedRoomCode)}/${action}`;
}

function createRoom(payload) {
  return apiClient.post(ROOM_API_PATH, payload);
}

function joinRoom(roomCode, payload) {
  return apiClient.post(buildRoomPath(roomCode, "join"), payload);
}

function getRoomState(roomCode) {
  return apiClient.get(`${ROOM_API_PATH}/${encodeURIComponent(roomCode)}/state`);
}

function updateRoomState(roomCode, payload) {
  return apiClient.patch(buildRoomPath(roomCode, "state"), payload);
}

function startRoom(roomCode, payload) {
  return apiClient.post(buildRoomPath(roomCode, "start"), payload);
}

function getRoomGameState(roomCode, playerId) {
  return apiClient.get(
    `${GAME_STATE_API_PATH}/room/${encodeURIComponent(roomCode)}`,
    {
      params: { playerId },
    },
  );
}

export {
  createRoom,
  joinRoom,
  getRoomState,
  getRoomGameState,
  updateRoomState,
  startRoom,
};
