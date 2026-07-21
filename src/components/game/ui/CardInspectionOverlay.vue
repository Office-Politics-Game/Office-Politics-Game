<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import GameCard from "./GameCard.vue";

const props = defineProps({
  card: { type: Object, required: true },
  cardAriaLabel: {
    type: String,
    default: null,
  },
  emitCardPointerDown: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["close", "card-pointerdown"]);
const cardRoot = ref(null);
const pointerX = ref(0);
const pointerY = ref(0);
const rotateX = ref(0);
const rotateY = ref(0);

const cardStyle = computed(() => ({
  "--pointer-x": pointerX.value,
  "--pointer-y": pointerY.value,
  transform: `rotateX(${rotateX.value}deg) rotateY(${rotateY.value}deg)`,
}));

function resetTilt() {
  pointerX.value = 0;
  pointerY.value = 0;
  rotateX.value = 0;
  rotateY.value = 0;
}

function handlePointerMove(event) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const rect = event.currentTarget.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const x = (event.clientX - rect.left - centerX) / centerX;
  const y = (event.clientY - rect.top - centerY) / centerY;

  pointerX.value = Math.max(-1, Math.min(1, x));
  pointerY.value = Math.max(-1, Math.min(1, y));
  rotateX.value = pointerY.value * -10;
  rotateY.value = pointerX.value * 10;
}

function handlePointerDown(event) {
  resetTilt();
  if (!props.emitCardPointerDown) return;
  emit("card-pointerdown", props.card, event, "inspection");
}

function handleKeydown(event) {
  if (event.key === "Escape") emit("close");
}

onMounted(() => window.addEventListener("keydown", handleKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", handleKeydown));
</script>

<template>
  <div
    class="card-inspection-overlay fixed inset-0 grid place-items-center"
    role="presentation"
    @pointerdown.self="emit('close')"
  >
    <div
      ref="cardRoot"
      class="card-inspection-overlay__card aspect-[3/4]"
      role="button"
      tabindex="0"
      :aria-label="cardAriaLabel ?? `收起或拖曳出牌：${card.displayName ?? card.name}`"
      :style="cardStyle"
      @pointerdown.stop="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerleave="resetTilt"
    >
      <GameCard
        :name="card.displayName ?? card.name"
        :background-url="card.backgroundUrl"
        :frame-url="card.frameUrl"
        inspection
      />
    </div>
  </div>
</template>

<style scoped>
.card-inspection-overlay {
  z-index: 48;
  padding: 10px;
  background: rgba(0, 19, 50, 0.58);
  perspective: 1200px;
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
}

.card-inspection-overlay__card {
  height: clamp(280px, 65dvh, 480px);
  max-width: calc(100vw - 20px);
  cursor: var(--cursor-grab, grab) !important;
  touch-action: none;
  transform-style: preserve-3d;
  transition: transform 0.12s ease-out;
  filter: drop-shadow(0 20px 32px rgba(0, 19, 50, 0.48));
  will-change: transform;
}

.card-inspection-overlay__card:active {
  cursor: var(--cursor-grabbing, grabbing) !important;
}

.card-inspection-overlay__card:focus-visible {
  outline: none;
  box-shadow: 0 0 0 5px var(--brand-focus);
}

@media (prefers-reduced-motion: reduce) {
  .card-inspection-overlay__card {
    transform: none !important;
    transition: none;
    will-change: auto;
  }
}
</style>
