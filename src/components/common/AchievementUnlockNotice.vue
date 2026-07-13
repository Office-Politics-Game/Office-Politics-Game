<template>
  <Transition name="achievement-notice">
    <section
      v-if="firstAchievement"
      class="achievement-unlock-notice"
      role="status"
      aria-live="polite"
    >
      <button
        type="button"
        class="achievement-unlock-notice__body"
        aria-label="關閉成就提示"
        @click="achievementStore.clearUnlockedAchievements()"
      >
        <div class="achievement-unlock-notice__top-cut" aria-hidden="true"></div>

        <div class="achievement-unlock-notice__icon">
          <img
            v-if="achievementImage"
            :src="achievementImage"
            :alt="firstAchievement.name"
          >
          <Trophy v-else :size="88" stroke-width="2.2" />
        </div>

        <div class="achievement-unlock-notice__divider" aria-hidden="true"></div>

        <div class="achievement-unlock-notice__content">
          <h2>{{ firstAchievement.name }}</h2>
          <div class="achievement-unlock-notice__rule" aria-hidden="true"></div>
          <p class="achievement-unlock-notice__description">
            {{ firstAchievement.description }}
          </p>
          <p
            v-if="extraAchievementCount > 0"
            class="achievement-unlock-notice__extra"
          >
            還有 {{ extraAchievementCount }} 個成就已解鎖
          </p>
        </div>
      </button>
    </section>
  </Transition>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, watch } from "vue";
import { Trophy } from "lucide-vue-next";
import firstFriendAchievementImage from "@/assets/images/achievement-first-friend.webp";
import firstGameWinAchievementImage from "@/assets/images/achievement-first-game-win.webp";
import roomFounderAchievementImage from "@/assets/images/achievement-room-founder.webp";
import topUpAchievementImage from "@/assets/images/achievement-top-up.webp";
import { useAchievementStore } from "@/stores/achievementStore.js";

const achievementStore = useAchievementStore();
let clearTimer = null;

const achievementImages = {
  first_room_create: roomFounderAchievementImage,
  first_friend: firstFriendAchievementImage,
  first_game_win: firstGameWinAchievementImage,
  first_top_up: topUpAchievementImage,
};

const firstAchievement = computed(() => {
  return achievementStore.unlockedAchievements[0] ?? null;
});

const achievementImage = computed(() => {
  return achievementImages[firstAchievement.value?.code] ?? "";
});

const extraAchievementCount = computed(() => {
  return Math.max(achievementStore.unlockedAchievements.length - 1, 0);
});

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
    }, 3500);
  },
);

onMounted(() => {
  window.addEventListener("achievement:unlocked", handleAchievementUnlocked);
});

onBeforeUnmount(() => {
  clearNoticeTimer();
  window.removeEventListener("achievement:unlocked", handleAchievementUnlocked);
});
</script>

<style scoped>
.achievement-unlock-notice {
  position: fixed;
  right: auto;
  bottom: 14px;
  left: 50%;
  z-index: 50;
  width: min(420px, calc(100vw - 24px));
  pointer-events: none;
  transform: translateX(-50%);
}

