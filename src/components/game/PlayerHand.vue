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
  draggingCardId: {
    type: String,
    default: null,
  },
})

defineEmits(['card-pointerdown'])
</script>

<template>
  <section class="player-hand flex items-end justify-center" aria-label="玩家手牌">
    <div
      v-for="card in cards"
      :key="card.id"
      class="game-card-arrangement relative aspect-[3/4] h-[clamp(126px,31vh,230px)] origin-bottom select-none"
      :class="{ 'game-card-arrangement--dragging': card.id === draggingCardId }"
      role="button"
      tabindex="0"
      :aria-label="`出牌：${card.name}`"
      @pointerdown="$emit('card-pointerdown', card, $event)"
      @keydown.enter.prevent="$emit('card-pointerdown', card, $event)"
      @keydown.space.prevent="$emit('card-pointerdown', card, $event)"
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
  cursor: grab;
  touch-action: none;
  filter: drop-shadow(0 12px 18px rgba(0, 19, 50, 0.32));
  transition:
    transform 0.18s ease,
    opacity 0.18s ease,
    filter 0.18s ease;
}

.game-card-arrangement:active {
  cursor: grabbing;
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

.game-card-arrangement--dragging {
  opacity: 0;
  visibility: hidden;
  filter: drop-shadow(0 0 0 rgba(0, 0, 0, 0));
}
</style>
