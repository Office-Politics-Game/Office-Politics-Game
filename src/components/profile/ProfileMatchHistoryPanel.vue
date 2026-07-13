<template>
  <section class="match-panel">
    <header class="match-panel__header">
      <button
        type="button"
        class="match-panel__refresh"
        :disabled="isLoading"
        @click="$emit('reload')"
      >
        <RefreshCw class="match-panel__refresh-icon" aria-hidden="true" />
        <span>重新整理</span>
      </button>
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
        class="match-row"
        :class="getResultMeta(match).className"
      >
        <div class="match-row__result">
          <strong>{{ getResultMeta(match).code }}</strong>
          <span>{{ getResultMeta(match).label }}</span>
        </div>

        <div class="match-row__main">
          <time class="match-row__date">
            {{ formatDate(match.endedAt || match.startedAt) }}
          </time>

          <div class="match-row__winner">
            <Crown class="match-row__icon" aria-hidden="true" />
            <span>贏家:</span>
            <strong>{{ match.winnerUsername || "尚未記錄" }}</strong>
          </div>

          <div class="match-row__scoreline">
            <span class="match-row__score-label">小局</span>
            <span
              class="match-row__score-text"
              :title="getScorelineText(match)"
            >
              {{ getScorelineText(match) }}
            </span>
          </div>
        </div>

        <div class="match-row__reward">
          <Sparkles class="match-row__icon" aria-hidden="true" />
          <strong>+{{ getXpGained(match) }} XP</strong>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { Crown, RefreshCw, Sparkles } from "lucide-vue-next";

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
});

defineEmits(["reload"]);

function getResultMeta(match) {
  if (match.result === "win") {
    return {
      code: "WIN",
      label: "勝利",
      className: "is-win",
    };
  }

  return {
    code: "LOSE",
    label: "敗北",
    className: "is-lose",
  };
}

function formatDate(value) {
  if (!value) {
    return "尚未記錄";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "尚未記錄";
  }

  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function getXpGained(match) {
  if (Number.isFinite(Number(match.xpGained))) {
    return Number(match.xpGained);
  }

  return match.result === "win" ? 300 : 100;
}

function getSortedParticipants(match) {
  const participants = Array.isArray(match.participants)
    ? match.participants
    : [];

  return [...participants].sort((firstPlayer, secondPlayer) => {
    const firstRoundWins = Number(firstPlayer.roundWins) || 0;
    const secondRoundWins = Number(secondPlayer.roundWins) || 0;

    return secondRoundWins - firstRoundWins;
  });
}

function getScorelineText(match) {
  return getSortedParticipants(match)
    .map((player) => {
      const username = player.username || "玩家";
      const roundWins = Number(player.roundWins) || 0;

      return `${username}: ${roundWins}勝`;
    })
    .join(" | ");
}
</script>

<style scoped>
.match-panel {
  padding: 10px 24px 24px;
}

.match-panel__header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.match-panel__refresh {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 112px;
  min-height: 36px;
  border: 1px solid var(--brand-primary);
  background: rgba(255, 255, 255, 0.36);
  padding: 6px 12px;
  color: var(--brand-active);
  font-size: var(--text-xs);
  font-weight: 900;
  cursor: pointer;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}

.match-panel__refresh:hover:not(:disabled) {
  border-color: var(--brand-hover);
  background: var(--brand-hover);
  color: white;
  transform: translateY(-1px);
}

.match-panel__refresh:active:not(:disabled) {
  border-color: var(--brand-active);
  background: var(--brand-active);
  color: white;
  transform: translateY(1px);
}

.match-panel__refresh:focus-visible {
  outline: none;
  box-shadow: 0 0 0 5px var(--brand-focus);
}

.match-panel__refresh:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.match-panel__refresh-icon {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
}

.match-panel__state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  margin: 0;
  color: var(--gray-500);
  font-size: var(--text-lg);
  font-weight: 800;
  text-align: center;
}

.match-panel__list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.match-row {
  display: grid;
  grid-template-columns: 78px minmax(0, 1fr) 128px;
  align-items: stretch;
  min-height: 96px;
  border: 1px solid rgba(134, 179, 224, 0.42);
  background: rgba(255, 255, 255, 0.46);
  overflow: hidden;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    transform 0.18s ease;
}

.match-row:hover {
  border-color: var(--brand-primary);
  background: rgba(255, 255, 255, 0.62);
  transform: translateY(-1px);
}

.match-row__result {
  display: grid;
  place-content: center;
  color: white;
  text-align: center;
}

.match-row.is-win .match-row__result {
  background: #2e8f45;
}

.match-row.is-lose .match-row__result {
  background: #c73b34;
}

.match-row__result strong {
  font-size: 18px;
  font-weight: 900;
  line-height: 1;
}

.match-row__result span {
  margin-top: 4px;
  font-size: var(--text-xs);
  font-weight: 900;
}

.match-row__main {
  display: grid;
  align-content: center;
  gap: 7px;
  min-width: 0;
  padding: 12px 16px;
}

.match-row__date {
  display: block;
  color: var(--gray-500);
  font-size: var(--text-xs);
  font-weight: 800;
  line-height: 1.2;
}

.match-row__winner {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  color: var(--brand-navy);
  font-size: var(--text-md);
  font-weight: 900;
  line-height: 1.2;
}

.match-row__winner strong {
  min-width: 0;
  overflow: hidden;
  color: var(--brand-navy);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.match-row__icon {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
}

.match-row__scoreline {
  display: flex;
  align-items: center;
  min-width: 0;
  max-width: 100%;
  gap: 6px;
  overflow: hidden;
  color: var(--gray-500);
  font-size: var(--text-xs);
  font-weight: 800;
  line-height: 1.2;
  white-space: nowrap;
}

.match-row__score-label {
  flex: 0 0 auto;
  border: 1px solid var(--brand-primary);
  padding: 2px 6px;
  color: var(--brand-active);
  font-size: var(--text-xs);
  font-weight: 900;
  line-height: 1.2;
}

.match-row__score-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.match-row__reward {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  min-width: 0;
  padding-right: 14px;
  color: var(--brand-hover);
  font-size: var(--text-sm);
  font-weight: 900;
}

@media (max-width: 900px) {
  .match-row {
    grid-template-columns: 72px minmax(0, 1fr) 112px;
  }
}

@media (max-width: 760px) {
  .match-panel {
    padding: 12px;
  }

  .match-panel__header {
    align-items: stretch;
  }

  .match-panel__refresh {
    width: 100%;
  }

  .match-row {
    grid-template-columns: 66px minmax(0, 1fr);
  }

  .match-row__reward {
    grid-column: 2;
    justify-content: flex-start;
    padding: 0 14px 10px;
  }
}
</style>