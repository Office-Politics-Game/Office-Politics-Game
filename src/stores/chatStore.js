import { defineStore } from "pinia";
import {
  getDirectMessages as getDirectMessagesApi,
  sendDirectMessage as sendDirectMessageApi,
} from "@/services/chatApi.js";
import { emitWithAck, getSocket } from "@/services/socketClient.js";
import { useAuthStore } from "@/stores/authStore.js";

const CHAT_LOGIN_REQUIRED_MESSAGE = "登入後才能使用好友聊天";
const CHAT_REALTIME_UNAVAILABLE_MESSAGE = "好友聊天即時連線失敗";
const realtimeHandlersByStore = new WeakMap();
const realtimeGenerationByStore = new WeakMap();

function advanceRealtimeGeneration(store) {
  const generation = (realtimeGenerationByStore.get(store) ?? 0) + 1;
  realtimeGenerationByStore.set(store, generation);
  return generation;
}

function isRealtimeGenerationActive(store, generation) {
  return (
    store.isRealtimeStarted &&
    realtimeGenerationByStore.get(store) === generation
  );
}

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

function isValidDirectMessage(message) {
  return Boolean(
    toPositiveInteger(message?.id) &&
      toPositiveInteger(message?.senderPlayerId) &&
      toPositiveInteger(message?.receiverPlayerId),
  );
}

function compareDirectMessages(left, right) {
  const leftTime = Date.parse(left.createdAt);
  const rightTime = Date.parse(right.createdAt);

  if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) {
    return leftTime - rightTime;
  }

  return Number(left.id) - Number(right.id);
}

function mergeDirectMessages(...messageGroups) {
  const messagesById = new Map();

  messageGroups.flat().forEach((message) => {
    if (isValidDirectMessage(message)) {
      messagesById.set(String(message.id), message);
    }
  });

  return [...messagesById.values()].sort(compareDirectMessages);
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
    isRealtimeStarted: false,
    isRealtimeSubscribed: false,
    realtimeErrorMessage: "",
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
      this.stopRealtime();
      this.currentPlayerId = null;
      this.conversations = {};
      this.selectedFriendId = null;
      this.errorMessage = "";
      this.isLoading = false;
      this.isSending = false;
      this.realtimeErrorMessage = "";
    },

    async subscribeRealtime({
      recoverSelected = false,
      generation = realtimeGenerationByStore.get(this),
    } = {}) {
      const authStore = useAuthStore();

      if (!isRealtimeGenerationActive(this, generation)) {
        return false;
      }

      if (!authStore.isLoggedIn || !authStore.token) {
        this.isRealtimeSubscribed = false;
        this.realtimeErrorMessage = CHAT_LOGIN_REQUIRED_MESSAGE;
        return false;
      }

      try {
        await emitWithAck("chat:subscribe", { token: authStore.token });

        if (!isRealtimeGenerationActive(this, generation)) {
          return false;
        }

        this.isRealtimeSubscribed = true;
        this.realtimeErrorMessage = "";

        if (recoverSelected && this.selectedFriendId) {
          await this.loadMessages(this.selectedFriendId, {
            realtimeGeneration: generation,
          });
        }

        return true;
      } catch (error) {
        if (!isRealtimeGenerationActive(this, generation)) {
          return false;
        }

        this.isRealtimeSubscribed = false;
        this.realtimeErrorMessage =
          error?.message || CHAT_REALTIME_UNAVAILABLE_MESSAGE;
        return false;
      }
    },

    async startRealtime() {
      if (this.isRealtimeStarted) {
        return this.isRealtimeSubscribed;
      }

      const socket = getSocket();
      const generation = advanceRealtimeGeneration(this);
      const handleMessage = (message) => this.handleRealtimeMessage(message);
      const handleConnect = () =>
        this.subscribeRealtime({ recoverSelected: true, generation });

      realtimeHandlersByStore.set(this, {
        socket,
        handleMessage,
        handleConnect,
      });
      socket.on("chat:message", handleMessage);
      socket.on("connect", handleConnect);
      this.isRealtimeStarted = true;

      if (!socket.connected) {
        socket.connect();
        return false;
      }

      return this.subscribeRealtime({ generation });
    },

    stopRealtime() {
      advanceRealtimeGeneration(this);
      const handlers = realtimeHandlersByStore.get(this);

      if (handlers) {
        handlers.socket.off("chat:message", handlers.handleMessage);
        handlers.socket.off("connect", handlers.handleConnect);
        realtimeHandlersByStore.delete(this);

        if (handlers.socket.connected) {
          handlers.socket.emit("chat:unsubscribe", {}, () => {});
        }
      }

      this.isRealtimeStarted = false;
      this.isRealtimeSubscribed = false;
      this.isLoading = false;
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
        [String(friendId)]: mergeDirectMessages(messages),
      };
    },

    mergeMessages(friendId, messages) {
      const key = String(friendId);
      const existingMessages = this.conversations[key] ?? [];

      this.conversations = {
        ...this.conversations,
        [key]: mergeDirectMessages(existingMessages, messages),
      };
    },

    mergeMessagesForRealtimeGeneration(friendId, messages, generation) {
      if (!isRealtimeGenerationActive(this, generation)) {
        return false;
      }

      this.mergeMessages(friendId, messages);
      return true;
    },

    appendMessage(friendId, message) {
      this.mergeMessages(friendId, [message]);
    },

    handleRealtimeMessage(message) {
      if (!isValidDirectMessage(message)) {
        return;
      }

      this.mergeMessages(message.senderPlayerId, [message]);
    },

    async loadMessages(friendId, { realtimeGeneration } = {}) {
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

        if (realtimeGeneration === undefined) {
          this.mergeMessages(numericFriendId, data.messages ?? []);
        } else {
          this.mergeMessagesForRealtimeGeneration(
            numericFriendId,
            data.messages ?? [],
            realtimeGeneration,
          );
        }
      } catch (error) {
        if (
          realtimeGeneration === undefined ||
          isRealtimeGenerationActive(this, realtimeGeneration)
        ) {
          this.errorMessage = error.message || "聊天紀錄載入失敗";
        }
      } finally {
        if (
          realtimeGeneration === undefined ||
          isRealtimeGenerationActive(this, realtimeGeneration)
        ) {
          this.isLoading = false;
        }
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
