import { defineStore } from "pinia";
import {
  mockFriendMessages,
  mockFriendRequests,
  mockFriends,
} from "@/mocks/friendMockData.js";

function cloneList(list) {
  return list.map((item) => ({ ...item }));
}

function createRequestKeyword(value) {
  return value.trim().replace(/\s+/g, " ");
}

function formatCurrentTime() {
  return new Intl.DateTimeFormat("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

export const useFriendStore = defineStore("friend", {
  state: () => ({
    friends: cloneList(mockFriends),
    requests: cloneList(mockFriendRequests),
    sentInvites: [],
    messages: cloneList(mockFriendMessages),
    selectedFriendId: mockFriends[0]?.id ?? null,
    noticeMessage: "",
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
    selectedFriendMessages: (state) =>
      state.messages.filter(
        (message) => message.friendId === state.selectedFriendId,
      ),
    pendingRequestCount: (state) => state.requests.length,
  },

  actions: {
    selectFriend(friendId) {
      if (this.friends.some((friend) => friend.id === friendId)) {
        this.selectedFriendId = friendId;
      }
    },

    sendFriendRequest(value) {
      const keyword = createRequestKeyword(value);

      if (!keyword) {
        return;
      }

      const duplicateInvite = this.sentInvites.some(
        (invite) => invite.keyword.toLowerCase() === keyword.toLowerCase(),
      );

      if (duplicateInvite) {
        this.noticeMessage = "已送出過這位玩家的好友邀請";
        return;
      }

      this.sentInvites.unshift({
        id: `sent-${Date.now()}`,
        keyword,
        status: "pending",
        sentAt: "剛剛",
      });
      this.noticeMessage = `已送出好友邀請給 ${keyword}`;
    },

    acceptRequest(requestId) {
      const request = this.requests.find((item) => item.id === requestId);

      if (!request) {
        return;
      }

      const nextFriend = {
        id: `friend-${request.playerId.toLowerCase()}`,
        playerId: request.playerId,
        name: request.name,
        status: "在線上",
        statusType: "online",
        online: true,
      };

      if (!this.friends.some((friend) => friend.playerId === request.playerId)) {
        this.friends.unshift(nextFriend);
        this.selectedFriendId = nextFriend.id;
      }

      this.requests = this.requests.filter((item) => item.id !== requestId);
      this.noticeMessage = `已接受 ${request.name} 的好友邀請`;
    },

    rejectRequest(requestId) {
      const request = this.requests.find((item) => item.id === requestId);

      this.requests = this.requests.filter((item) => item.id !== requestId);

      if (request) {
        this.noticeMessage = `已拒絕 ${request.name} 的好友邀請`;
      }
    },

    sendMessage(text) {
      const value = text.trim();

      if (!value || !this.selectedFriendId) {
        return;
      }

      this.messages.push({
        id: `message-${Date.now()}`,
        friendId: this.selectedFriendId,
        from: "me",
        time: formatCurrentTime(),
        text: value,
      });
    },

    clearNotice() {
      this.noticeMessage = "";
    },
  },
});
