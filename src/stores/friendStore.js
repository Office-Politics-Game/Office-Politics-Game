import { defineStore } from "pinia";
import {
  acceptFriendRequest as acceptFriendRequestApi,
  getFriends as getFriendsApi,
  getReceivedFriendRequests,
  getSentFriendRequests,
  rejectFriendRequest as rejectFriendRequestApi,
  sendFriendRequest as sendFriendRequestApi,
} from "@/services/friendApi.js";
import { searchPlayers as searchPlayersApi } from "@/services/playerService.js";
import { useAuthStore } from "@/stores/authStore.js";
import { usePlayerStore } from "@/stores/playerStore.js";

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

function readSavedGuestPlayer() {
  if (typeof localStorage === "undefined") {
    return null;
  }

  try {
    return JSON.parse(localStorage.getItem("guestPlayer") || "null");
  } catch {
    localStorage.removeItem("guestPlayer");
    return null;
  }
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

export const useFriendStore = defineStore("friend", {
  state: () => ({
    currentPlayerId: null,
    friends: [],
    requests: [],
    sentInvites: [],
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
    isRequestProcessing: (state) => (requestId) =>
      state.processingRequestIds.includes(requestId),
  },

  actions: {
    getCurrentPlayerId() {
      const authStore = useAuthStore();
      const playerStore = usePlayerStore();
      const savedGuestPlayer = readSavedGuestPlayer();

      if (!playerStore.currentPlayer && savedGuestPlayer?.id) {
        playerStore.setCurrentPlayer(savedGuestPlayer);
      }

      const playerId =
        toPositiveInteger(authStore.currentPlayer?.id) ??
        toPositiveInteger(playerStore.currentPlayerId) ??
        toPositiveInteger(savedGuestPlayer?.id);

      if (!playerId) {
        throw new Error("請先登入或建立訪客玩家資料");
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
      this.isLoading = true;
      this.errorMessage = "";

      try {
        const playerId = this.getCurrentPlayerId();
        const [friendsData, receivedData, sentData] = await Promise.all([
          getFriendsApi(playerId),
          getReceivedFriendRequests(playerId),
          getSentFriendRequests(playerId),
        ]);

        this.friends = (friendsData.friends ?? []).map(mapFriend);
        this.requests = (receivedData.requests ?? []).map(mapReceivedRequest);
        this.sentInvites = (sentData.requests ?? []).map(mapSentInvite);

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

    async acceptRequest(requestId) {
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
