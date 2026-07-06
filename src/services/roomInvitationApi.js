import { apiClient } from "./apiClient.js";

const ROOM_INVITATION_API_PATH = "/room-invitations";
const ROOM_API_PATH = "/rooms";

function sendRoomInvitation({ roomCode, inviterPlayerId, inviteePlayerId }) {
  return apiClient.post(
    `${ROOM_API_PATH}/${encodeURIComponent(roomCode)}/invitations`,
    {
      inviterPlayerId,
      inviteePlayerId,
    },
  );
}

function getPendingRoomInvitations(playerId) {
  return apiClient.get(ROOM_INVITATION_API_PATH, {
    params: { playerId },
  });
}

function acceptRoomInvitation({ invitationId, playerId }) {
  return apiClient.post(
    `${ROOM_INVITATION_API_PATH}/${encodeURIComponent(invitationId)}/accept`,
    { playerId },
  );
}

function rejectRoomInvitation({ invitationId, playerId }) {
  return apiClient.post(
    `${ROOM_INVITATION_API_PATH}/${encodeURIComponent(invitationId)}/reject`,
    { playerId },
  );
}

export {
  acceptRoomInvitation,
  getPendingRoomInvitations,
  rejectRoomInvitation,
  sendRoomInvitation,
};
