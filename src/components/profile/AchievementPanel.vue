<template>
  <section class="achievement-panel">
    <header class="achievement-panel__header">
      <div>
        <h2 class="achievement-panel__title">&#25104;&#23601;&#24509;&#31456;</h2>
      </div>
      <button
        type="button"
        class="achievement-panel__refresh"
        :disabled="isLoading"
        @click="openAllAchievements"
      >
        &#25152;&#26377;&#25104;&#23601;
      </button>
    </header>

    <p v-if="isLoading" class="achievement-panel__state">
      &#25104;&#23601;&#36039;&#26009;&#35712;&#21462;&#20013;...
    </p>

    <div v-else-if="errorMessage" class="achievement-panel__error">
      <p>{{ errorMessage }}</p>
      <button type="button" @click="emit('retry')">
        &#20877;&#35430;&#19968;&#27425;
      </button>
    </div>

    <p v-else-if="unlockedAchievements.length === 0" class="achievement-panel__state">
      &#23578;&#26410;&#35299;&#37782;&#20219;&#20309;&#25104;&#23601;&#12290;
    </p>

    <template v-else>
      <p v-if="titleErrorMessage" class="achievement-panel__title-error">
        {{ titleErrorMessage }}
      </p>

      <ul class="achievement-panel__list">
        <li
          v-for="achievement in unlockedAchievements"
          :key="achievement.code"
          class="achievement-card"
          :class="{ 'achievement-card--active': isCurrentTitle(achievement) }"
        >
          <span class="achievement-card__icon" aria-hidden="true">
            <img
              v-if="getAchievementImage(achievement)"
              class="achievement-card__image"
              :src="getAchievementImage(achievement)"
              alt=""
            >
            <span v-else>&#25104;</span>
          </span>

          <div class="achievement-card__content">
            <h3>{{ achievement.name }}</h3>
            <p>{{ achievement.description }}</p>
          </div>

          <button
            type="button"
            class="achievement-card__use-title"
            :disabled="isTitleSaving || isCurrentTitle(achievement)"
            @click="emit('use-title', achievement)"
          >
            {{ isCurrentTitle(achievement) ? "已套用" : "使用稱號" }}
          </button>
        </li>
      </ul>
    </template>

    <Teleport to="body">
      <div
        v-if="showAllAchievements"
        class="achievement-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="achievement-modal-title"
        @click.self="showAllAchievements = false"
      >
        <section class="achievement-modal__panel">
          <header class="achievement-modal__header">
            <div>
              <h2 id="achievement-modal-title">&#25152;&#26377;&#25104;&#23601;</h2>
            </div>
            <button
              type="button"
              class="achievement-modal__close"
              aria-label="Close all achievements"
              @click="showAllAchievements = false"
            >
              X
            </button>
          </header>

          <p
            v-if="lockedAchievements.length === 0"
            class="achievement-modal__complete"
          >
            &#20840;&#37096;&#37117;&#36948;&#25104;&#20102;!
          </p>

          <ul v-else class="achievement-modal__list">
            <li
              v-for="achievement in lockedAchievements"
              :key="achievement.code"
              class="achievement-modal-card"
            >
              <span class="achievement-modal-card__icon" aria-hidden="true">
                <img
                  v-if="getAchievementImage(achievement)"
                  :src="getAchievementImage(achievement)"
                  alt=""
                >
                <span v-else>&#25104;</span>
              </span>
              <div>
                <h3>{{ achievement.name }}</h3>
                <p>{{ achievement.description }}</p>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { computed, ref } from "vue"
import roomFounderAchievementImage from "@/assets/images/achievement-room-founder.webp"
import firstFriendAchievementImage from "@/assets/images/achievement-first-friend.webp"
import topUpAchievementImage from "@/assets/images/achievement-top-up.webp"
import firstGameWinAchievementImage from "@/assets/images/achievement-first-game-win.webp"

const props = defineProps({
  achievements: {
    type: Array,
    default: () => [],
  },
  currentTitle: {
    type: String,
    default: "",
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  isTitleSaving: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: "",
  },
  titleErrorMessage: {
    type: String,
    default: "",
  },
})

const emit = defineEmits(["retry", "use-title"])
const showAllAchievements = ref(false)

const unlockedAchievements = computed(() => {
  return props.achievements.filter((achievement) => achievement.isUnlocked)
})

const lockedAchievements = computed(() => {
  return props.achievements.filter((achievement) => !achievement.isUnlocked)
})

const achievementImages = {
  first_room_create: roomFounderAchievementImage,
  first_friend: firstFriendAchievementImage,
  first_game_win: firstGameWinAchievementImage,
  first_top_up: topUpAchievementImage,
}

function openAllAchievements() {
  showAllAchievements.value = true

  if (props.achievements.length === 0) {
    emit("retry")
  }
}

function getAchievementImage(achievement) {
  return achievementImages[achievement.code]
}

function isCurrentTitle(achievement) {
  return achievement.name === props.currentTitle
}
</script>

<style scoped>
.achievement-panel {
  display: flex;
  min-height: 280px;
  flex-direction: column;
  gap: 16px;
  padding: 22px;
}

