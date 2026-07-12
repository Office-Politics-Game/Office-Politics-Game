<script setup>
import { computed } from "vue";

const props = defineProps({
  guessOptions: {
    type: Array,
    required: true,
    validator: (options) =>
      options.every(
        (option) =>
          Number.isInteger(option?.rank) && typeof option?.name === "string",
      ),
  },
  selectedRank: {
    type: Number,
    default: null,
  },
  excludedRanks: {
    type: Array,
    default: () => [],
    validator: (ranks) => ranks.every((rank) => Number.isInteger(rank)),
  },
});

const emit = defineEmits(["select"]);

const excludedRankSet = computed(() => new Set(props.excludedRanks));
</script>

<template>
  <section class="card-guess-selector" aria-label="選擇猜測牌名">
    <button
      v-for="option in guessOptions"
      :key="option.rank"
      type="button"
      class="card-guess-selector__option"
      :class="{
        'card-guess-selector__option--selected': selectedRank === option.rank,
      }"
      :aria-pressed="selectedRank === option.rank"
      :disabled="excludedRankSet.has(option.rank)"
      @click="emit('select', option.rank)"
    >
      <span>{{ option.rank }}</span>
      {{ option.name }}
    </button>
  </section>
</template>

<style scoped>
.card-guess-selector {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.card-guess-selector__option {
  min-height: 38px;
  border: 1px solid rgba(148, 163, 184, 0.5);
  border-radius: var(--radius-md, 0);
  padding: 0 10px;
  cursor: pointer;
  background: rgba(15, 23, 42, 0.76);
  color: #f8fafc;
  font-size: 14px;
  font-weight: 700;
}

.card-guess-selector__option span {
  color: #facc15;
}

.card-guess-selector__option:hover:not(:disabled),
.card-guess-selector__option--selected {
  border-color: rgba(250, 204, 21, 0.86);
  background: rgba(250, 204, 21, 0.16);
}

.card-guess-selector__option:disabled {
  cursor: not-allowed;
  opacity: 0.3;
}
</style>
