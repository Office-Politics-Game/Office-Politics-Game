import { apiClient } from "./apiClient.js";

const CHAT_API_PATH = "/chats";

function getDirectMessages({ playerId, friendId }) {
  return apiClient.get(`${CHAT_API_PATH}/direct/${friendId}/messages`, {
    params: { playerId },
  });
}

function sendDirectMessage({ playerId, friendId, content }) {
  return apiClient.post(`${CHAT_API_PATH}/direct/${friendId}/messages`, {
    playerId,
    content,
  });
}

export { getDirectMessages, sendDirectMessage };
