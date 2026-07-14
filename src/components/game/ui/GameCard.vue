<script setup>
defineProps({
  name: {
    type: String,
    required: true,
  },
  backgroundUrl: {
    type: String,
    required: true,
  },
  frameUrl: {
    type: String,
    required: true,
  },
  inspection: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div
    class="game-card relative block size-full select-none"
    :class="{ 'game-card--inspection': inspection }"
    role="img"
    :aria-label="name"
  >
    <img
      :src="backgroundUrl"
      alt=""
      aria-hidden="true"
      class="game-card__background absolute inset-0 block size-full object-contain"
      draggable="false"
    />
    <img
      :src="frameUrl"
      alt=""
      aria-hidden="true"
      class="game-card__frame absolute inset-0 block size-full object-contain"
      draggable="false"
    />
  </div>
</template>

<style scoped>
.game-card {
  transform-style: preserve-3d;
}

.game-card__background,
.game-card__frame {
  pointer-events: none;
  transition: transform 0.12s ease-out;
}

.game-card--inspection .game-card__background {
  transform: translate3d(
      calc(var(--pointer-x, 0) * -3px),
      calc(var(--pointer-y, 0) * -3px),
      42px
    )
    scale(1.035);
}

.game-card--inspection .game-card__frame {
  transform: translateZ(90px) scale(1.01);
}

@media (prefers-reduced-motion: reduce) {
  .game-card__background,
  .game-card__frame {
    transition: none;
  }

  .game-card--inspection .game-card__background,
  .game-card--inspection .game-card__frame {
    transform: none;
  }
}
</style>
