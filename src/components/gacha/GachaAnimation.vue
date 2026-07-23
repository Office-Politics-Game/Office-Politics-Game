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
  isCollecting: {
    type: Boolean,
    required: true,
  },
  showQueuedCard: {
    type: Boolean,
    default: false,
  },
  drawState: {
    type: String,
    required: true,
  },
  cardFlightKey: {
    type: Number,
    default: 0,
  },
  cardFlightStyle: {
    type: Object,
    default: () => ({}),
  },
  queuedCardStyle: {
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
    default: null,
  },
  compensationCoins: {
    type: Number,
    default: 0,
  },
});

defineEmits(["reveal", "flight-end"]);
</script>

<template>
  <div
    v-if="showQueuedCard"
    class="gacha-card gacha-card-queued pointer-events-none fixed left-0 top-0 z-20 block select-none"
    :style="queuedCardStyle"
    aria-hidden="true"
  >
    <img
      :src="cardBackUrl"
      alt=""
      class="absolute inset-0 block size-full object-contain"
      draggable="false"
    />
  </div>

  <div
    :key="cardFlightKey"
    v-show="isCardVisible"
    class="gacha-card fixed left-0 top-0 z-30 block select-none"
    :class="{
      'is-flying': drawState === 'flying',
      'is-waiting-result': drawState === 'waiting-result',
      'is-ready-to-reveal': isReadyToReveal,
      'is-revealed': isRevealed,
      'is-collecting': drawState === 'collecting',
      'is-compensating': drawState === 'compensating',
      'is-multi-print': cardFlightStyle['--card-flight-animation'] === 'gacha-card-pop',
    }"
    :style="cardFlightStyle"
    @animationend="$emit('flight-end')"
  >
    <button
      type="button"
      class="gacha-card-button block size-full border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-[5px] focus-visible:ring-[var(--brand-focus)]"
      :aria-disabled="!isReadyToReveal"
      aria-label="揭曉招募卡片"
      @click.stop="$emit('reveal')"
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
          v-if="card"
          :key="`${card.id}-${card.backgroundUrl}-${card.frameUrl}`"
          class="gacha-card-face gacha-card-front absolute inset-0"
          :name="card.name"
          :background-url="card.backgroundUrl"
          :frame-url="card.frameUrl"
        />
      </span>
    </button>

    <div
      v-if="drawState === 'compensating' && compensationCoins"
      class="gacha-compensation pointer-events-none absolute inset-0 grid place-items-center text-xl font-black text-amber-200 drop-shadow-[0_4px_10px_rgba(0,19,50,0.85)]"
      aria-hidden="true"
    >
      +{{ compensationCoins }} 金幣
    </div>
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

.gacha-card.is-flying.is-multi-print {
  animation: gacha-card-pop var(--card-flight-duration, 240ms) both;
}

.gacha-card.is-multi-print {
  transform-origin: 50% 0;
}

.gacha-card.is-waiting-result,
.gacha-card.is-ready-to-reveal,
.gacha-card.is-revealed {
  transform: translate3d(var(--card-end-x, 50vw), var(--card-end-y, 50vh), 0) scale(1);
}

.gacha-card.is-waiting-result.is-multi-print {
  transform: translate3d(var(--card-end-x), var(--card-end-y), 0) scale(var(--card-preview-scale, 0.36));
}

.gacha-card.is-collecting {
  animation: gacha-card-collect 420ms ease-in both;
}

.gacha-card.is-compensating {
  animation: gacha-card-compensate 1100ms ease-out both;
}

.gacha-card-preview {
  clip-path: inset(0 0 calc(100% - var(--card-reveal-percent, 8%)) 0);
  transform: translate3d(var(--card-start-x), var(--card-start-y), 0) scale(var(--card-preview-scale, 0.36));
  transform-origin: 50% 0;
}

.gacha-card-queued {
  transform: translate3d(var(--card-start-x), var(--card-start-y), 0) scale(var(--card-preview-scale, 0.36));
  transform-origin: 50% 0;
}

.gacha-card-button:disabled {
  cursor: default;
}

.gacha-card-inner {
  position: relative;
  transform-style: preserve-3d;
  transition: transform 320ms ease-out;
}

.gacha-card.is-revealed .gacha-card-inner,
.gacha-card.is-collecting .gacha-card-inner {
  transform: rotateY(180deg);
}

.gacha-card.is-compensating .gacha-card-inner {
  opacity: 0;
  transform: rotateY(180deg) scale(0.4);
  transition: opacity 160ms ease-out, transform 160ms ease-out;
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
    transform: translate3d(var(--card-start-x), var(--card-start-y), 0) scale(var(--card-preview-scale, 0.36));
  }

  24% {
    opacity: 1;
    transform: translate3d(var(--card-start-x), calc(var(--card-start-y) - 28px), 0) scale(0.48);
  }

  100% {
    opacity: 1;
    transform: translate3d(var(--card-end-x), var(--card-end-y), 0) scale(1);
  }
}

@keyframes gacha-card-pop {
  0% {
    opacity: 1;
    transform: translate3d(var(--card-start-x), var(--card-start-y), 0) scale(var(--card-preview-scale, 0.36));
  }

  72% {
    opacity: 1;
    transform: translate3d(var(--card-end-x), var(--card-end-y), 0) scale(var(--card-preview-scale, 0.36));
  }

  100% {
    opacity: 1;
    transform: translate3d(var(--card-end-x), var(--card-end-y), 0) scale(var(--card-preview-scale, 0.36));
  }
}

@keyframes gacha-card-collect {
  0% {
    opacity: 1;
    transform: translate3d(var(--card-end-x), var(--card-end-y), 0) scale(1);
  }

  100% {
    opacity: 0;
    transform: translate3d(var(--card-collect-x), var(--card-collect-y), 0) scale(0.16);
  }
}

@keyframes gacha-card-compensate {
  0% {
    opacity: 1;
    transform: translate3d(var(--card-end-x), var(--card-end-y), 0) scale(1);
  }

  62% {
    opacity: 1;
    transform: translate3d(var(--card-end-x), calc(var(--card-end-y) - 10px), 0) scale(1);
  }

  100% {
    opacity: 0;
    transform: translate3d(var(--card-end-x), calc(var(--card-end-y) - 46px), 0) scale(0.96);
  }
}
</style>
