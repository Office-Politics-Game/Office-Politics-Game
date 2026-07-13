<template>
  <section class="friend-chat-panel" aria-live="polite">
    <div class="chat-toolbar">
      <div class="min-w-0">
        <h2 class="truncate text-lg font-black text-[var(--brand-navy)]">
          {{ friend.name }}
        </h2>
        <p class="mt-1 truncate text-xs font-bold text-[var(--gray-400)]">
          玩家 ID {{ friend.playerId }}｜{{ friend.status }}
        </p>
      </div>

      <span
        class="status-dot"
        :class="friend.online ? 'bg-green-500' : 'bg-[var(--gray-200)]'"
        aria-hidden="true"
      ></span>
    </div>

    <div class="chat-body">
      <div v-if="chatStore.isLoading" class="chat-state">
        聊天紀錄載入中...
      </div>

      <div v-else-if="chatStore.errorMessage" class="chat-state is-error">
        {{ chatStore.errorMessage }}
      </div>

      <div v-else-if="messages.length === 0" class="chat-state">
        目前沒有聊天紀錄
      </div>

      <div v-else class="message-list">
        <article
          v-for="message in messages"
          :key="message.id"
          class="chat-message"
          :class="isMine(message) ? 'chat-message--mine' : 'chat-message--friend'"
        >
          <div class="message-bubble">
            <p class="message-content">
              {{ message.content }}
            </p>
            <time class="message-time" :datetime="message.createdAt">
              {{ formatMessageTime(message.createdAt) }}
            </time>
          </div>
        </article>
      </div>
    </div>

    <form class="chat-composer" @submit.prevent="submitMessage">
      <label class="sr-only" for="friend-chat-input">輸入訊息</label>
      <textarea
        id="friend-chat-input"
        v-model="messageText"
        class="chat-input"
        rows="2"
        placeholder="輸入訊息"
        :disabled="chatStore.isSending"
      ></textarea>

      <button type="submit" class="chat-send-button" :disabled="sendDisabled">
        {{ chatStore.isSending ? "送出中..." : "送出" }}
      </button>
    </form>
  </section>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useChatStore } from "@/stores/chatStore.js";

const props = defineProps({
  friend: {
    type: Object,
    required: true,
  },
  currentPlayerId: {
    type: [Number, String],
    default: null,
  },
});

const chatStore = useChatStore();
const messageText = ref("");

const messages = computed(() => chatStore.messagesByFriend(props.friend.playerId));
const sendDisabled = computed(
  () => chatStore.isSending || !messageText.value.trim(),
);

function isMine(message) {
  return Number(message.senderPlayerId) === Number(props.currentPlayerId);
}

function formatMessageTime(value) {
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

async function submitMessage() {
  const sentMessage = await chatStore.sendMessage({
    friendId: props.friend.playerId,
    content: messageText.value,
  });

  if (sentMessage) {
    messageText.value = "";
  }
}

watch(
  () => props.friend.playerId,
  (friendId) => {
    chatStore.loadMessages(friendId);
  },
  { immediate: true },
);
</script>

<style scoped>
@reference "tailwindcss";

.friend-chat-panel {
  @apply flex min-h-full flex-col border border-[rgba(134,179,224,0.38)] bg-[rgba(255,255,255,0.88)] shadow-[var(--shadow)];
}

.chat-toolbar {
  @apply flex min-h-16 shrink-0 items-center justify-between gap-4 border-b border-[var(--gray-100)] bg-white px-5 py-4;
}

.status-dot {
  @apply h-2.5 w-2.5 shrink-0;
}

.chat-body {
  @apply min-h-0 flex-1 overflow-y-auto bg-[rgba(244,247,251,0.74)] px-4 py-4;
}

.chat-state {
  @apply flex min-h-full items-center justify-center border border-dashed border-[var(--gray-100)] bg-white/70 px-4 py-8 text-center text-sm font-bold text-[var(--gray-400)];
}

.chat-state.is-error {
  @apply border-[var(--brand-hover)] bg-[rgba(0,70,244,0.08)] text-[var(--brand-hover)];
}

.message-list {
  @apply flex min-h-full flex-col justify-end gap-3;
}

.chat-message {
  @apply flex w-full;
}

.chat-message--mine {
  @apply justify-end;
}

.chat-message--friend {
  @apply justify-start;
}

.message-bubble {
  @apply max-w-[78%] border px-3 py-2 shadow-[0_10px_24px_rgba(0,19,50,0.08)];
}

.chat-message--mine .message-bubble {
  @apply border-[var(--brand-active)] bg-[var(--brand-active)] text-white;
}

.chat-message--friend .message-bubble {
  @apply border-[var(--gray-100)] bg-white text-[var(--brand-active)];
}

.message-content {
  @apply whitespace-pre-wrap break-words text-sm font-bold leading-6;
}

.message-time {
  @apply mt-1 block text-right text-[11px] font-bold opacity-70;
}

.chat-composer {
  @apply flex shrink-0 gap-2 border-t border-[var(--gray-100)] bg-white px-4 py-3 max-sm:flex-col;
}

.chat-input {
  @apply min-h-12 min-w-0 flex-1 resize-none border border-[var(--gray-100)] bg-[rgba(255,255,255,0.72)] px-3 py-2 text-sm font-bold text-[var(--brand-active)] outline-0 transition-[border-color,background-color,box-shadow] duration-[180ms] disabled:cursor-not-allowed disabled:opacity-60;
}

.chat-input:focus {
  @apply border-[var(--brand-hover)] bg-[var(--surface-glass-hover)] shadow-[0_0_0_4px_var(--brand-focus)];
}

.chat-send-button {
  @apply min-h-12 min-w-28 border border-[var(--brand-active)] bg-[var(--brand-active)] px-5 py-2 text-sm font-black text-white transition-[border-color,background-color,box-shadow,color,transform] duration-[180ms] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--brand-focus)] disabled:cursor-not-allowed disabled:border-transparent disabled:bg-[rgba(160,166,179,0.62)] disabled:text-white disabled:shadow-none;
}

.chat-send-button:hover:not(:disabled) {
  @apply -translate-y-px border-[var(--brand-hover)] bg-[var(--brand-hover)] shadow-[0_10px_24px_rgba(0,70,244,0.18)];
}

.chat-send-button:active:not(:disabled) {
  @apply translate-y-px border-[var(--brand-active)] bg-[var(--brand-active)];
}
</style>
