<script setup>
import RankingItem from "./RankingItem.vue";

defineProps({
  players: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <section class="result-ranking" aria-label="排行榜">
    <RankingItem
      v-for="(player, index) in players"
      :key="player.id"
      :player="player"
      :rank="index + 1"
      :delay="`${0.35 + index * 0.6}s`"
    />
  </section>
</template>

<style scoped>
.result-ranking {
  display: grid;
  grid-template-rows: repeat(4, 1fr);
  width: 100%;
  height: 100%;
  overflow: hidden;
  color: var(--brand-navy);
}

.result-ranking :deep(.ranking-item:nth-child(4)) {
  --item-offset-y: 2px;
}
</style>
