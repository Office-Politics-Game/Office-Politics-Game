import { defineStore } from "pinia";
import {
  acceptRoomInvitation as acceptRoomInvitationApi,
  getPendingRoomInvitations,
  rejectRoomInvitation as rejectRoomInvitationApi,
  sendRoomInvitation as sendRoomInvitationApi,
} from "@/services/roomInvitationApi.js";
import { useAuthStore } from "@/stores/authStore.js";
import { useRoomStore } from "@/stores/roomStore.js";
import { getDisplayErrorMessage } from "@/utils/errorMessages.js";

const ROOM_INVITATION_LOGIN_REQUIRED_MESSAGE =
  "登入後才能使用房間邀請功能";

function toPositiveInteger(value) {
  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return null;
  }

  return numberValue;
}

function formatDateTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function getAuthenticatedPlayerId() {
  const authStore = useAuthStore();

  if (!authStore.isLoggedIn || !authStore.currentPlayer?.id) {
    return null;
  }

  return toPositiveInteger(authStore.currentPlayer?.id);
}

function mapRoomInvitation(invitation) {
  const room = invitation.room ?? {};
  const inviter = invitation.inviter ?? {};
  const roomCode = invitation.roomCode ?? room.roomCode ?? "";

  return {
    id: invitation.id,
    roomId: invitation.roomId,
    roomCode,
    inviterPlayerId: invitation.inviterPlayerId,
    inviteePlayerId: invitation.inviteePlayerId,
    status: invitation.status,
    expiresAt: invitation.expiresAt,
    expiresAtLabel: formatDateTime(invitation.expiresAt),
    createdAt: invitation.createdAt,
    roomStatus: room.status ?? "waiting",
    playerCount: room.playerCount ?? 0,
    inviter: {
      playerId: inviter.playerId ?? invitation.inviterPlayerId,
      name: inviter.username || `玩家 ${invitation.inviterPlayerId}`,
      avatarId: inviter.avatarId,
      level: inviter.level ?? 1,
      online: Boolean(inviter.isOnline),
    },
  };
}

