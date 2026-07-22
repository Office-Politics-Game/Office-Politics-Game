<script setup>
import { computed, ref, watch } from "vue";
import { Crown, UserRound, X } from "@lucide/vue";

const props = defineProps({
  friends: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  isSending: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: "",
  },
  notice: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["close", "send"]);
const selectedFriendId = ref("");

const selectedFriend = computed(
  () => props.friends.find((friend) => friend.id === selectedFriendId.value) ?? null,
);

watch(
  () => props.friends,
  (friends) => {
    if (!friends.some((friend) => friend.id === selectedFriendId.value)) {
      selectedFriendId.value = friends[0]?.id ?? "";
    }
  },
  { immediate: true },
);

function selectFriend(friendId) {
  if (props.isSending) {
    return;
  }

  selectedFriendId.value = friendId;
}

function sendInvitation() {
  if (!selectedFriend.value || props.isSending) {
    return;
  }

  emit("send", selectedFriend.value);
}
</script>

<template>
  <div class="invite-modal-backdrop" @click.self="emit('close')">
    <section
      class="invite-modal-card relative w-[min(90vw,720px)] max-h-[min(78vh,680px)] overflow-y-auto overflow-x-hidden px-6 py-7 sm:px-8 sm:py-8"
      aria-labelledby="invite-friend-title"
    >
      <div
        class="absolute inset-x-8 top-0 h-px invite-modal-rule"
        aria-hidden="true"
      ></div>

      <button
        type="button"
        class="btn-dark tap-pop absolute right-4 top-4 grid h-11 w-11 place-items-center"
        aria-label="關閉邀請好友彈窗"
        @click="emit('close')"
      >
        <X class="h-5 w-5" :stroke-width="2.2" />
      </button>

      <div class="mb-6 flex items-center justify-center gap-2 invite-modal-mark">
        <Crown class="h-5 w-5" :stroke-width="1.9" />
        <span class="text-[11px] font-black uppercase tracking-[0.24em]">Room Invite</span>
      </div>

      <h2
        id="invite-friend-title"
        class="mb-2 text-center font-black invite-modal-title"
      >
        邀請好友
      </h2>

      <p class="mb-5 text-center invite-modal-subtitle">
        選擇一位好友加入目前房間
      </p>

      <section
        class="invite-list-panel"
        aria-label="好友列表"
      >
        <div v-if="isLoading" class="invite-state">
          好友列表載入中...
        </div>
        <div v-else-if="errorMessage" class="invite-state is-error">
          {{ errorMessage }}
        </div>
        <div v-else-if="!friends.length" class="invite-state">
          目前沒有可邀請的好友
        </div>
        <div v-else class="invite-list">
          <button
            v-for="friend in friends"
            :key="friend.id"
            type="button"
            class="invite-friend-row"
            :class="{ 'is-selected': selectedFriendId === friend.id }"
            @click="selectFriend(friend.id)"
          >
            <span class="invite-friend-radio" aria-hidden="true">
              <span v-if="selectedFriendId === friend.id"></span>
            </span>
            <span class="invite-friend-avatar" aria-hidden="true">
              <UserRound class="h-4 w-4" :stroke-width="2.1" />
            </span>
            <span class="invite-friend-copy">
              <span class="invite-friend-name">{{ friend.name }}</span>
              <span class="invite-friend-meta">
                {{ friend.playerId }} · {{ friend.status }}
              </span>
            </span>
          </button>
        </div>
      </section>

      <p v-if="notice" class="mt-4 invite-notice" role="status">
        {{ notice }}
      </p>

      <div class="mt-5 grid grid-cols-2 gap-3 max-lg:landscape:mt-4 max-lg:landscape:gap-2">
        <button
          class="invite-action-button is-secondary tap-pop flex cursor-pointer items-center justify-center"
          type="button"
          :disabled="isSending"
          @click="emit('close')"
        >
          取消
        </button>
        <button
          class="invite-action-button is-primary tap-pop flex cursor-pointer items-center justify-center"
          type="button"
          :disabled="isLoading || isSending || !selectedFriend"
          @click="sendInvitation"
        >
          {{ isSending ? "邀請中..." : "邀請" }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
@reference "tailwindcss";

.invite-modal-backdrop {
  @apply fixed inset-0 z-[60] grid place-items-center p-4;
  background: rgba(0, 0, 0, 0.56);
}

.invite-modal-card {
  @apply rounded-[var(--radius-lg)]
    border border-[rgba(134,179,224,0.38)]
    bg-[rgba(255,255,255,0.92)]
    [font-family:var(--font-sans)]
    text-[var(--brand-active)]
    shadow-[var(--shadow)]
    animate-[popIn_0.42s_cubic-bezier(0.18,1.35,0.25,1)_both];
}

.invite-modal-rule {
  @apply bg-[linear-gradient(90deg,transparent,var(--brand-primary),transparent)];
}

.invite-modal-mark {
  color: var(--brand-active);
}

.invite-modal-title {
  @apply text-[var(--brand-navy)] text-xl tracking-normal;
}

.invite-modal-subtitle {
  @apply m-0 text-sm font-semibold text-[var(--gray-400)];
}

.invite-list-panel {
  @apply rounded-[var(--radius-md)]
    border border-[var(--brand-primary)]
    bg-[rgba(255,255,255,0.58)]
    p-2;
  min-height: 260px;
  max-height: 420px;
}

.invite-list {
  @apply grid gap-2 overflow-y-auto;
  max-height: 404px;
  padding-right: 2px;
}

.invite-friend-row {
  @apply grid w-full items-center rounded-[var(--radius-md)] border border-[rgba(134,179,224,0.52)] bg-[rgba(255,255,255,0.64)] px-3 py-2 text-left transition-[border-color,background-color,box-shadow] duration-[180ms];
  grid-template-columns: auto auto minmax(0, 1fr);
  gap: 10px;
}

.invite-friend-row:hover {
  @apply border-[var(--brand-hover)] bg-[var(--surface-glass-hover)];
}

.invite-friend-row.is-selected {
  @apply border-[var(--brand-hover)] bg-[rgba(134,179,224,0.26)] shadow-[0_0_0_2px_rgba(0,70,244,0.08)];
}

.invite-friend-row:focus-visible {
  @apply outline-0 shadow-[0_0_0_4px_var(--brand-focus)];
}

.invite-friend-radio {
  @apply grid h-4 w-4 place-items-center rounded-full border border-[var(--brand-primary)] bg-white;
}

.invite-friend-radio > span {
  @apply h-2 w-2 rounded-full bg-[var(--brand-hover)];
}

.invite-friend-avatar {
  @apply grid h-9 w-9 place-items-center rounded-full border border-[rgba(70,85,99,0.24)] bg-[rgba(134,179,224,0.2)] text-[var(--brand-active)];
}

.invite-friend-copy {
  @apply grid min-w-0 gap-0.5;
}

.invite-friend-name {
  @apply overflow-hidden text-ellipsis whitespace-nowrap text-sm font-black text-[var(--brand-active)];
}

.invite-friend-meta {
  @apply overflow-hidden text-ellipsis whitespace-nowrap text-xs font-bold text-[var(--gray-400)];
}

.invite-state {
  @apply grid min-h-[204px] place-items-center px-4 text-center text-sm font-bold text-[var(--brand-active)];
}

.invite-state.is-error,
.invite-notice {
  @apply text-[var(--brand-hover)];
}

.invite-notice {
  @apply m-0 text-center text-sm font-bold;
}

.invite-action-button {
  @apply min-h-[46px]
    rounded-[var(--radius-md)]
    border
    text-[var(--text-sm)]
    font-extrabold
    transition-[border-color,background-color,box-shadow,color]
    duration-[180ms]
    disabled:cursor-not-allowed
    disabled:opacity-60;
}

.invite-action-button.is-secondary {
  @apply border-[var(--brand-primary)] bg-[var(--surface-glass)] text-[var(--brand-active)];
}

.invite-action-button.is-primary {
  @apply border-[var(--brand-active)] bg-[var(--brand-active)] text-white shadow-[0_10px_24px_rgba(70,85,99,0.24)];
}

.invite-action-button:hover:not(:disabled) {
  @apply border-[var(--brand-hover)] bg-[var(--brand-hover)] text-white shadow-[0_10px_24px_rgba(0,70,244,0.24)];
}

.invite-action-button:focus-visible {
  @apply outline-0 shadow-[0_0_0_4px_var(--brand-focus)];
}

@media (max-width: 420px) {
  .invite-modal-backdrop {
    padding: 12px;
  }

  .invite-list-panel {
    min-height: 220px;
  }

  .invite-action-button {
    @apply min-h-11;
  }
}

@media (max-width: 1024px) and (max-height: 560px) and (orientation: landscape) {
  .invite-modal-card {
    width: min(88vw, 640px);
    max-height: calc(100dvh - 24px);
    overflow-y: auto;
    overflow-x: hidden;
    padding: 20px 24px;
  }

  .invite-modal-title {
    margin-bottom: 6px;
    font-size: 28px;
    line-height: 1.15;
  }

  .invite-list-panel {
    min-height: 180px;
    max-height: 220px;
  }

  .invite-friend-row {
    gap: 8px;
    padding: 8px 10px;
  }

  .invite-friend-avatar {
    width: 32px;
    height: 32px;
  }

  .invite-action-button {
    min-height: 40px;
    font-size: 14px;
  }
}
</style>
