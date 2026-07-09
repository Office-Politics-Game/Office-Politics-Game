import { defineStore } from "pinia";
import {
  acceptFriendRequest as acceptFriendRequestApi,
  blockPlayer as blockPlayerApi,
  getBlockedPlayers,
  getFriends as getFriendsApi,
  getReceivedFriendRequests,
  getSentFriendRequests,
  removeFriend as removeFriendApi,
  rejectFriendRequest as rejectFriendRequestApi,
  sendFriendRequest as sendFriendRequestApi,
  unblockPlayer as unblockPlayerApi,
} from "@/services/friendApi.js";
import { searchPlayers as searchPlayersApi } from "@/services/playerService.js";
import { useAuthStore } from "@/stores/authStore.js";

const FRIEND_LOGIN_REQUIRED_MESSAGE = "登入後才能使用好友功能";

function normalizeKeyword(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function toPositiveInteger(value) {
  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return null;
  }

  return numberValue;
}

function formatRecordTime(value) {
  if (!value) {
    return "剛剛";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "剛剛";
  }

  return new Intl.DateTimeFormat("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function mapFriend(friend) {
  const playerId = friend.playerId ?? friend.id;
  const isOnline = Boolean(friend.isOnline);

  return {
    id: String(playerId),
    friendshipId: friend.friendshipId,
    playerId: String(playerId),
    name: friend.username || `玩家 ${playerId}`,
    avatarId: friend.avatarId,
    level: friend.level ?? 1,
    status: isOnline ? "在線上" : "離線",
    statusType: isOnline ? "online" : "offline",
    online: isOnline,
    createdAt: friend.createdAt,
  };
}

function mapPlayerSearchResult(player) {
  const isOnline = Boolean(player.isOnline);

  return {
    id: String(player.id),
    playerId: String(player.id),
    name: player.username || `玩家 ${player.id}`,
    avatarId: player.avatarId,
    level: player.level ?? 1,
    status: isOnline ? "在線上" : "離線",
    statusType: isOnline ? "online" : "offline",
    online: isOnline,
    friendshipId: player.friendshipId,
    relationStatus: player.relationStatus ?? null,
  };
}

function mapReceivedRequest(request) {
  const requester = request.requester ?? {};

  return {
    id: request.id,
    playerId: String(requester.playerId ?? request.playerId),
    name: requester.username || `玩家 ${requester.playerId ?? request.playerId}`,
    avatarId: requester.avatarId,
    level: requester.level ?? 1,
    online: Boolean(requester.isOnline),
    requestedAt: formatRecordTime(request.createdAt),
    note: "想加入你的好友清單。",
  };
}

function mapSentInvite(request) {
  const receiver = request.receiver ?? {};

  return {
    id: request.id,
    playerId: String(receiver.playerId ?? request.friendId),
    name: receiver.username || `玩家 ${receiver.playerId ?? request.friendId}`,
    avatarId: receiver.avatarId,
    level: receiver.level ?? 1,
    online: Boolean(receiver.isOnline),
    status: request.status,
    sentAt: formatRecordTime(request.createdAt),
  };
}

function mapBlockedPlayer(player) {
  const playerId = player.playerId ?? player.id;
  const isOnline = Boolean(player.isOnline);

  return {
    id: String(player.blockId),
    blockId: player.blockId,
    playerId: String(playerId),
    name: player.username || `玩家 ${playerId}`,
    avatarId: player.avatarId,
    level: player.level ?? 1,
    status: isOnline ? "在線上" : "離線",
    statusType: isOnline ? "online" : "offline",
    online: isOnline,
    createdAt: player.createdAt,
  };
}

function getAuthenticatedPlayerId() {
  const authStore = useAuthStore();

  if (!authStore.isLoggedIn || !authStore.currentPlayer?.id) {
    return null;
  }

  return toPositiveInteger(authStore.currentPlayer?.id);
}

export const useFriendStore = defineStore("friend", {
  state: () => ({
    currentPlayerId: null,
    friends: [],
    requests: [],
    sentInvites: [],
    blockedPlayers: [],
    searchResults: [],
    selectedFriendId: null,
    lastSearchKeyword: "",
    noticeMessage: "",
    errorMessage: "",
    searchErrorMessage: "",
    isLoading: false,
    isSearching: false,
    isSending: false,
    processingRequestIds: [],
    processingFriendshipIds: [],
    processingPlayerIds: [],
    processingBlockIds: [],
  }),

  getters: {
    selectedFriend: (state) =>
      state.friends.find((friend) => friend.id === state.selectedFriendId) ??
      null,
    onlineFriends: (state) =>
      state.friends.filter((friend) => friend.statusType === "online"),
    playingFriends: (state) =>
      state.friends.filter((friend) => friend.statusType === "playing"),
    offlineFriends: (state) =>
      state.friends.filter((friend) => friend.statusType === "offline"),
    pendingRequestCount: (state) => state.requests.length,
    blockedPlayerCount: (state) => state.blockedPlayers.length,
    isRequestProcessing: (state) => (requestId) =>
      state.processingRequestIds.includes(requestId),
    isFriendshipProcessing: (state) => (friendshipId) =>
      state.processingFriendshipIds.includes(Number(friendshipId)),
    isPlayerProcessing: (state) => (playerId) =>
      state.processingPlayerIds.includes(Number(playerId)),
    isBlockProcessing: (state) => (blockId) =>
      state.processingBlockIds.includes(Number(blockId)),
    canUseFriendSystem: () => Boolean(getAuthenticatedPlayerId()),
    friendLoginRequiredMessage: () => FRIEND_LOGIN_REQUIRED_MESSAGE,
  },

  actions: {
    clearFriendData() {
      this.currentPlayerId = null;
      this.friends = [];
      this.requests = [];
      this.sentInvites = [];
      this.blockedPlayers = [];
      this.searchResults = [];
      this.selectedFriendId = null;
      this.lastSearchKeyword = "";
      this.noticeMessage = "";
      this.errorMessage = "";
      this.searchErrorMessage = "";
      this.isLoading = false;
      this.isSearching = false;
      this.isSending = false;
      this.processingRequestIds = [];
      this.processingFriendshipIds = [];
      this.processingPlayerIds = [];
      this.processingBlockIds = [];
    },

    markLoginRequired({ search = false } = {}) {
      this.clearFriendData();
      this.errorMessage = FRIEND_LOGIN_REQUIRED_MESSAGE;

      if (search) {
        this.searchErrorMessage = FRIEND_LOGIN_REQUIRED_MESSAGE;
      }
    },

    getCurrentPlayerId() {
      const playerId = getAuthenticatedPlayerId();

      if (!playerId) {
        this.currentPlayerId = null;
        throw new Error(FRIEND_LOGIN_REQUIRED_MESSAGE);
      }

      this.currentPlayerId = playerId;
      return playerId;
    },

    selectFriend(friendId) {
      if (this.friends.some((friend) => friend.id === friendId)) {
        this.selectedFriendId = friendId;
      }
    },

    async loadFriendData() {
      if (!this.canUseFriendSystem) {
        this.markLoginRequired();
        return;
      }

      this.isLoading = true;
      this.errorMessage = "";

      try {
        const playerId = this.getCurrentPlayerId();
        const [friendsData, receivedData, sentData, blockedData] =
          await Promise.all([
            getFriendsApi(playerId),
            getReceivedFriendRequests(playerId),
            getSentFriendRequests(playerId),
            getBlockedPlayers(playerId),
          ]);

        this.friends = (friendsData.friends ?? []).map(mapFriend);
        this.requests = (receivedData.requests ?? []).map(mapReceivedRequest);
        this.sentInvites = (sentData.requests ?? []).map(mapSentInvite);
        this.blockedPlayers = (blockedData.blockedPlayers ?? []).map(
          mapBlockedPlayer,
        );

        if (
          this.selectedFriendId &&
          !this.friends.some((friend) => friend.id === this.selectedFriendId)
        ) {
          this.selectedFriendId = null;
        }

        if (!this.selectedFriendId && this.friends.length > 0) {
          this.selectedFriendId = this.friends[0].id;
        }
      } catch (error) {
        this.errorMessage = error.message || "好友資料載入失敗";
      } finally {
        this.isLoading = false;
      }
    },

    async searchPlayers(keyword) {
      const normalizedKeyword = normalizeKeyword(keyword);

      if (!this.canUseFriendSystem) {
        this.markLoginRequired({ search: true });
        return;
      }

      if (!normalizedKeyword) {
        this.searchErrorMessage = "請輸入玩家暱稱或玩家 ID";
        this.searchResults = [];
        return;
      }

      this.isSearching = true;
      this.searchErrorMessage = "";
      this.noticeMessage = "";
      this.lastSearchKeyword = normalizedKeyword;

      try {
        const playerId = this.getCurrentPlayerId();
        const data = await searchPlayersApi({
          keyword: normalizedKeyword,
          playerId,
        });

        this.searchResults = (data.players ?? []).map(mapPlayerSearchResult);

        if (this.searchResults.length === 0) {
          this.noticeMessage = "找不到符合條件的玩家";
        }
      } catch (error) {
        this.searchResults = [];
        this.searchErrorMessage = error.message || "搜尋玩家失敗";
      } finally {
        this.isSearching = false;
      }
    },

    async sendFriendRequest(targetPlayerId) {
      if (!this.canUseFriendSystem) {
        this.markLoginRequired({ search: true });
        return;
      }

      const numericTargetPlayerId = toPositiveInteger(targetPlayerId);

      if (!numericTargetPlayerId) {
        this.searchErrorMessage = "好友邀請對象不正確";
        return;
      }

      this.isSending = true;
      this.searchErrorMessage = "";
      this.noticeMessage = "";

      const targetPlayer = this.searchResults.find(
        (player) => Number(player.playerId) === numericTargetPlayerId,
      );

      try {
        const playerId = this.getCurrentPlayerId();

        await sendFriendRequestApi({
          playerId,
          targetPlayerId: numericTargetPlayerId,
        });
        await this.loadFriendData();

        this.searchResults = this.searchResults.map((player) =>
          Number(player.playerId) === numericTargetPlayerId
            ? { ...player, relationStatus: "pending" }
            : player,
        );
        this.noticeMessage = `已送出好友邀請給 ${
          targetPlayer?.name ?? `玩家 ${numericTargetPlayerId}`
        }`;
      } catch (error) {
        this.searchErrorMessage = error.message || "送出好友邀請失敗";
      } finally {
        this.isSending = false;
      }
    },

    async removeFriend(friendshipId) {
      if (!this.canUseFriendSystem) {
        this.markLoginRequired();
        return;
      }

      const numericFriendshipId = toPositiveInteger(friendshipId);

      if (!numericFriendshipId) {
        this.errorMessage = "好友關係不正確";
        return;
      }

      if (this.processingFriendshipIds.includes(numericFriendshipId)) {
        return;
      }

      this.processingFriendshipIds.push(numericFriendshipId);
      this.errorMessage = "";
      this.noticeMessage = "";

      const friend = this.friends.find(
        (item) => Number(item.friendshipId) === numericFriendshipId,
      );

      try {
        const playerId = this.getCurrentPlayerId();

        await removeFriendApi({
          friendshipId: numericFriendshipId,
          playerId,
        });
        await this.loadFriendData();

        this.noticeMessage = `已解除與 ${friend?.name ?? "玩家"} 的好友關係`;
      } catch (error) {
        this.errorMessage = error.message || "解除好友失敗";
      } finally {
        this.processingFriendshipIds = this.processingFriendshipIds.filter(
          (id) => id !== numericFriendshipId,
        );
      }
    },

    async blockPlayer(targetPlayerId) {
      if (!this.canUseFriendSystem) {
        this.markLoginRequired({ search: true });
        return;
      }

      const numericTargetPlayerId = toPositiveInteger(targetPlayerId);

      if (!numericTargetPlayerId) {
        this.errorMessage = "封鎖對象不正確";
        return;
      }

      if (this.processingPlayerIds.includes(numericTargetPlayerId)) {
        return;
      }

      this.processingPlayerIds.push(numericTargetPlayerId);
      this.errorMessage = "";
      this.searchErrorMessage = "";
      this.noticeMessage = "";

      const targetPlayer =
        this.friends.find(
          (friend) => Number(friend.playerId) === numericTargetPlayerId,
        ) ??
        this.searchResults.find(
          (player) => Number(player.playerId) === numericTargetPlayerId,
        );

      try {
        const playerId = this.getCurrentPlayerId();

        await blockPlayerApi({
          playerId,
          targetPlayerId: numericTargetPlayerId,
        });
        await this.loadFriendData();

        this.searchResults = this.searchResults.map((player) =>
          Number(player.playerId) === numericTargetPlayerId
            ? { ...player, relationStatus: "blocked" }
            : player,
        );
        this.noticeMessage = `已封鎖 ${
          targetPlayer?.name ?? `玩家 ${numericTargetPlayerId}`
        }`;
      } catch (error) {
        const message = error.message || "封鎖玩家失敗";
        this.errorMessage = message;
        this.searchErrorMessage = message;
      } finally {
        this.processingPlayerIds = this.processingPlayerIds.filter(
          (id) => id !== numericTargetPlayerId,
        );
      }
    },

    async unblockPlayer(blockId) {
      if (!this.canUseFriendSystem) {
        this.markLoginRequired();
        return;
      }

      const numericBlockId = toPositiveInteger(blockId);

      if (!numericBlockId) {
        this.errorMessage = "封鎖關係不正確";
        return;
      }

      if (this.processingBlockIds.includes(numericBlockId)) {
        return;
      }

      this.processingBlockIds.push(numericBlockId);
      this.errorMessage = "";
      this.noticeMessage = "";

      const blockedPlayer = this.blockedPlayers.find(
        (player) => Number(player.blockId) === numericBlockId,
      );

      try {
        const playerId = this.getCurrentPlayerId();

        await unblockPlayerApi({
          blockId: numericBlockId,
          playerId,
        });
        await this.loadFriendData();

        this.searchResults = this.searchResults.map((player) =>
          player.playerId === blockedPlayer?.playerId
            ? { ...player, relationStatus: null, friendshipId: null }
            : player,
        );
        this.noticeMessage = `已取消封鎖 ${blockedPlayer?.name ?? "玩家"}`;
      } catch (error) {
        this.errorMessage = error.message || "取消封鎖失敗";
      } finally {
        this.processingBlockIds = this.processingBlockIds.filter(
          (id) => id !== numericBlockId,
        );
      }
    },

    async acceptRequest(requestId) {
      if (!this.canUseFriendSystem) {
        this.markLoginRequired();
        return;
      }

      if (this.processingRequestIds.includes(requestId)) {
        return;
      }

      this.processingRequestIds.push(requestId);
      this.errorMessage = "";

      const request = this.requests.find((item) => item.id === requestId);

      try {
        const playerId = this.getCurrentPlayerId();

        await acceptFriendRequestApi({ requestId, playerId });
        await this.loadFriendData();

        const acceptedFriend = this.friends.find(
          (friend) => friend.playerId === request?.playerId,
        );

        if (acceptedFriend) {
          this.selectedFriendId = acceptedFriend.id;
        }

        this.noticeMessage = `已接受 ${request?.name ?? "玩家"} 的好友邀請`;
      } catch (error) {
        this.errorMessage = error.message || "接受好友邀請失敗";
      } finally {
        this.processingRequestIds = this.processingRequestIds.filter(
          (id) => id !== requestId,
        );
      }
    },

    async rejectRequest(requestId) {
      if (!this.canUseFriendSystem) {
        this.markLoginRequired();
        return;
      }

      if (this.processingRequestIds.includes(requestId)) {
        return;
      }

      this.processingRequestIds.push(requestId);
      this.errorMessage = "";

      const request = this.requests.find((item) => item.id === requestId);

      try {
        const playerId = this.getCurrentPlayerId();

        await rejectFriendRequestApi({ requestId, playerId });
        await this.loadFriendData();

        this.noticeMessage = `已拒絕 ${request?.name ?? "玩家"} 的好友邀請`;
      } catch (error) {
        this.errorMessage = error.message || "拒絕好友邀請失敗";
      } finally {
        this.processingRequestIds = this.processingRequestIds.filter(
          (id) => id !== requestId,
        );
      }
    },

    clearNotice() {
      this.noticeMessage = "";
    },
  },
});
