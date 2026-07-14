<script setup>
import GameCard from "@/components/game/ui/GameCard.vue";

defineProps({
  isCardVisible: {
    type: Boolean,
    required: true,
  },
  isPulling: {
    type: Boolean,
    required: true,
  },
  isReadyToReveal: {
    type: Boolean,
    required: true,
  },
  isRevealed: {
    type: Boolean,
    required: true,
  },
  drawState: {
    type: String,
    required: true,
  },
  cardFlightStyle: {
    type: Object,
    default: () => ({}),
  },
  cardPullPreviewStyle: {
    type: Object,
    default: () => ({}),
  },
  cardBackUrl: {
    type: String,
    required: true,
  },
  card: {
    type: Object,
    required: true,
  },
});

defineEmits(["reveal", "flight-end"]);
</script>

<template>
  <div
    v-show="isCardVisible"
    class="gacha-card fixed left-0 top-0 z-30 block select-none"
    :class="{
      'is-flying': drawState === 'flying',
      'is-ready-to-reveal': isReadyToReveal,
      'is-revealed': isRevealed,
    }"
    :style="cardFlightStyle"
    @animationend="$emit('flight-end')"
  >
    <button
      type="button"
      class="gacha-card-button block size-full border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-[5px] focus-visible:ring-[var(--brand-focus)]"
      :aria-disabled="!isReadyToReveal"
      aria-label="揭曉招募卡片"
      @click="$emit('reveal')"
      @keydown.enter.prevent="$emit('reveal')"
      @keydown.space.prevent="$emit('reveal')"
    >
      <span class="gacha-card-inner block size-full">
        <img
          :src="cardBackUrl"
          alt=""
          aria-hidden="true"
          class="gacha-card-face gacha-card-back absolute inset-0 block size-full object-contain"
          draggable="false"
        />
        <GameCard
          class="gacha-card-face gacha-card-front absolute inset-0"
          :name="card.name"
          :background-url="card.backgroundUrl"
          :frame-url="card.frameUrl"
        />
      </span>
    </button>
  </div>

  <div
    v-if="isPulling && !isCardVisible"
    class="gacha-card gacha-card-preview pointer-events-none fixed left-0 top-0 z-30 block select-none"
    :style="cardPullPreviewStyle"
    aria-hidden="true"
  >
    <img
      :src="cardBackUrl"
      alt=""
      class="absolute inset-0 block size-full object-contain"
      draggable="false"
    />
  </div>
</template>

<style scoped>
.gacha-card {
  filter: drop-shadow(0 22px 34px rgba(0, 19, 50, 0.48));
  perspective: 1000px;
  opacity: var(--card-pull-opacity, 1);
  transform: translate3d(var(--card-start-x, 50vw), var(--card-start-y, 70vh), 0) scale(0.58);
  transform-origin: 50% 50%;
  will-change: transform, opacity;
}

.gacha-card.is-flying {
  animation: gacha-card-flight var(--card-flight-duration, 1680ms) both;
}

.gacha-card.is-ready-to-reveal,
.gacha-card.is-revealed {
  transform: translate3d(var(--card-end-x, 50vw), var(--card-end-y, 50vh), 0) scale(1);
}

.gacha-card-button:disabled {
  cursor: default;
}

.gacha-card-inner {
  position: relative;
  transform-style: preserve-3d;
  transition: transform 520ms cubic-bezier(0.22, 0.61, 0.36, 1);
}

.gacha-card.is-revealed .gacha-card-inner {
  transform: rotateY(180deg);
}

.gacha-card-face {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.gacha-card-front {
  transform: rotateY(180deg);
}

@media (prefers-reduced-motion: reduce) {
  .gacha-card,
  .gacha-card-inner {
    transition: none;
    will-change: auto;
  }
}

@keyframes gacha-card-flight {
  0% {
    opacity: 1;
    transform: translate3d(var(--card-start-x), var(--card-start-y), 0) scale(0.58);
  }

  14% {
    opacity: 1;
    transform: translate3d(var(--card-start-x), calc(var(--card-start-y) - 24px), 0) scale(0.58);
  }

  48% {
    opacity: 1;
    transform: translate3d(var(--card-offscreen-x), var(--card-offscreen-y), 0) scale(0.58);
  }

  100% {
    opacity: 1;
    transform: translate3d(var(--card-end-x), var(--card-end-y), 0) scale(1);
  }
}
</style>
