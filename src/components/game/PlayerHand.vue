<script setup>
import GameCard from './GameCard.vue'

defineProps({
  cards: {
    type: Array,
    required: true,
    validator: (cards) =>
      cards.every(
        (card) =>
          typeof card?.id === 'string' &&
          typeof card?.name === 'string' &&
          typeof card?.backgroundUrl === 'string' &&
          typeof card?.frameUrl === 'string',
      ),
  },
})
</script>

<template>
  <section
    class="player-hand pointer-events-none flex items-end justify-center"
    aria-label="你的手牌"
  >
    <div
      v-for="card in cards"
      :key="card.id"
      class="game-card-arrangement relative aspect-[3/4] h-[clamp(126px,31vh,230px)] origin-bottom"
    >
      <div class="game-card-motion size-full">
        <GameCard
          :name="card.name"
          :background-url="card.backgroundUrl"
          :frame-url="card.frameUrl"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.game-card-arrangement {
  filter: drop-shadow(0 12px 18px rgba(0, 19, 50, 0.32));
}

.game-card-arrangement:first-child {
  z-index: 1;
  transform: rotate(-5deg);
}

.game-card-arrangement:nth-child(2) {
  z-index: 2;
  margin-left: clamp(-42px, -3vw, -24px);
  transform: rotate(5deg);
}
</style>
