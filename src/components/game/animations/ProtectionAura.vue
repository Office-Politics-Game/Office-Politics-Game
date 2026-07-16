<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

const props = defineProps({
  successKey: {
    type: [Number, String],
    default: 0,
  },
  showSuccessLabel: {
    type: Boolean,
    default: false,
  },
  screenAnchored: {
    type: Boolean,
    default: false,
  },
  position: {
    type: String,
    default: "bottom",
    validator: (position) =>
      ["top", "left", "right", "bottom"].includes(position),
  },
});

const isSuccessFlashing = ref(false);
const isSuccessLabelVisible = ref(false);
const flashId = ref(0);
const viewportSize = ref(getViewportSize());
let flashTimeout = null;
let successLabelTimeout = null;
const SUCCESS_LABEL_DURATION_MS = 1500;
const positionRotations = {
  top: "180deg",
  left: "90deg",
  right: "-90deg",
  bottom: "0deg",
};
const screenEdgePresets = {
  compact: {
    width: 1024,
    height: 348,
    sideWidth: 680,
    sideHeight: 348,
    topOverflow: 200,
    bottomOverflow: 240,
    sideOverflow: 120,
  },
  wide: {
    width: 1920,
    height: 464,
    sideWidth: 1200,
    sideHeight: 464,
    topOverflow: 180,
    bottomOverflow: 240,
    sideOverflow: 50,
  },
};

const auraStyle = computed(() => {
  if (!props.screenAnchored) {
    return null;
  }

  const viewportWidth = viewportSize.value.width;
  const viewportHeight = viewportSize.value.height;
  const { width, height } = getAuraSize({
    viewportWidth,
  });
  const center = getScreenEdgeCenter({
    width,
    height,
    viewportWidth,
    viewportHeight,
  });

  return {
    "--protection-aura-left": `${center.x}px`,
    "--protection-aura-top": `${center.y}px`,
    "--protection-aura-width": `${width}px`,
    "--protection-aura-height": `${height}px`,
    "--protection-aura-rotation": positionRotations[props.position] ?? "0deg",
  };
});

function getAuraSize({ viewportWidth }) {
  const preset = getCurrentScreenEdgePreset(viewportWidth);
  const isSide = props.position === "left" || props.position === "right";

  return {
    width: isSide ? preset.sideWidth : preset.width,
    height: isSide ? preset.sideHeight : preset.height,
  };
}

function getCurrentScreenEdgePreset(viewportWidth) {
  return viewportWidth < 1024
    ? screenEdgePresets.compact
    : screenEdgePresets.wide;
}

function getScreenEdgeCenter({ width, height, viewportWidth, viewportHeight }) {
  const preset = getCurrentScreenEdgePreset(viewportWidth);

  if (props.position === "top") {
    return {
      x: viewportWidth / 2,
      y: -preset.topOverflow + height / 2,
    };
  }

  if (props.position === "bottom") {
    return {
      x: viewportWidth / 2,
      y: viewportHeight + preset.bottomOverflow - height / 2,
    };
  }

  if (props.position === "left") {
    return {
      x: -preset.sideOverflow + height / 2,
      y: viewportHeight / 2,
    };
  }

  return {
    x: viewportWidth + preset.sideOverflow - height / 2,
    y: viewportHeight / 2,
  };
}

function playSuccessFlash() {
  window.clearTimeout(flashTimeout);
  window.clearTimeout(successLabelTimeout);
  flashId.value += 1;
  isSuccessFlashing.value = true;
  isSuccessLabelVisible.value = props.showSuccessLabel;
  flashTimeout = window.setTimeout(() => {
    isSuccessFlashing.value = false;
  }, 760);
  successLabelTimeout = window.setTimeout(() => {
    isSuccessLabelVisible.value = false;
  }, SUCCESS_LABEL_DURATION_MS);
}

