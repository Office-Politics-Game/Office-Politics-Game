<template>
  <section class="space-y-3">
    <div
      v-if="isLoading"
      class="border border-dashed border-[var(--gray-100)] bg-white/70 p-6 text-center text-sm font-bold text-[var(--gray-400)]"
    >
      封鎖名單載入中...
    </div>

    <div
      v-else-if="errorMessage"
      class="border border-[var(--brand-hover)] bg-[rgba(0,70,244,0.08)] p-6 text-center text-sm font-bold text-[var(--brand-hover)]"
    >
      {{ errorMessage }}
    </div>

    <template v-else-if="blockedPlayers.length">
      <article
        v-for="player in blockedPlayers"
        :key="player.blockId"
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
            <div class="mt-1 text-xs font-bold text-[var(--brand-hover)]">
              已封鎖
            </div>
          </div>

          <button
            type="button"
            class="blocked-action shrink-0"
            :disabled="isBlockProcessing(player.blockId)"
            @click="emit('unblock', player)"
          >
            {{ isBlockProcessing(player.blockId) ? "處理中..." : "取消封鎖" }}
          </button>
        </div>
      </article>
    </template>

    <div
      v-else
      class="border border-dashed border-[var(--gray-100)] bg-white/70 p-6 text-center text-sm font-bold text-[var(--gray-400)]"
    >
      目前沒有封鎖任何玩家
    </div>
  </section>
</template>

<script setup>
defineProps({
  blockedPlayers: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: "",
  },
  isBlockProcessing: {
    type: Function,
    default: () => false,
  },
});

const emit = defineEmits(["unblock"]);
</script>

<style scoped>
@reference "tailwindcss";

.blocked-action {
  width: 88px;
  height: 40px;
  @apply border border-[var(--brand-primary)] bg-[var(--surface-glass)] px-3 py-2 text-sm font-bold text-[var(--brand-active)] transition-[border-color,background-color,box-shadow,color] duration-[180ms] disabled:cursor-not-allowed disabled:opacity-60;
}

.blocked-action:hover:not(:disabled) {
  @apply border-[var(--brand-hover)] bg-[var(--brand-hover)] text-white shadow-[0_10px_24px_rgba(0,70,244,0.18)];
}

.blocked-action:focus-visible {
  @apply outline-0 shadow-[0_0_0_4px_var(--brand-focus)];
}
</style>
