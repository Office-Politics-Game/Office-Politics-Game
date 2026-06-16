<script setup>
import { ref } from 'vue'
import GameCard from './GameCard.vue'

const props = defineProps({
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

const emit = defineEmits(['card-pointerdown'])
const drawTarget = ref(null)
const isDrawing = ref(false)

function prepareDrawTarget() {
  isDrawing.value = true
}

function getDrawTargetRect() {
  return drawTarget.value?.getBoundingClientRect() ?? null
}

function finishDraw() {
  isDrawing.value = false
}

defineExpose({
  prepareDrawTarget,
  getDrawTargetRect,
  finishDraw,
})
</script>

<template>
  <section
    class="player-hand relative"
    :class="{
      'player-hand--drawing': isDrawing,
      'player-hand--single': props.cards.length === 1,
    }"
    aria-label="玩家手牌"
  >
    <div
      v-for="card in cards"
      :key="card.id"
      class="game-card-arrangement absolute bottom-0 left-1/2 aspect-[3/4] h-[clamp(126px,31vh,230px)] origin-bottom select-none"
      :class="{ 'game-card-arrangement--dragging': card.id === draggingCardId }"
      role="button"
      tabindex="0"
      :aria-label="`出牌：${card.name}`"
      @pointerdown="emit('card-pointerdown', card, $event)"
    >
      <div class="game-card-motion size-full">
        <GameCard
          :name="card.name"
          :background-url="card.backgroundUrl"
          :frame-url="card.frameUrl"
        />
      </div>
    </div>

    <div
      ref="drawTarget"
      class="game-card-arrangement game-card-arrangement--draw-target absolute bottom-0 left-1/2 aspect-[3/4] h-[clamp(126px,31vh,230px)] origin-bottom"
      aria-hidden="true"
    />
  </section>
</template>

<style scoped>
.player-hand {
  width: clamp(210px, 34vw, 390px);
  height: clamp(126px, 31vh, 230px);
}

.game-card-arrangement {
  cursor: grab;
  touch-action: none;
  filter: drop-shadow(0 12px 18px rgba(0, 19, 50, 0.32));
  transition:
    transform 0.35s ease,
    opacity 0.18s ease,
    filter 0.18s ease;
  will-change: transform, opacity;
}

.game-card-arrangement:active {
  cursor: grabbing;
}

.game-card-arrangement:nth-child(1) {
  z-index: 1;
  transform: translateX(-88%) rotate(-5deg);
}

.game-card-arrangement:nth-child(2),
.game-card-arrangement--draw-target {
  z-index: 2;
  transform: translateX(-12%) rotate(5deg);
}

.player-hand--single:not(.player-hand--drawing)
  .game-card-arrangement:nth-child(1) {
  transform: translateX(-50%);
}

.game-card-arrangement--draw-target {
  visibility: hidden;
}

.game-card-arrangement--dragging {
  opacity: 0;
  visibility: hidden;
  filter: drop-shadow(0 0 0 rgba(0, 0, 0, 0));
}

@media (prefers-reduced-motion: reduce) {
  .game-card-arrangement {
    transition-duration: 0.12s;
    will-change: auto;
  }
}
</style>
