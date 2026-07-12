<template>
  <Transition name="achievement-notice">
    <section
      v-if="achievementStore.unlockedAchievements.length > 0"
      class="fixed right-4 top-4 z-50 w-[min(320px,calc(100vw-32px))] border border-amber-300/70 bg-slate-950/90 p-4 text-white shadow-2xl backdrop-blur"
      role="status"
      aria-live="polite"
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.18em] text-amber-200">
            Achievement
          </p>
          <h2 class="mt-1 text-lg font-black">解鎖新成就</h2>
        </div>

        <button
          type="button"
          class="grid h-7 w-7 place-items-center border border-white/20 bg-white/10 text-sm font-black text-white transition hover:bg-white/20"
          aria-label="關閉成就提示"
          @click="achievementStore.clearUnlockedAchievements()"
        >
          ×
        </button>
      </div>

      <ul class="mt-3 grid gap-2">
        <li
          v-for="achievement in achievementStore.unlockedAchievements"
          :key="achievement.code"
          class="border border-white/10 bg-white/10 p-3"
        >
          <p class="text-sm font-black text-amber-100">{{ achievement.name }}</p>
          <p class="mt-1 text-xs font-bold leading-5 text-slate-200">
            {{ achievement.description }}
          </p>
        </li>
      </ul>
    </section>
  </Transition>
</template>

<script setup>
import { onBeforeUnmount, onMounted, watch } from "vue";
import { useAchievementStore } from "@/stores/achievementStore.js";

const achievementStore = useAchievementStore();
let clearTimer = null;

function clearNoticeTimer() {
  if (clearTimer) {
    window.clearTimeout(clearTimer);
    clearTimer = null;
  }
}

function handleAchievementUnlocked(event) {
  achievementStore.showUnlockedAchievements(event.detail?.achievements);
}

watch(
  () => achievementStore.unlockedAchievements,
  (achievements) => {
    clearNoticeTimer();

    if (achievements.length === 0) {
      return;
    }

    clearTimer = window.setTimeout(() => {
      achievementStore.clearUnlockedAchievements();
    }, 4200);
  },
)

onMounted(() => {
  window.addEventListener("achievement:unlocked", handleAchievementUnlocked);
});

onBeforeUnmount(() => {
  clearNoticeTimer();
  window.removeEventListener("achievement:unlocked", handleAchievementUnlocked);
});
</script>

<style scoped>
.achievement-notice-enter-active,
.achievement-notice-leave-active {
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.achievement-notice-enter-from,
.achievement-notice-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
