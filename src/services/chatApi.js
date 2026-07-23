import { apiClient } from "./apiClient.js";

const CHAT_API_PATH = "/chats";

function getDirectMessages(friendId) {
  return apiClient.get(`${CHAT_API_PATH}/direct/${friendId}/messages`);
}

function sendDirectMessage({ friendId, content }) {
  return apiClient.post(`${CHAT_API_PATH}/direct/${friendId}/messages`, {
    content,
  });
}

export { getDirectMessages, sendDirectMessage };
