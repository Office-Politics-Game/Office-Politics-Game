import { apiClient } from "./apiClient.js";

const ROOM_INVITATION_API_PATH = "/room-invitations";
const ROOM_API_PATH = "/rooms";

function sendRoomInvitation({ roomCode, inviteePlayerId }) {
  return apiClient.post(
    `${ROOM_API_PATH}/${encodeURIComponent(roomCode)}/invitations`,
    {
      inviteePlayerId,
    },
  );
}

function getPendingRoomInvitations() {
  return apiClient.get(ROOM_INVITATION_API_PATH);
}

function acceptRoomInvitation({ invitationId }) {
  return apiClient.post(
    `${ROOM_INVITATION_API_PATH}/${encodeURIComponent(invitationId)}/accept`,
    {},
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
