<template>
  <section class="achievement-panel">
    <header class="achievement-panel__header">
      <div>
        <p class="achievement-panel__eyebrow">ACHIEVEMENTS</p>
        <h2 class="achievement-panel__title">成就徽章</h2>
      </div>
      <button
        type="button"
        class="achievement-panel__refresh"
        :disabled="isLoading"
        @click="emit('retry')"
      >
        重新整理
      </button>
    </header>

    <p v-if="isLoading" class="achievement-panel__state">成就資料讀取中...</p>

    <div v-else-if="errorMessage" class="achievement-panel__error">
      <p>{{ errorMessage }}</p>
      <button type="button" @click="emit('retry')">再試一次</button>
    </div>

    <p v-else-if="unlockedAchievements.length === 0" class="achievement-panel__state">
      尚未建立成就資料。
    </p>

    <ul v-else class="achievement-panel__list">
      <li
        v-for="achievement in unlockedAchievements"
        :key="achievement.code"
        class="achievement-card"
      >
        <span class="achievement-card__icon" aria-hidden="true">
          ★
        </span>

        <div class="achievement-card__content">
          <div class="achievement-card__topline">
            <h3>{{ achievement.name }}</h3>
          </div>
          <p>{{ achievement.description }}</p>
        </div>

        <button
          type="button"
          class="achievement-card__use-title"
          @click="emit('use-title', achievement)"
        >
          使用稱號
        </button>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
  achievements: {
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
})

const emit = defineEmits(["retry", "use-title"])

const unlockedAchievements = computed(() => {
  return props.achievements.filter((achievement) => achievement.isUnlocked)
})
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

.achievement-panel__eyebrow {
  margin: 0;
  color: var(--brand-disabled);
  font-size: var(--text-xs);
  font-weight: 900;
}

.achievement-panel__title {
  margin: 4px 0 0;
  color: var(--brand-navy);
  font-size: var(--text-xl);
  font-weight: 900;
}

.achievement-panel__refresh,
.achievement-panel__error button {
  min-height: 36px;
  border: 1px solid rgba(0, 19, 50, 0.18);
  background: rgba(255, 255, 255, 0.72);
  color: var(--brand-navy);
  font-size: var(--text-xs);
  font-weight: 900;
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

.achievement-panel__list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.achievement-card {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  border: 1px solid rgba(134, 179, 224, 0.5);
  background: rgba(255, 255, 255, 0.7);
  padding: 12px;
}

.achievement-card--locked {
  opacity: 0.58;
}

.achievement-card__icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border: 1px solid rgba(0, 19, 50, 0.18);
  background: rgba(0, 42, 92, 0.08);
  color: var(--brand-navy);
  font-weight: 900;
}

.achievement-card__content {
  min-width: 0;
}

.achievement-card__topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.achievement-card__topline h3 {
  margin: 0;
  color: var(--brand-navy);
  font-size: var(--text-sm);
  font-weight: 900;
}

.achievement-card__content p {
  margin: 4px 0;
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

.achievement-card__use-title:hover {
  border-color: var(--brand-hover);
  background: var(--brand-hover);
  color: white;
  transform: translateY(-1px);
}

.achievement-card__use-title:active {
  border-color: var(--brand-active);
  background: var(--brand-active);
  transform: translateY(1px);
}

.achievement-card__use-title:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px var(--brand-focus);
}

@media (max-width: 760px) {
  .achievement-panel {
    padding: 18px 16px;
  }

  .achievement-panel__header,
  .achievement-card__topline {
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