.achievement-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.achievement-panel__eyebrow,
.achievement-modal__eyebrow {
  margin: 0;
  color: var(--brand-disabled);
  font-size: var(--text-xs);
  font-weight: 900;
}

.achievement-panel__title {
  margin: -2px 0 0;
  color: var(--brand-navy);
  font-size: var(--text-lg);
  font-weight: 900;
}

.achievement-modal__header h2 {
  margin: 4px 0 0;
  color: var(--brand-navy);
  font-size: var(--text-xl);
  font-weight: 900;
}

.achievement-panel__refresh,
.achievement-panel__error button {
  min-height: 32px;
  border: 1px solid rgba(0, 19, 50, 0.18);
  background: rgba(255, 255, 255, 0.72);
  color: var(--brand-navy);
  font-size: var(--text-xs);
  font-weight: 900;
}

.achievement-panel__refresh {
  min-width: 96px;
  padding: 0 14px;
}

.achievement-panel__refresh:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.achievement-panel__state,
.achievement-panel__error {
  margin: auto;
  color: var(--gray-500);
  font-size: var(--text-sm);
  font-weight: 800;
  text-align: center;
}

.achievement-panel__error {
  display: grid;
  gap: 12px;
  justify-items: center;
}

.achievement-panel__error p {
  margin: 0;
}

.achievement-panel__title-error {
  margin: 0;
  border: 1px solid rgba(199, 59, 52, 0.28);
  background: rgba(199, 59, 52, 0.08);
  color: #9f2f29;
  font-size: var(--text-xs);
  font-weight: 800;
  padding: 10px 12px;
}

.achievement-panel__list,
.achievement-modal__list {
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
}

.achievement-panel__list {
  gap: 14px;
}

.achievement-modal__list {
  gap: 10px;
}

.achievement-card,
.achievement-modal-card {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  border: 1px solid rgba(134, 179, 224, 0.5);
  background: rgba(255, 255, 255, 0.7);
  padding: 12px 18px;
}

.achievement-card--active {
  border-color: rgba(0, 70, 244, 0.42);
  background: rgba(134, 179, 224, 0.18);
}

.achievement-card__icon,
.achievement-modal-card__icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  overflow: hidden;
  border: 1px solid rgba(0, 19, 50, 0.18);
  background: rgba(0, 42, 92, 0.08);
  color: var(--brand-navy);
  font-weight: 900;
}

.achievement-card__image,
.achievement-modal-card__icon img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.achievement-card__content,
.achievement-modal-card div {
  min-width: 0;
}

.achievement-card__content h3,
.achievement-modal-card h3 {
  margin: 0;
  color: var(--brand-navy);
  font-size: var(--text-sm);
  font-weight: 900;
}

.achievement-card__content p,
.achievement-modal-card p {
  margin: 4px 0 0;
  color: var(--gray-500);
  font-size: var(--text-xs);
  font-weight: 700;
  line-height: 1.55;
}

.achievement-card__use-title {
  min-height: 34px;
  border: 1px solid rgba(0, 19, 50, 0.22);
  background: rgba(255, 255, 255, 0.78);
  color: var(--brand-navy);
  font-size: var(--text-xs);
  font-weight: 900;
  padding: 0 12px;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}

.achievement-card__use-title:hover:not(:disabled) {
  border-color: var(--brand-hover);
  background: var(--brand-hover);
  color: white;
  transform: translateY(-1px);
}

.achievement-card__use-title:active:not(:disabled) {
  border-color: var(--brand-active);
  background: var(--brand-active);
  transform: translateY(1px);
}

.achievement-card__use-title:focus-visible,
.achievement-panel__refresh:focus-visible,
.achievement-modal__close:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px var(--brand-focus);
}

.achievement-card__use-title:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.achievement-modal {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: grid;
  place-items: center;
  background: rgba(0, 19, 50, 0.48);
  padding: 18px;
}

.achievement-modal__panel {
  width: min(700px, calc(100vw - 36px));
  max-height: min(620px, calc(100svh - 36px));
  overflow: auto;
  border: 2px solid rgba(134, 179, 224, 0.64);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: var(--shadow);
  padding: 20px 26px;
}

.achievement-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.achievement-modal__header h2 {
  margin-top: 0;
  font-size: var(--text-lg);
}

.achievement-modal__close {
  min-height: 0;
  width: 28px;
  height: 28px;
  border: 0;
  background: transparent;
  color: var(--brand-navy);
  font-size: 18px;
  font-weight: 900;
  padding: 0;
}

.achievement-modal__complete {
  margin: 46px auto;
  color: var(--brand-navy);
  font-size: var(--text-lg);
  font-weight: 900;
  text-align: center;
}

.achievement-modal-card {
  grid-template-columns: 42px minmax(0, 1fr);
  filter: grayscale(1);
  opacity: 0.58;
}

@media (max-width: 760px) {
  .achievement-panel {
    padding: 18px 16px;
  }

  .achievement-panel__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .achievement-card {
    grid-template-columns: 38px minmax(0, 1fr);
  }

  .achievement-card__use-title {
    grid-column: 2;
    justify-self: start;
  }
}
</style>
