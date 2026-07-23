import { defineStore } from "pinia";
import { toRaw } from "vue";
import {
  getDirectMessages as getDirectMessagesApi,
  sendDirectMessage as sendDirectMessageApi,
} from "@/services/chatApi.js";
import { emitWithAck, getSocket } from "@/services/socketClient.js";
import { useAuthStore } from "@/stores/authStore.js";
import { getDisplayErrorMessage } from "@/utils/errorMessages.js";

const CHAT_LOGIN_REQUIRED_MESSAGE = "登入後才能使用好友聊天";
const CHAT_REALTIME_UNAVAILABLE_MESSAGE = "好友聊天即時連線失敗";
const CHAT_REALTIME_DISCONNECTED_MESSAGE = "即時連線已中斷，正在重新連線";
const CHAT_REALTIME_RETRY_DELAY_MS = 250;
const CHAT_REALTIME_MAX_RETRIES = 3;
const realtimeHandlersByStore = new WeakMap();
const realtimeGenerationByStore = new WeakMap();
const realtimeRetryTimersByStore = new WeakMap();
const realtimeRetryCountsByStore = new WeakMap();
let nextOptimisticMessageId = -1;

function getRealtimeStoreKey(store) {
  return toRaw(store);
}

function advanceRealtimeGeneration(store) {
  const storeKey = getRealtimeStoreKey(store);
  const generation = (realtimeGenerationByStore.get(storeKey) ?? 0) + 1;
  realtimeGenerationByStore.set(storeKey, generation);
  return generation;
}

function isRealtimeGenerationActive(store, generation) {
  return (
    store.isRealtimeStarted &&
    realtimeGenerationByStore.get(getRealtimeStoreKey(store)) === generation
  );
}

function clearRealtimeRetry(store, { resetCount = false } = {}) {
  const storeKey = getRealtimeStoreKey(store);
  const retryTimer = realtimeRetryTimersByStore.get(storeKey);

  if (retryTimer) {
    clearTimeout(retryTimer);
    realtimeRetryTimersByStore.delete(storeKey);
  }

  if (resetCount) {
    realtimeRetryCountsByStore.delete(storeKey);
  }
}

