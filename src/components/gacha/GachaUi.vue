<script setup>
import { ref } from "vue";
import { ChevronDown } from "@lucide/vue";

defineProps({
  backgroundUrl: {
    type: String,
    required: true,
  },
  printerUrl: {
    type: String,
    required: true,
  },
  drawState: {
    type: String,
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
  isDrawActive: {
    type: Boolean,
    required: true,
  },
  arrowGuideStyle: {
    type: Object,
    default: () => ({}),
  },
  showGuide: {
    type: Boolean,
    default: true,
  },
  showActions: {
    type: Boolean,
    default: true,
  },
  isPrinterInteractive: {
    type: Boolean,
    default: true,
  },
});

defineEmits([
  "go-lobby",
  "reset-draw",
  "printer-pointer-down",
  "printer-pointer-move",
  "printer-pointer-up",
  "printer-pointer-cancel",
  "stage-click",
]);

const printerElement = ref(null);

function getPrinterRect() {
  return printerElement.value?.getBoundingClientRect() ?? null;
}

defineExpose({
  getPrinterRect,
});
</script>

<template>
  <main
    class="gacha-view relative h-[100svh] min-h-[100svh] w-screen overflow-hidden bg-[var(--brand-navy)] bg-cover bg-center bg-no-repeat text-white"
    :style="{ backgroundImage: `url(${backgroundUrl})` }"
    @click="$emit('stage-click')"
  >
    <div class="gacha-shade absolute inset-0" aria-hidden="true"></div>

    <button
      ref="printerElement"
      type="button"
      class="printer-button absolute bottom-0 left-0 z-10 flex h-[60svh] w-screen touch-none items-end justify-center overflow-visible border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-[5px] focus-visible:ring-[var(--brand-focus)]"
      :class="{
        'is-pulling': isPulling,
        'printer-button--interactive cursor-grab active:cursor-grabbing':
          isPrinterInteractive,
      }"
      :disabled="!isPrinterInteractive"
      @pointerdown="$emit('printer-pointer-down', $event)"
      @pointermove="$emit('printer-pointer-move', $event)"
      @pointerup="$emit('printer-pointer-up', $event)"
      @pointercancel="$emit('printer-pointer-cancel', $event)"
    >
      <span class="sr-only">印表機</span>
      <img
        :src="printerUrl"
        alt=""
        aria-hidden="true"
        class="printer-image block select-none object-contain"
        draggable="false"
      />
    </button>

    <div
      v-if="showGuide && !isDrawActive"
      class="chevron-guide pointer-events-none absolute bottom-[clamp(36px,7svh,76px)] left-1/2 z-20 grid justify-items-center gap-2 text-white lg:bottom-[clamp(52px,9vw,112px)]"
      :style="arrowGuideStyle"
      aria-hidden="true"
    >
      <ChevronDown
        v-for="index in 3"
        :key="index"
        class="chevron-guide__icon size-9 lg:size-12"
        :stroke-width="3"
      />
    </div>

    <slot></slot>

    <div
      v-if="showActions"
      class="gacha-actions absolute bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 lg:bottom-10"
    >
      <button
        type="button"
        class="gacha-button border btn-glass tap-pop min-h-8"
        @click="$emit('go-lobby')"
      >
        返回大廳
      </button>

      <button
        v-if="isRevealed"
        type="button"
        class="gacha-button border btn-dark tap-pop min-h-8 py-1.5 px-3 lg:py-2 lg:px-8"
        @click="$emit('reset-draw')"
      >
        再抽一次
      </button>
    </div>
  </main>
</template>

<style scoped>
.gacha-shade {
  background:
    linear-gradient(180deg, rgba(0, 19, 50, 0.18), rgba(0, 19, 50, 0.22)),
    radial-gradient(
      circle at 50% 42%,
      rgba(255, 255, 255, 0.18),
      transparent 32%
    );
  pointer-events: none;
}

.printer-button {
  filter: drop-shadow(0 18px 34px rgba(0, 19, 50, 0.42));
  transition:
    filter 180ms ease;
  will-change: filter;
}

.printer-button:disabled {
  pointer-events: none;
}

.printer-image {
  flex: none;
  height: 100%;
  max-width: none;
  min-width: 100vw;
  transform: scale(1.25);
  transform-origin: 50% 100%;
  width: auto;
}

.printer-button.is-pulling {
  filter: drop-shadow(0 26px 42px rgba(0, 19, 50, 0.5));
}

.chevron-guide {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.chevron-guide__icon {
  filter: drop-shadow(0 4px 10px rgba(0, 19, 50, 0.52));
  animation: chevron-guide-pulse 1.2s ease-in-out infinite;
}

.chevron-guide__icon:nth-child(2) {
  animation-delay: 120ms;
}

.chevron-guide__icon:nth-child(3) {
  animation-delay: 240ms;
}

.gacha-status {
  text-shadow: 0 2px 8px rgba(0, 19, 50, 0.52);
}

@media (prefers-reduced-motion: reduce) {
  .printer-button,
  .chevron-guide,
  .chevron-guide__icon,
  .gacha-button {
    transition: none;
    will-change: auto;
  }

  .chevron-guide__icon {
    animation: none;
  }
}

@keyframes chevron-guide-pulse {
  0%,
  100% {
    opacity: 0.54;
    transform: translateY(0);
  }

  50% {
    opacity: 1;
    transform: translateY(6px);
  }
}
</style>
