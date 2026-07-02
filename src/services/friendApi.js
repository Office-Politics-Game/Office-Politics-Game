import { apiClient } from "./apiClient.js";

const FRIEND_API_PATH = "/friends";

function getFriends(playerId) {
  return apiClient.get(FRIEND_API_PATH, {
    params: { playerId },
  });
}

function getReceivedFriendRequests(playerId) {
  return apiClient.get(`${FRIEND_API_PATH}/requests/received`, {
    params: { playerId },
  });
}

function getSentFriendRequests(playerId) {
  return apiClient.get(`${FRIEND_API_PATH}/requests/sent`, {
    params: { playerId },
  });
}

function sendFriendRequest({ playerId, targetPlayerId }) {
  return apiClient.post(`${FRIEND_API_PATH}/requests`, {
    playerId,
    targetPlayerId,
  });
}

function acceptFriendRequest({ requestId, playerId }) {
  return apiClient.post(`${FRIEND_API_PATH}/requests/${requestId}/accept`, {
    playerId,
  });
}

function rejectFriendRequest({ requestId, playerId }) {
  return apiClient.post(`${FRIEND_API_PATH}/requests/${requestId}/reject`, {
    playerId,
  });
}

export {
  acceptFriendRequest,
  getFriends,
  getReceivedFriendRequests,
  getSentFriendRequests,
  rejectFriendRequest,
  sendFriendRequest,
};