function scheduleRealtimeRetry(store, generation) {
  const storeKey = getRealtimeStoreKey(store);

  if (
    !isRealtimeGenerationActive(store, generation) ||
    store.isRealtimeSubscribed ||
    realtimeRetryTimersByStore.has(storeKey)
  ) {
    return;
  }

  const retryCount = realtimeRetryCountsByStore.get(storeKey) ?? 0;

  if (retryCount >= CHAT_REALTIME_MAX_RETRIES) {
    return;
  }

  const retryDelay = CHAT_REALTIME_RETRY_DELAY_MS * 2 ** retryCount;
  realtimeRetryCountsByStore.set(storeKey, retryCount + 1);

  const retryTimer = setTimeout(() => {
    realtimeRetryTimersByStore.delete(storeKey);

    if (
      !isRealtimeGenerationActive(store, generation) ||
      store.isRealtimeSubscribed
    ) {
      return;
    }

    const handlers = realtimeHandlersByStore.get(storeKey);

    if (!handlers?.socket.connected) {
      handlers?.socket.connect();
      return;
    }

    store.subscribeRealtime({
      recoverSelected: true,
      generation,
    });
  }, retryDelay);

  realtimeRetryTimersByStore.set(storeKey, retryTimer);
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

function hasValidDirectMessageId(message) {
  if (toPositiveInteger(message?.id)) {
    return true;
  }

  return Boolean(
    message?.isOptimistic === true &&
      Number.isInteger(message.id) &&
      message.id < 0,
  );
}

function isValidDirectMessage(message) {
  return Boolean(
    hasValidDirectMessageId(message) &&
      toPositiveInteger(message?.senderPlayerId) &&
      toPositiveInteger(message?.receiverPlayerId),
  );
}

function createOptimisticDirectMessage({
  senderPlayerId,
  receiverPlayerId,
  content,
}) {
  const optimisticMessage = {
    id: nextOptimisticMessageId,
    senderPlayerId,
    receiverPlayerId,
    content,
    createdAt: new Date().toISOString(),
    isOptimistic: true,
  };

  nextOptimisticMessageId -= 1;
  return optimisticMessage;
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

  if (!authStore.isLoggedIn) {
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
      generation = realtimeGenerationByStore.get(getRealtimeStoreKey(this)),
    } = {}) {
      const authStore = useAuthStore();

      if (!isRealtimeGenerationActive(this, generation)) {
        return false;
      }

      if (!authStore.isLoggedIn || !authStore.currentPlayer?.id) {
        this.isRealtimeSubscribed = false;
        this.realtimeErrorMessage = CHAT_LOGIN_REQUIRED_MESSAGE;
        return false;
      }

      try {
        await emitWithAck("chat:subscribe", {});

        if (!isRealtimeGenerationActive(this, generation)) {
          return false;
        }

        this.isRealtimeSubscribed = true;
        this.realtimeErrorMessage = "";
        clearRealtimeRetry(this, { resetCount: true });

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
          getDisplayErrorMessage(error, CHAT_REALTIME_UNAVAILABLE_MESSAGE);
        scheduleRealtimeRetry(this, generation);
        return false;
      }
    },

    async startRealtime() {
      if (this.isRealtimeStarted) {
        if (this.isRealtimeSubscribed) {
          return true;
        }

        const storeKey = getRealtimeStoreKey(this);
        const generation = realtimeGenerationByStore.get(storeKey);
        const handlers = realtimeHandlersByStore.get(storeKey);
        clearRealtimeRetry(this, { resetCount: true });

        if (!handlers?.socket.connected) {
          handlers?.socket.connect();
          return false;
        }

        return this.subscribeRealtime({
          recoverSelected: true,
          generation,
        });
      }

      const socket = getSocket();
      const storeKey = getRealtimeStoreKey(this);
      const generation = advanceRealtimeGeneration(this);
      const handleMessage = (message) => this.handleRealtimeMessage(message);
      const handleConnect = () => {
        clearRealtimeRetry(this);
        return this.subscribeRealtime({ recoverSelected: true, generation });
      };
      const handleDisconnect = () => {
        if (!isRealtimeGenerationActive(this, generation)) {
          return;
        }

        this.isRealtimeSubscribed = false;
        this.realtimeErrorMessage = CHAT_REALTIME_DISCONNECTED_MESSAGE;
      };
      const handleConnectError = (error) => {
        if (!isRealtimeGenerationActive(this, generation)) {
          return;
        }

        this.isRealtimeSubscribed = false;
        this.realtimeErrorMessage =
          getDisplayErrorMessage(error, CHAT_REALTIME_UNAVAILABLE_MESSAGE);
      };

      realtimeHandlersByStore.set(storeKey, {
        socket,
        handleMessage,
        handleConnect,
        handleDisconnect,
        handleConnectError,
      });
      socket.on("chat:message", handleMessage);
      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);
      socket.on("connect_error", handleConnectError);
      this.isRealtimeStarted = true;

      if (!socket.connected) {
        socket.connect();
        return false;
      }

      return this.subscribeRealtime({ generation });
    },

    stopRealtime() {
      advanceRealtimeGeneration(this);
      clearRealtimeRetry(this, { resetCount: true });
      const storeKey = getRealtimeStoreKey(this);
      const handlers = realtimeHandlersByStore.get(storeKey);

      if (handlers) {
        handlers.socket.off("chat:message", handlers.handleMessage);
        handlers.socket.off("connect", handlers.handleConnect);
        handlers.socket.off("disconnect", handlers.handleDisconnect);
        handlers.socket.off("connect_error", handlers.handleConnectError);
        realtimeHandlersByStore.delete(storeKey);

        if (handlers.socket.connected) {
          handlers.socket.emit("chat:unsubscribe", {}, () => {});
        }
      }

      this.isRealtimeStarted = false;
      this.isRealtimeSubscribed = false;
      this.isLoading = false;
      this.realtimeErrorMessage = "";
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

    replaceMessage(friendId, previousMessageId, replacementMessage = null) {
      const key = String(friendId);
      const remainingMessages = (this.conversations[key] ?? []).filter(
        (message) => String(message.id) !== String(previousMessageId),
      );

      this.conversations = {
        ...this.conversations,
        [key]: mergeDirectMessages(
          remainingMessages,
          replacementMessage ? [replacementMessage] : [],
        ),
      };
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
        this.getCurrentPlayerId();
        const data = await getDirectMessagesApi(numericFriendId);

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
          this.errorMessage = getDisplayErrorMessage(error, "聊天紀錄載入失敗");
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

      let optimisticMessage = null;

      try {
        const currentPlayerId = this.getCurrentPlayerId();
        optimisticMessage = createOptimisticDirectMessage({
          senderPlayerId: currentPlayerId,
          receiverPlayerId: numericFriendId,
          content: normalizedContent,
        });
        this.appendMessage(numericFriendId, optimisticMessage);

        const data = await sendDirectMessageApi({
          friendId: numericFriendId,
          content: normalizedContent,
        });
        const directMessage = data.directMessage;

        if (!isValidDirectMessage(directMessage) || directMessage.isOptimistic) {
          throw new Error("訊息送出失敗");
        }

        this.replaceMessage(numericFriendId, optimisticMessage.id, directMessage);
        return directMessage;
      } catch (error) {
        if (optimisticMessage) {
          this.replaceMessage(numericFriendId, optimisticMessage.id);
        }
        this.errorMessage = getDisplayErrorMessage(error, "訊息送出失敗");
        return null;
      } finally {
        this.isSending = false;
      }
    },
  },
});
