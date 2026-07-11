<template>
  <section class="match-panel">
    <header class="match-panel__header">
      <h2>對戰紀錄</h2>
      <button type="button" @click="$emit('reload')">重新整理</button>
    </header>
    <p v-if="isLoading" class="match-panel__state">載入中...</p>
    <p v-else-if="errorMessage" class="match-panel__state">
      {{ errorMessage }}
    </p>
    <p v-else-if="matches.length === 0" class="match-panel__state">
      目前還沒有對戰紀錄。
    </p>
    <ul v-else class="match-panel__list">
      <li
        v-for="match in matches"
        :key="match.id"
        class="match-panel__item"
      >
        <div>
          <strong :class="match.result === 'win' ? 'is-win' : 'is-lose'">
            {{ match.result === "win" ? "勝利" : "敗北" }}
          </strong>
          <span>{{ formatDate(match.endedAt || match.startedAt) }}</span>
        </div>
        <p>勝者：{{ match.winnerUsername || "尚未記錄" }}</p>
        <div class="match-panel__players">
          <span
            v-for="player in match.participants"
            :key="`${match.id}-${player.playerId}-${player.username}`"
          >
            {{ player.username }}：{{ player.roundWins }} 勝
          </span>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup>
defineProps({
  matches: {
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

defineEmits(["reload"])

function formatDate(value) {
  if (!value) {
    return "尚未記錄"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "尚未記錄"
  }

  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}
</script>

<style scoped>
.match-panel {
  padding: 16px 24px;
}

.match-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.match-panel__header h2 {
  margin: 0;
  color: var(--brand-navy);
  font-size: var(--text-lg);
  font-weight: 900;
}

.match-panel__header button {
  border: 1px solid var(--brand-primary);
  background: rgba(255, 255, 255, 0.48);
  padding: 8px 14px;
  color: var(--brand-active);
  font-size: var(--text-sm);
  font-weight: 900;
}

.match-panel__state {
  margin: 24px 0 0;
  color: var(--gray-500);
  font-size: var(--text-md);
  font-weight: 800;
}

.match-panel__list {
  display: grid;
  gap: 12px;
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
}

.match-panel__item {
  border: 1px solid rgba(160, 166, 179, 0.3);
  background: rgba(255, 255, 255, 0.35);
  padding: 14px 16px;
}

.match-panel__item div:first-child {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--gray-500);
  font-size: var(--text-sm);
  font-weight: 800;
}

.match-panel__item p {
  margin: 8px 0;
  color: var(--brand-navy);
  font-size: var(--text-sm);
  font-weight: 800;
}

.match-panel__players {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.match-panel__players span {
  border: 1px solid rgba(134, 179, 224, 0.48);
  background: rgba(255, 255, 255, 0.42);
  padding: 4px 8px;
  color: var(--brand-active);
  font-size: var(--text-xs);
  font-weight: 900;
}

.is-win {
  color: #2e8f45;
}

.is-lose {
  color: #c73b34;
}
</style>