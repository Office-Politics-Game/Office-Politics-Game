import { defineStore } from "pinia";
import {
  getDirectMessages as getDirectMessagesApi,
  sendDirectMessage as sendDirectMessageApi,
} from "@/services/chatApi.js";
import { useAuthStore } from "@/stores/authStore.js";

const CHAT_LOGIN_REQUIRED_MESSAGE = "登入後才能使用好友聊天";

function toPositiveInteger(value) {
  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return null;
  }

  return numberValue;
}

function normalizeMessageContent(value) {
  return String(value ?? "").trim();
}

function getAuthenticatedPlayerId() {
  const authStore = useAuthStore();

  if (!authStore.isLoggedIn || !authStore.token) {
    return null;
  }

  return toPositiveInteger(authStore.currentPlayer?.id);
}

export const useChatStore = defineStore("chat", {
  state: () => ({
    currentPlayerId: null,
    conversations: {},
    selectedFriendId: null,
    errorMessage: "",
    isLoading: false,
    isSending: false,
  }),

  getters: {
    selectedMessages: (state) => {
      if (!state.selectedFriendId) {
        return [];
      }

      return state.conversations[state.selectedFriendId] ?? [];
    },
    messagesByFriend: (state) => (friendId) => {
      const normalizedFriendId = String(friendId ?? "");

      if (!normalizedFriendId) {
        return [];
      }

      return state.conversations[normalizedFriendId] ?? [];
    },
  },

  actions: {
    clearChatData() {
      this.currentPlayerId = null;
      this.conversations = {};
      this.selectedFriendId = null;
      this.errorMessage = "";
      this.isLoading = false;
      this.isSending = false;
    },

    getCurrentPlayerId() {
      const playerId = getAuthenticatedPlayerId();

      if (!playerId) {
        this.currentPlayerId = null;
        this.errorMessage = CHAT_LOGIN_REQUIRED_MESSAGE;
        throw new Error(CHAT_LOGIN_REQUIRED_MESSAGE);
      }

      this.currentPlayerId = playerId;
      return playerId;
    },

    getValidFriendId(friendId) {
      const numericFriendId = toPositiveInteger(friendId);

      if (!numericFriendId) {
        this.errorMessage = "請先選擇好友";
        return null;
      }

      return numericFriendId;
    },

    setConversation(friendId, messages) {
      this.conversations = {
        ...this.conversations,
        [String(friendId)]: messages,
      };
    },

    appendMessage(friendId, message) {
      const key = String(friendId);
      const messages = this.conversations[key] ?? [];

      this.setConversation(friendId, [...messages, message]);
    },

    async loadMessages(friendId) {
      const numericFriendId = this.getValidFriendId(friendId);

      if (!numericFriendId) {
        return;
      }

      this.selectedFriendId = String(numericFriendId);
      this.isLoading = true;
      this.errorMessage = "";

      try {
        const playerId = this.getCurrentPlayerId();
        const data = await getDirectMessagesApi({
          playerId,
          friendId: numericFriendId,
        });

        this.setConversation(numericFriendId, data.messages ?? []);
      } catch (error) {
        this.errorMessage = error.message || "聊天紀錄載入失敗";
      } finally {
        this.isLoading = false;
      }
    },

    async sendMessage({ friendId, content }) {
      const numericFriendId = this.getValidFriendId(friendId);

      if (!numericFriendId) {
        return null;
      }

      const normalizedContent = normalizeMessageContent(content);

      if (!normalizedContent) {
        this.errorMessage = "請輸入訊息內容";
        return null;
      }

      this.selectedFriendId = String(numericFriendId);
      this.isSending = true;
      this.errorMessage = "";

      try {
        const playerId = this.getCurrentPlayerId();
        const data = await sendDirectMessageApi({
          playerId,
          friendId: numericFriendId,
          content: normalizedContent,
        });
        const directMessage = data.directMessage;

        if (directMessage) {
          this.appendMessage(numericFriendId, directMessage);
        }

        return directMessage ?? null;
      } catch (error) {
        this.errorMessage = error.message || "訊息送出失敗";
        return null;
      } finally {
        this.isSending = false;
      }
    },
  },
});
