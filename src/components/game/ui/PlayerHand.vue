<script setup>
import { ref, toRaw } from 'vue'
import cursorGrabUrl from '@/assets/icons/cursor-grab.svg'
import cursorGrabbingUrl from '@/assets/icons/cursor-grabbing.svg'
import cursorPointerUrl from '@/assets/icons/cursor-pointer.svg'
import GameCard from './GameCard.vue'
import HoverBlockHint from './HoverBlockHint.vue'

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
  draggingCard: {
    type: Object,
    default: null,
  },
  disabledCardIds: {
    type: Array,
    default: () => [],
    validator: (cardIds) => cardIds.every((cardId) => typeof cardId === 'string'),
  },
  temporarilyHiddenCardIds: {
    type: Array,
    default: () => [],
    validator: (cardIds) => cardIds.every((cardId) => typeof cardId === 'string'),
  },
  isInteractionDisabled: {
    type: Boolean,
    default: false,
  },
  disabledMessage: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['card-pointerdown'])
const drawTarget = ref(null)
const dealTarget = ref(null)
const handRoot = ref(null)
const isDrawing = ref(false)

function prepareDrawTarget() {
  isDrawing.value = true
}

function getDrawTargetRect() {
  return drawTarget.value?.getBoundingClientRect() ?? null
}

function getDealTargetRect() {
  return dealTarget.value?.getBoundingClientRect() ?? null
}

function getHandRect() {
  const card = handRoot.value?.querySelector('.game-card-arrangement:not(.game-card-arrangement--draw-target)')
  return card?.getBoundingClientRect() ?? handRoot.value?.getBoundingClientRect() ?? null
}

function finishDraw() {
  isDrawing.value = false
}

function isCardDisabled(card) {
  return props.isInteractionDisabled || props.disabledCardIds.includes(card.id)
}

function isCardRuleDisabled(card) {
  return props.disabledCardIds.includes(card.id)
}

function isCardTemporarilyHidden(card) {
  return props.temporarilyHiddenCardIds.includes(card.id)
}

function isDraggingCard(card) {
  return Boolean(props.draggingCard) && toRaw(card) === toRaw(props.draggingCard)
}

function getHandElement() {
  return handRoot.value
}

const cursorStyle = {
  '--cursor-pointer': `url("${cursorPointerUrl}") 5 3, pointer`,
  '--cursor-grab': `url("${cursorGrabUrl}") 16 14, grab`,
  '--cursor-grabbing': `url("${cursorGrabbingUrl}") 16 14, grabbing`,
}

defineExpose({
  prepareDrawTarget,
  getDrawTargetRect,
  getDealTargetRect,
  getHandRect,
  getHandElement,
  finishDraw,
})
</script>

<template>
  <section
    ref="handRoot"
    class="player-hand relative"
    :style="cursorStyle"
    :class="{
      'player-hand--drawing': isDrawing,
      'player-hand--single': props.cards.length === 1,
    }"
    aria-label="玩家手牌"
  >
    <div
      v-for="(card, index) in cards"
      :key="card.instanceId ?? `${card.id}-${index}`"
      class="game-card-arrangement absolute bottom-0 left-1/2 aspect-[3/4] h-[clamp(126px,31vh,230px)] origin-bottom select-none"
      :class="{
        'game-card-arrangement--dragging': isDraggingCard(card),
        'game-card-arrangement--disabled': isCardDisabled(card),
        'game-card-arrangement--interaction-disabled': props.isInteractionDisabled,
        'game-card-arrangement--rule-disabled': isCardRuleDisabled(card),
        'game-card-arrangement--temporarily-hidden': isCardTemporarilyHidden(card),
        'hover-block-hint-target': props.isInteractionDisabled,
      }"
      role="button"
      tabindex="0"
      :aria-hidden="isCardTemporarilyHidden(card) ? 'true' : undefined"
      :aria-disabled="isCardDisabled(card) ? 'true' : undefined"
      :aria-label="`檢視卡牌：${card.displayName ?? card.name}`"
      @pointerdown="emit('card-pointerdown', card, $event)"
    >
      <div class="game-card-motion size-full">
        <GameCard
          :name="card.displayName ?? card.name"
          :background-url="card.backgroundUrl"
          :frame-url="card.frameUrl"
        />
      </div>
      <HoverBlockHint
        v-if="props.isInteractionDisabled && props.disabledMessage"
        :message="props.disabledMessage"
      />
    </div>

    <div
      ref="drawTarget"
      class="game-card-arrangement game-card-arrangement--draw-target absolute bottom-0 left-1/2 aspect-[3/4] h-[clamp(126px,31vh,230px)] origin-bottom"
      aria-hidden="true"
    />

    <div
      ref="dealTarget"
      class="game-card-arrangement--deal-target absolute bottom-0 left-1/2 aspect-[3/4] h-[clamp(126px,31vh,230px)] origin-bottom"
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
  cursor: var(--cursor-grab, grab) !important;
  touch-action: none;
  filter: drop-shadow(0 12px 18px rgba(0, 19, 50, 0.32));
  transition:
    transform 0.35s ease,
    opacity 0.18s ease,
    filter 0.18s ease;
  will-change: transform, opacity;
}

.game-card-arrangement:active {
  cursor: var(--cursor-grabbing, grabbing) !important;
}

.game-card-arrangement--rule-disabled,
.game-card-arrangement--rule-disabled:active {
  cursor: not-allowed !important;
}

.game-card-arrangement--interaction-disabled,
.game-card-arrangement--interaction-disabled:active {
  cursor: var(--cursor-pointer, pointer) !important;
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

.game-card-arrangement--temporarily-hidden {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .game-card-arrangement {
    transition-duration: 0.12s;
    will-change: auto;
  }
}

.game-card-arrangement--deal-target {
  visibility: hidden;
  transform: translateX(-50%);
}
</style>
