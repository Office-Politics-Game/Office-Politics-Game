<template>
  <form class="space-y-4" @submit.prevent="submitSearch">
    <div>
      <h3 class="text-lg font-bold text-[var(--brand-active)]">加入好友</h3>
      <p class="mt-1 text-sm text-[var(--gray-400)]">
        輸入玩家暱稱或玩家 ID，搜尋後送出好友邀請。
      </p>
    </div>

    <div class="flex gap-2">
      <input
        v-model="keyword"
        type="text"
        placeholder="玩家 ID / 暱稱"
        class="friend-input min-w-0 flex-1"
        :disabled="isSearching || isSending"
      />

      <button
        type="submit"
        class="friend-button is-primary"
        :disabled="isSearching || isSending || !keyword.trim()"
      >
        {{ isSearching ? "搜尋中..." : "搜尋玩家" }}
      </button>
    </div>

    <p v-if="errorMessage" class="friend-alert is-error" role="alert">
      {{ errorMessage }}
    </p>

    <p v-if="notice" class="friend-alert" role="status">
      {{ notice }}
    </p>

    <section v-if="searchResults.length" class="space-y-2">
      <h4 class="text-sm font-bold text-[var(--brand-active)]">搜尋結果</h4>

      <article
        v-for="player in searchResults"
        :key="player.id"
        class="border border-[var(--gray-100)] bg-white px-3 py-3"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="truncate text-sm font-bold text-[var(--brand-active)]">
              {{ player.name }}
            </div>
            <div class="mt-1 text-xs text-[var(--gray-400)]">
              玩家 ID {{ player.playerId }}｜Lv. {{ player.level }}
            </div>
            <div class="mt-1 flex items-center gap-2 text-xs text-[var(--gray-400)]">
              <span class="h-2 w-2" :class="statusColorClass(player)"></span>
              {{ player.status }}
            </div>
          </div>

          <div class="flex shrink-0 flex-wrap justify-end gap-2">
            <button
              type="button"
              class="friend-button is-secondary"
              :disabled="isSending || Boolean(player.relationStatus)"
              @click="emit('add-friend', player.playerId)"
            >
              {{ actionLabel(player) }}
            </button>

            <button
              type="button"
              class="friend-button is-danger"
              :disabled="
                isSending ||
                isPlayerProcessing(player.playerId) ||
                player.relationStatus === 'blocked'
              "
              @click="emit('block-player', player)"
            >
              {{ blockActionLabel(player) }}
            </button>
          </div>
        </div>
      </article>
    </section>

    <section v-if="sentInvites.length" class="space-y-2">
      <h4 class="text-sm font-bold text-[var(--brand-active)]">已送出的邀請</h4>

      <div
        v-for="invite in sentInvites"
        :key="invite.id"
        class="border border-[var(--gray-100)] bg-white px-3 py-2"
      >
        <div class="text-sm font-bold text-[var(--brand-active)]">
          {{ invite.name }}
        </div>
        <div class="text-xs text-[var(--gray-400)]">
          玩家 ID {{ invite.playerId }}｜{{ invite.sentAt }} 送出｜等待回覆
        </div>
      </div>
    </section>
  </form>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  sentInvites: {
    type: Array,
    default: () => [],
  },
  searchResults: {
    type: Array,
    default: () => [],
  },
  notice: {
    type: String,
    default: "",
  },
  errorMessage: {
    type: String,
    default: "",
  },
  isSearching: {
    type: Boolean,
    default: false,
  },
  isSending: {
    type: Boolean,
    default: false,
  },
  isPlayerProcessing: {
    type: Function,
    default: () => false,
  },
});

const emit = defineEmits(["search", "add-friend", "block-player"]);
const keyword = ref("");

function submitSearch() {
  const value = keyword.value.trim();

  if (!value) {
    return;
  }

  emit("search", value);
}

function actionLabel(player) {
  if (player.relationStatus === "accepted") {
    return "已是好友";
  }

  if (player.relationStatus === "pending") {
    return "已送出";
  }

  if (player.relationStatus === "blocked") {
    return "無法邀請";
  }

  return "送出邀請";
}

function blockActionLabel(player) {
  if (props.isPlayerProcessing(player.playerId)) {
    return "處理中...";
  }

  if (player.relationStatus === "blocked") {
    return "已封鎖";
  }

  return "封鎖";
}

function statusColorClass(player) {
  return player.online ? "bg-green-500" : "bg-[var(--gray-200)]";
}
</script>

<style scoped>
@reference "tailwindcss";

.friend-input {
  @apply border border-[var(--gray-100)]
    bg-[rgba(255,255,255,0.72)]
    px-3
    py-2
    text-sm
    font-bold
    text-[var(--brand-active)]
    outline-0
    transition-[border-color,background-color,box-shadow]
    duration-[180ms]
    disabled:cursor-not-allowed
    disabled:opacity-60;
}

.friend-input:focus {
  @apply border-[var(--brand-hover)]
    bg-[var(--surface-glass-hover)]
    shadow-[0_0_0_4px_var(--brand-focus)];
}

.friend-button {
  width: 88px;
  height: 40px;
  @apply shrink-0 border px-3 py-2 text-sm font-bold transition-[border-color,background-color,box-shadow,color] duration-[180ms] disabled:cursor-not-allowed disabled:opacity-60;
}

.friend-button.is-primary {
  @apply border-[var(--brand-active)] bg-[var(--brand-active)] text-white;
}

.friend-button.is-secondary {
  @apply border-[var(--brand-primary)] bg-[var(--surface-glass)] text-[var(--brand-active)];
}

.friend-button.is-danger {
  @apply border-[var(--brand-active)] bg-white text-[var(--brand-active)];
}

.friend-button:hover:not(:disabled) {
  @apply border-[var(--brand-hover)] bg-[var(--brand-hover)] text-white shadow-[0_10px_24px_rgba(0,70,244,0.18)];
}

.friend-button:focus-visible {
  @apply outline-0 shadow-[0_0_0_4px_var(--brand-focus)];
}

.friend-alert {
  @apply border border-[var(--brand-primary)] bg-[rgba(134,179,224,0.16)] px-3 py-2 text-sm font-bold text-[var(--brand-active)];
}

.friend-alert.is-error {
  @apply border-[var(--brand-hover)] bg-[rgba(0,70,244,0.08)] text-[var(--brand-hover)];
}
</style>
