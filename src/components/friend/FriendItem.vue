<template>
  <article
    class="mb-1 border border-transparent transition"
    :class="active ? 'border-[var(--brand-active)] bg-[rgba(134,179,224,0.18)]' : ''"
  >
    <button
      type="button"
      class="flex w-full items-center justify-between px-2 py-2 text-left transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--brand-focus)]"
      @click="emit('select', friend.id)"
    >
      <div class="flex min-w-0 items-center gap-2">
        <img
          src="@/assets/images/player-1.png"
          alt=""
          class="h-9 w-9 shrink-0 object-cover"
        />

        <div class="min-w-0">
          <div class="truncate text-sm font-bold text-[var(--brand-active)]">
            {{ friend.name }}
          </div>

          <div class="truncate text-xs text-[var(--gray-400)]">
            {{ friend.playerId }}｜{{ friend.status }}
          </div>
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <span class="text-xs font-semibold text-[var(--gray-400)]">
          {{ statusLabel }}
        </span>

        <span
          class="h-2 w-2"
          :class="statusColorClass"
        ></span>
      </div>
    </button>

    <div
      v-if="showActions"
      class="flex flex-wrap gap-2 border-t border-[var(--gray-100)] px-2 py-2"
    >
      <button
        type="button"
        class="friend-item-action"
        :disabled="isFriendProcessing"
        @click="emit('remove', friend)"
      >
        {{ isFriendProcessing ? "處理中..." : "解除好友" }}
      </button>

      <button
        type="button"
        class="friend-item-action is-danger"
        :disabled="isPlayerProcessing"
        @click="emit('block', friend)"
      >
        {{ isPlayerProcessing ? "處理中..." : "封鎖" }}
      </button>
    </div>
  </article>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  friend: {
    type: Object,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
  showActions: {
    type: Boolean,
    default: false,
  },
  isFriendProcessing: {
    type: Boolean,
    default: false,
  },
  isPlayerProcessing: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["select", "remove", "block"]);

const statusLabel = computed(() => {
  if (props.friend.statusType === "playing") {
    return "遊戲中";
  }

  return props.friend.online ? "在線" : "離線";
});

const statusColorClass = computed(() => {
  if (props.friend.statusType === "playing") {
    return "bg-blue-500";
  }

  return props.friend.online ? "bg-green-500" : "bg-gray-400";
});
</script>

<style scoped>
@reference "tailwindcss";

.friend-item-action {
  @apply border border-[var(--brand-primary)] bg-[var(--surface-glass)] px-2 py-1 text-xs font-bold text-[var(--brand-active)] transition-[border-color,background-color,color,box-shadow] duration-[180ms] disabled:cursor-not-allowed disabled:opacity-60;
}

.friend-item-action.is-danger {
  @apply border-[var(--brand-active)];
}

.friend-item-action:hover:not(:disabled) {
  @apply border-[var(--brand-hover)] bg-[var(--brand-hover)] text-white shadow-[0_8px_18px_rgba(0,70,244,0.16)];
}

.friend-item-action:focus-visible {
  @apply outline-0 shadow-[0_0_0_4px_var(--brand-focus)];
}
</style>