.achievement-unlock-notice__body {
  position: relative;
  display: grid;
  grid-template-columns: 56px 1px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 84px;
  overflow: hidden;
  border: 2px solid #2d65ab;
  border-radius: 12px;
  background:
    radial-gradient(circle at 86% 24%, rgba(46, 117, 187, 0.08), transparent 28%),
    linear-gradient(135deg, #f8fbff 0%, #f6f8fc 58%, #dbe8f8 100%);
  box-shadow:
    0 6px 12px rgba(0, 19, 50, 0.38),
    inset 0 0 0 1px rgba(255, 255, 255, 0.78),
    inset 0 0 0 3px rgba(82, 155, 222, 0.22);
  color: var(--brand-navy);
  cursor: pointer;
  padding: 12px 20px 12px 16px;
  pointer-events: auto;
  text-align: left;
}

.achievement-unlock-notice__body::before,
.achievement-unlock-notice__body::after {
  position: absolute;
  content: "";
  pointer-events: none;
}

.achievement-unlock-notice__body::before {
  inset: 0;
  background-image:
    radial-gradient(rgba(82, 114, 160, 0.12) 1px, transparent 1px);
  background-position: right 28px top 10px;
  background-size: 5px 5px;
  opacity: 0.64;
}

.achievement-unlock-notice__body::after {
  right: 0;
  bottom: 0;
  width: 44px;
  height: 44px;
  background: #3b8ee8;
  clip-path: polygon(100% 0, 100% 100%, 0 100%, 52% 58%, 52% 35%);
}

.achievement-unlock-notice__top-cut {
  position: absolute;
  top: 0;
  right: 112px;
  width: 70px;
  height: 5px;
  background: linear-gradient(90deg, #2d65ab, #43a3ff);
  clip-path: polygon(8% 0, 100% 0, 92% 100%, 0 100%);
  pointer-events: none;
}

.achievement-unlock-notice__icon {
  position: relative;
  z-index: 1;
  display: grid;
  width: 56px;
  height: 56px;
  place-items: center;
  overflow: hidden;
  border: 2px solid #246dc5;
  border-radius: 8px;
  background:
    radial-gradient(circle at 50% 45%, rgba(255, 255, 255, 0.95), transparent 34%),
    linear-gradient(135deg, #e4f6ff, #88cdff 48%, #2a83e6);
  box-shadow:
    inset 0 0 0 2px rgba(255, 255, 255, 0.82),
    0 3px 6px rgba(0, 19, 50, 0.2);
  color: #d9792f;
}

.achievement-unlock-notice__icon img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.achievement-unlock-notice__divider {
  position: relative;
  z-index: 1;
  width: 1px;
  height: 48px;
  background: linear-gradient(transparent, rgba(46, 117, 187, 0.55), transparent);
}

.achievement-unlock-notice__divider::before {
  position: absolute;
  top: 50%;
  left: -3px;
  width: 5px;
  height: 5px;
  content: "";
  background: #2e75bb;
  transform: translateY(-50%);
}

.achievement-unlock-notice__content {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.achievement-unlock-notice h2 {
  margin: 0;
  overflow: hidden;
  color: var(--brand-navy);
  font-size: 20px;
  font-weight: 900;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.achievement-unlock-notice__rule {
  position: relative;
  height: 1px;
  margin: 5px 0 6px;
  background: linear-gradient(90deg, rgba(70, 85, 99, 0.28), rgba(46, 117, 187, 0.24));
}

.achievement-unlock-notice__rule::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  width: 12px;
  height: 3px;
  content: "";
  background: #2c83df;
  transform: skewX(-24deg);
}

.achievement-unlock-notice__description {
  margin: 0;
  overflow: hidden;
  color: var(--brand-active);
  font-size: 12px;
  font-weight: 800;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.achievement-unlock-notice__extra {
  margin: 4px 0 0;
  color: var(--gray-400);
  font-size: var(--text-xs);
  font-weight: 800;
}

.achievement-unlock-notice__body:focus-visible {
  outline: none;
  box-shadow:
    0 6px 12px rgba(0, 19, 50, 0.38),
    0 0 0 4px var(--brand-focus);
}

.achievement-notice-enter-active,
.achievement-notice-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.achievement-notice-enter-from,
.achievement-notice-leave-to {
  opacity: 0;
  transform: translate(-50%, 12px) scale(0.98);
}

@media (max-width: 760px) {
  .achievement-unlock-notice {
    bottom: 10px;
  }

  .achievement-unlock-notice__body {
    grid-template-columns: 48px minmax(0, 1fr);
    gap: 10px;
    min-height: 74px;
    border-width: 2px;
    border-radius: 10px;
    padding: 10px 12px;
  }

  .achievement-unlock-notice__icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
  }

  .achievement-unlock-notice__divider {
    display: none;
  }

  .achievement-unlock-notice h2 {
    font-size: 16px;
  }

  .achievement-unlock-notice__description {
    margin-top: 4px;
    font-size: 11px;
  }

  .achievement-unlock-notice__rule {
    margin: 4px 0 5px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .achievement-notice-enter-active,
  .achievement-notice-leave-active {
    transition: none;
  }
}
</style>