function getViewportSize() {
  if (typeof window === "undefined") {
    return {
      width: 0,
      height: 0,
    };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

function updateViewportSize() {
  viewportSize.value = getViewportSize();
}

watch(
  () => props.successKey,
  (nextValue, previousValue) => {
    if (nextValue === previousValue) {
      return;
    }

    playSuccessFlash();
  },
);

onMounted(() => {
  updateViewportSize();
  window.addEventListener("resize", updateViewportSize, { passive: true });
  playSuccessFlash();
});

onUnmounted(() => {
  window.removeEventListener("resize", updateViewportSize);
  window.clearTimeout(flashTimeout);
  window.clearTimeout(successLabelTimeout);
});
</script>

<template>
  <div
    class="protection-aura"
    :class="[
      `protection-aura--${position}`,
      { 'protection-aura--anchored': screenAnchored },
    ]"
    :style="auraStyle"
    aria-hidden="true"
  >
    <span
      v-if="isSuccessFlashing"
      :key="flashId"
      class="protection-aura__success-flash"
    ></span>
    <span
      v-if="isSuccessLabelVisible"
      :key="`success-label-${flashId}`"
      class="protection-aura__success-label-anchor"
    >
      <span class="protection-aura__success-label" aria-label="特休假">
        <span>特</span><span>休</span><span>假</span>
      </span>
    </span>
  </div>
</template>

<style scoped>
.protection-aura {
  position: absolute;
  right: 50%;
  bottom: clamp(-70px, -8vh, -42px);
  z-index: 5;
  width: min(90vw, 960px);
  height: clamp(220px, 38vh, 380px);
  pointer-events: none;
  transform: translateX(50%);
  animation:
    protectionAuraFadeIn 0.36s ease-out both,
    protectionAuraPulse 2.8s ease-in-out 0.36s infinite;
  mix-blend-mode: screen;
}

.protection-aura--anchored {
  position: fixed;
  z-index: 24;
  top: var(--protection-aura-top);
  right: auto;
  bottom: auto;
  left: var(--protection-aura-left);
  width: var(--protection-aura-width);
  height: var(--protection-aura-height);
  transform: translate(-50%, -50%) rotate(var(--protection-aura-rotation));
  transform-origin: 50% 50%;
}

:global(.protection-aura-fade-leave-active) {
  animation: protectionAuraFadeOut 0.28s ease-in forwards !important;
}

:global(.protection-aura-fade-leave-active .protection-aura__success-flash) {
  display: none;
}

:global(.protection-aura-fade-leave-active .protection-aura__success-label-anchor) {
  display: none;
}

.protection-aura::before,
.protection-aura::after {
  position: absolute;
  content: "";
  pointer-events: none;
}

.protection-aura::before {
  inset: 0;
  border: 1px solid rgba(255, 255, 255, 0.34);
  border-bottom: 0;
  border-radius: 50% 50% 0 0 / 100% 100% 0 0;
  background:
    radial-gradient(
      ellipse at 50% 58%,
      transparent 0%,
      transparent 38%,
      rgba(245, 224, 255, 0.12) 58%,
      rgba(255, 255, 255, 0.3) 100%
    ),
    radial-gradient(
      ellipse at 50% 58%,
      transparent 0%,
      transparent 48%,
      rgba(229, 241, 255, 0.14) 66%,
      rgba(255, 214, 238, 0.24) 100%
    );
  box-shadow:
    0 -24px 76px rgba(232, 213, 255, 0.34),
    0 -10px 34px rgba(255, 231, 241, 0.28),
    inset 0 24px 58px rgba(255, 255, 255, 0.24),
    inset 0 -28px 54px rgba(205, 230, 255, 0.12);
  opacity: 0.82;
  -webkit-mask-image:
    linear-gradient(180deg, #000 0%, #000 10%, transparent 100%),
    radial-gradient(ellipse at 50% 100%, #000 0%, #000 70%, transparent 71%);
  -webkit-mask-composite: source-in;
  mask-image:
    linear-gradient(180deg, #000 0%, #000 10%, transparent 100%),
    radial-gradient(ellipse at 50% 100%, #000 0%, #000 70%, transparent 71%);
  mask-composite: intersect;
}

.protection-aura::after {
  right: 2%;
  bottom: 5%;
  left: 2%;
  height: 90%;
  border-radius: 999px;
  background: radial-gradient(
    ellipse at 50% 50%,
    transparent 0%,
    transparent 46%,
    rgba(255, 231, 246, 0.14) 68%,
    rgba(220, 237, 255, 0.2) 100%
  );
  filter: blur(22px);
  -webkit-mask-image:
    linear-gradient(180deg, #000 0%, #000 5%, transparent 100%),
    radial-gradient(ellipse at 50% 100%, #000 0%, #000 72%, transparent 73%);
  -webkit-mask-composite: source-in;
  mask-image:
    linear-gradient(180deg, #000 0%, #000 5%, transparent 100%),
    radial-gradient(ellipse at 50% 100%, #000 0%, #000 72%, transparent 73%);
  mask-composite: intersect;
}

.protection-aura__success-flash {
  position: absolute;
  inset: -12% -8% -2%;
  z-index: 2;
  border-radius: 50% 50% 0 0 / 100% 100% 0 0;
  background:
    radial-gradient(
      ellipse at 50% 62%,
      rgba(255, 255, 255, 0.95),
      rgba(232, 245, 255, 0.42) 34%,
      transparent 66%
    ),
    radial-gradient(
      ellipse at 50% 100%,
      transparent 0%,
      transparent 48%,
      rgba(255, 255, 255, 0.7) 78%,
      rgba(255, 255, 255, 0.94) 100%
    );
  box-shadow:
    0 -34px 96px rgba(255, 255, 255, 0.72),
    0 -18px 58px rgba(186, 230, 253, 0.58),
    inset 0 18px 68px rgba(255, 255, 255, 0.62);
  opacity: 0;
  transform: scale(0.92);
  animation: protectionSuccessFlash 0.76s ease-out forwards;
  mix-blend-mode: screen;
  pointer-events: none;
  -webkit-mask-image:
    linear-gradient(180deg, #000 0%, #000 18%, transparent 100%),
    radial-gradient(ellipse at 50% 100%, #000 0%, #000 72%, transparent 73%);
  -webkit-mask-composite: source-in;
  mask-image:
    linear-gradient(180deg, #000 0%, #000 18%, transparent 100%),
    radial-gradient(ellipse at 50% 100%, #000 0%, #000 72%, transparent 73%);
  mask-composite: intersect;
}

.protection-aura__success-label-anchor {
  position: absolute;
  top: -48px;
  left: 50%;
  z-index: 3;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.protection-aura__success-label {
  display: inline-flex;
  color: #fff;
  font-size: var(--text-xl);
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0.04em;
  white-space: nowrap;
  text-shadow:
    0 2px 4px rgba(70, 70, 70, 0.92),
    0 0 10px rgba(70, 70, 70, 0.72);
  animation: protectionSuccessLabel 1.5s ease-out forwards;
  transform: rotate(var(--protection-label-counter-rotation, 0deg));
  transform-origin: 50% 50%;
}

.protection-aura--top {
  --protection-label-counter-rotation: -180deg;
}

.protection-aura--left {
  --protection-label-counter-rotation: -90deg;
}

.protection-aura--right {
  --protection-label-counter-rotation: 90deg;
}

.protection-aura--bottom {
  --protection-label-counter-rotation: 0deg;
}

.protection-aura--left .protection-aura__success-label,
.protection-aura--right .protection-aura__success-label {
  flex-direction: column;
}

@keyframes protectionAuraPulse {
  0%,
  100% {
    opacity: 0.72;
    filter: saturate(0.96) brightness(1);
  }

  50% {
    opacity: 0.9;
    filter: saturate(1.06) brightness(1.06);
  }
}

@keyframes protectionAuraFadeIn {
  0% {
    opacity: 0;
    filter: saturate(0.96) brightness(1.08);
  }

  100% {
    opacity: 0.72;
    filter: saturate(0.96) brightness(1);
  }
}

@keyframes protectionAuraFadeOut {
  0% {
    opacity: 0.72;
    filter: saturate(0.96) brightness(1);
  }

  100% {
    opacity: 0;
    filter: saturate(0.92) brightness(0.96);
  }
}

@keyframes protectionSuccessFlash {
  0% {
    opacity: 0;
    transform: scale(0.9);
    filter: brightness(1.1) saturate(1);
  }

  18% {
    opacity: 1;
    transform: scale(1.02);
    filter: brightness(2.35) saturate(1.22);
  }

  48% {
    opacity: 0.72;
    transform: scale(1.08);
    filter: brightness(1.75) saturate(1.12);
  }

  100% {
    opacity: 0;
    transform: scale(1.16);
    filter: brightness(1) saturate(1);
  }
}

@keyframes protectionSuccessLabel {
  0% {
    opacity: 0;
    transform: rotate(var(--protection-label-counter-rotation, 0deg)) scale(0.92);
  }

  12%,
  78% {
    opacity: 1;
    transform: rotate(var(--protection-label-counter-rotation, 0deg)) scale(1);
  }

  100% {
    opacity: 0;
    transform: rotate(var(--protection-label-counter-rotation, 0deg)) scale(1.04);
  }
}

@media (min-width: 1024px) {
  .protection-aura__success-label-anchor {
    top: -64px;
  }
}

@media (max-width: 1024px) {
  .protection-aura:not(.protection-aura--anchored) {
    transform: translateX(50%) translateY(25%);
  }
}
</style>