export const useRoomInvitationStore = defineStore("roomInvitation", {
  state: () => ({
    invitations: [],
    errorMessage: "",
    sendErrorMessage: "",
    noticeMessage: "",
    isLoading: false,
    isSending: false,
    processingInvitationIds: [],
  }),

  getters: {
    pendingInvitationCount: (state) => state.invitations.length,
    hasPendingInvitations: (state) => state.invitations.length > 0,
    isInvitationProcessing: (state) => (invitationId) =>
      state.processingInvitationIds.includes(Number(invitationId)),
    canUseRoomInvitations: () => Boolean(getAuthenticatedPlayerId()),
    loginRequiredMessage: () => ROOM_INVITATION_LOGIN_REQUIRED_MESSAGE,
  },

  actions: {
    clearMessages() {
      this.errorMessage = "";
      this.sendErrorMessage = "";
      this.noticeMessage = "";
    },

    clearInvitations() {
      this.invitations = [];
      this.errorMessage = "";
      this.sendErrorMessage = "";
      this.noticeMessage = "";
      this.isLoading = false;
      this.isSending = false;
      this.processingInvitationIds = [];
    },

    markLoginRequired({ send = false } = {}) {
      this.clearInvitations();
      this.errorMessage = ROOM_INVITATION_LOGIN_REQUIRED_MESSAGE;

      if (send) {
        this.sendErrorMessage = ROOM_INVITATION_LOGIN_REQUIRED_MESSAGE;
      }
    },

    getCurrentPlayerId() {
      const playerId = getAuthenticatedPlayerId();

      if (!playerId) {
        throw new Error(ROOM_INVITATION_LOGIN_REQUIRED_MESSAGE);
      }

      return playerId;
    },

    async loadInvitations() {
      if (!this.canUseRoomInvitations) {
        this.clearInvitations();
        return;
      }

      this.isLoading = true;
      this.errorMessage = "";

      try {
        const playerId = this.getCurrentPlayerId();
        const data = await getPendingRoomInvitations(playerId);

        this.invitations = (data.invitations ?? []).map(mapRoomInvitation);
      } catch (error) {
        this.errorMessage = getDisplayErrorMessage(error, "房間邀請載入失敗");
      } finally {
        this.isLoading = false;
      }
    },

    async sendInvitation({ roomCode, inviteePlayerId }) {
      if (!this.canUseRoomInvitations) {
        this.markLoginRequired({ send: true });
        return null;
      }

      const numericInviteePlayerId = toPositiveInteger(inviteePlayerId);

      if (!roomCode || !numericInviteePlayerId) {
        this.sendErrorMessage = "請選擇要邀請的好友";
        return null;
      }

      this.isSending = true;
      this.sendErrorMessage = "";
      this.noticeMessage = "";

      try {
        const inviterPlayerId = this.getCurrentPlayerId();
        const data = await sendRoomInvitationApi({
          roomCode,
          inviterPlayerId,
          inviteePlayerId: numericInviteePlayerId,
        });
        const invitation = mapRoomInvitation(data.invitation);

        this.noticeMessage = "房間邀請已送出";
        return invitation;
      } catch (error) {
        this.sendErrorMessage = getDisplayErrorMessage(error, "送出房間邀請失敗");
        return null;
      } finally {
        this.isSending = false;
      }
    },

    async acceptInvitation(invitationId) {
      if (!this.canUseRoomInvitations) {
        this.markLoginRequired();
        return null;
      }

      const numericInvitationId = toPositiveInteger(invitationId);

      if (!numericInvitationId) {
        this.errorMessage = "房間邀請資料不正確";
        return null;
      }

      if (this.processingInvitationIds.includes(numericInvitationId)) {
        return null;
      }

      this.processingInvitationIds.push(numericInvitationId);
      this.errorMessage = "";
      this.noticeMessage = "";

      try {
        const playerId = this.getCurrentPlayerId();
        const data = await acceptRoomInvitationApi({
          invitationId: numericInvitationId,
          playerId,
        });
        const roomCode = data.room?.roomCode || data.invitation?.roomCode;
        const roomStore = useRoomStore();

        this.invitations = this.invitations.filter(
          (invitation) => Number(invitation.id) !== numericInvitationId,
        );

        if (roomCode) {
          roomStore.roomCode = roomCode;
          await roomStore.fetchRoomState(roomCode);
          await roomStore.subscribeToRoom({
            roomCode,
            playerId,
            force: true,
          }).catch(() => null);
        }

        this.noticeMessage = "已接受房間邀請";
        return data;
      } catch (error) {
        this.errorMessage = getDisplayErrorMessage(error, "接受房間邀請失敗");
        return null;
      } finally {
        this.processingInvitationIds = this.processingInvitationIds.filter(
          (id) => id !== numericInvitationId,
        );
      }
    },

    async rejectInvitation(invitationId) {
      if (!this.canUseRoomInvitations) {
        this.markLoginRequired();
        return null;
      }

      const numericInvitationId = toPositiveInteger(invitationId);

      if (!numericInvitationId) {
        this.errorMessage = "房間邀請資料不正確";
        return null;
      }

      if (this.processingInvitationIds.includes(numericInvitationId)) {
        return null;
      }

      this.processingInvitationIds.push(numericInvitationId);
      this.errorMessage = "";
      this.noticeMessage = "";

      try {
        await rejectRoomInvitationApi({
          invitationId: numericInvitationId,
        });

        this.invitations = this.invitations.filter(
          (invitation) => Number(invitation.id) !== numericInvitationId,
        );
        this.noticeMessage = "已拒絕房間邀請";
      } catch (error) {
        this.errorMessage = getDisplayErrorMessage(error, "拒絕房間邀請失敗");
      } finally {
        this.processingInvitationIds = this.processingInvitationIds.filter(
          (id) => id !== numericInvitationId,
        );
      }
    },
  },
});
