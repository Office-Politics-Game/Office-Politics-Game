<script setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import defaultCardBackUrl from '@/assets/images/card-bg-back.webp'
import GameCard from '../ui/GameCard.vue'
import { useAppearanceStore } from '@/stores/appearanceStore.js'

defineProps({
  card: {
    type: Object,
    default: null,
  },
  showFront: {
    type: Boolean,
    default: true,
  },
  useImageFront: {
    type: Boolean,
    default: false,
  },
  frontFlipped: {
    type: Boolean,
    default: false,
  },
  overlayBehindCard: {
    type: Boolean,
    default: false,
  },
})

const cardElement = ref(null)
const flipperElement = ref(null)
const appearanceStore = useAppearanceStore()
const { cardBackUrl } = storeToRefs(appearanceStore)

defineExpose({
  getCardElement() {
    return cardElement.value
  },
  getFlipperElement() {
    return flipperElement.value
  },
})
</script>

<template>
  <div
    ref="cardElement"
    class="effect-card-layer"
    :class="{
      'effect-card-layer--front-flipped': frontFlipped,
      'effect-card-layer--overlay-behind-card': overlayBehindCard,
    }"
  >
    <div class="effect-card-layer__overlay">
      <slot name="overlay"></slot>
    </div>
    <div ref="flipperElement" class="effect-card-layer__flipper">
      <div
        v-show="showFront"
        class="effect-card-layer__face effect-card-layer__face--front"
      >
        <template v-if="card">
          <template v-if="useImageFront">
            <img :src="card.backgroundUrl" alt="" draggable="false" />
            <img :src="card.frameUrl" alt="" draggable="false" />
          </template>
          <GameCard
            v-else
            :name="card.displayName ?? card.name"
            :background-url="card.backgroundUrl"
            :frame-url="card.frameUrl"
          />
        </template>
      </div>
      <div class="effect-card-layer__face effect-card-layer__face--back">
        <img :src="cardBackUrl || defaultCardBackUrl" alt="" draggable="false" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.effect-card-layer {
  position: fixed;
  perspective: 1200px;
  transform-origin: 50% 50%;
  will-change: transform, opacity, filter;
}

.effect-card-layer__flipper {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  will-change: transform;
}

.effect-card-layer__overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

.effect-card-layer--overlay-behind-card .effect-card-layer__overlay {
  z-index: 0;
}

.effect-card-layer__face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  filter: var(--effect-card-face-filter, none);
}

.effect-card-layer__face > img {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
}

.effect-card-layer__face--back {
  transform: rotateY(180deg);
}

.effect-card-layer--front-flipped .effect-card-layer__face--front {
  transform: rotateY(180deg);
}

.effect-card-layer--front-flipped .effect-card-layer__face--back {
  transform: none;
}

.effect-card-layer__face--back img {
  object-fit: contain;
}

@media (prefers-reduced-motion: reduce) {
  .effect-card-layer,
  .effect-card-layer__flipper {
    will-change: auto;
  }
}
</style>
