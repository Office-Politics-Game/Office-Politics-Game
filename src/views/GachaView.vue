<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from "vue";
import { useRouter } from "vue-router";
import bgGachaUrl from "@/assets/images/bg-gacha.webp";
import gachaPrinterUrl from "@/assets/images/gacha-printer.webp";
import cardBackUrl from "@/assets/images/card-bg-back.webp";
import GachaAnimation from "@/components/gacha/GachaAnimation.vue";
import GachaUi from "@/components/gacha/GachaUi.vue";
import { cardAssetsByKey } from "@/constants/cardAssets.js";

const PULL_THRESHOLD = 70;
const MAX_PULL = 112;
const CARD_RATIO = 1.45;
const CARD_WIDTH_MIN = 150;
const CARD_WIDTH_MAX = 240;
const CARD_WIDTH_VW = 0.16;
const DESKTOP_CARD_WIDTH_MULTIPLIER = 2;
const DESKTOP_CARD_MIN_WIDTH = 1024;
const CARD_FLIGHT_DURATION_MS = 1680;
const PRINT_START_MIN_RATIO = 0.56;
const PRINT_START_MAX_CARD_OFFSET = 0.74;

const router = useRouter();
const gachaUi = ref(null);
const drawState = ref("idle");
const pullDistance = ref(0);
const activePointerId = ref(null);
const pointerStartY = ref(0);
const isCardVisible = ref(false);
const cardFlightStyle = ref({});

const ceoCard = cardAssetsByKey.ceo;

const isPulling = computed(() => drawState.value === "pulling");
const isReadyToReveal = computed(() => drawState.value === "ready-to-reveal");
const isRevealed = computed(() => drawState.value === "revealed");
const isDrawActive = computed(
  () => !["idle", "pulling"].includes(drawState.value),
);
const arrowProgress = computed(() =>
  Math.min(1, pullDistance.value / PULL_THRESHOLD),
);
const arrowGuideStyle = computed(() => ({
  opacity: 0.5 + arrowProgress.value * 0.5,
  transform: `translate3d(-50%, ${arrowProgress.value * 18}px, 0)`,
}));

function getCardSize() {
  const baseWidth = Math.min(
    CARD_WIDTH_MAX,
    Math.max(CARD_WIDTH_MIN, window.innerWidth * CARD_WIDTH_VW),
  );
  const width =
    window.innerWidth >= DESKTOP_CARD_MIN_WIDTH
      ? baseWidth * DESKTOP_CARD_WIDTH_MULTIPLIER
      : baseWidth;

  return {
    width,
    height: width * CARD_RATIO,
  };
}

function getCardFlightRects() {
  const printerRect = gachaUi.value?.getPrinterRect();
  const cardSize = getCardSize();
  const centeredX = window.innerWidth / 2 - cardSize.width / 2;
  const fallbackStartY = window.innerHeight * 0.68;
  const printerOutputY = printerRect
    ? printerRect.top + printerRect.height * 0.18
    : fallbackStartY;
  const minStartY = window.innerHeight * PRINT_START_MIN_RATIO;
  const maxStartY =
    window.innerHeight - cardSize.height * PRINT_START_MAX_CARD_OFFSET;
  const visibleStartY = Math.min(
    maxStartY,
    Math.max(minStartY, printerOutputY),
  );

  return {
    cardSize,
    start: {
      x: centeredX,
      y: visibleStartY,
    },
    offscreen: {
      x: centeredX,
      y: window.innerHeight + cardSize.height + 24,
    },
    end: {
      x: centeredX,
      y: window.innerHeight / 2 - cardSize.height / 2,
    },
  };
}

function createCardFlightStyle(geometry, pullOffset = 0) {
  return {
    width: `${geometry.cardSize.width}px`,
    height: `${geometry.cardSize.height}px`,
    "--card-start-x": `${geometry.start.x}px`,
    "--card-start-y": `${geometry.start.y + pullOffset}px`,
    "--card-pull-opacity": arrowProgress.value,
  };
}

const cardPullPreviewStyle = computed(() => {
  if (!isPulling.value || isCardVisible.value) {
    return {};
  }

  return createCardFlightStyle(getCardFlightRects(), pullDistance.value);
});

function resetDraw() {
  drawState.value = "idle";
  pullDistance.value = 0;
  activePointerId.value = null;
  isCardVisible.value = false;
  cardFlightStyle.value = {};
}

function goLobby() {
  router.push("/lobby");
}

function onPrinterPointerDown(event) {
  if (isDrawActive.value || activePointerId.value !== null) {
    return;
  }

  event.currentTarget.setPointerCapture?.(event.pointerId);
  activePointerId.value = event.pointerId;
  pointerStartY.value = event.clientY;
  pullDistance.value = 0;
  isCardVisible.value = false;
  cardFlightStyle.value = {};
  drawState.value = "pulling";
}

function onPrinterPointerMove(event) {
  if (event.pointerId !== activePointerId.value || !isPulling.value) {
    return;
  }

  pullDistance.value = Math.min(
    MAX_PULL,
    Math.max(0, event.clientY - pointerStartY.value),
  );
}

function onPrinterPointerCancel(event) {
  if (event.pointerId !== activePointerId.value) {
    return;
  }

  event.currentTarget.releasePointerCapture?.(event.pointerId);
  activePointerId.value = null;
  drawState.value = "idle";
  pullDistance.value = 0;
  isCardVisible.value = false;
}

function onPrinterPointerUp(event) {
  if (event.pointerId !== activePointerId.value) {
    return;
  }

  event.currentTarget.releasePointerCapture?.(event.pointerId);
  activePointerId.value = null;

  if (pullDistance.value < PULL_THRESHOLD) {
    drawState.value = "idle";
    pullDistance.value = 0;
    isCardVisible.value = false;
    return;
  }

  startDraw();
}

async function startDraw() {
  if (isDrawActive.value) {
    return;
  }

  const geometry = getCardFlightRects();

  drawState.value = "printing";
  isCardVisible.value = true;
  cardFlightStyle.value = {
    ...createCardFlightStyle(geometry, pullDistance.value),
    "--card-offscreen-x": `${geometry.offscreen.x}px`,
    "--card-offscreen-y": `${geometry.offscreen.y}px`,
    "--card-end-x": `${geometry.end.x}px`,
    "--card-end-y": `${geometry.end.y}px`,
    "--card-flight-duration": `${CARD_FLIGHT_DURATION_MS}ms`,
    "--card-pull-opacity": 1,
  };
  await nextTick();

  window.requestAnimationFrame(() => {
    if (drawState.value === "printing") {
      drawState.value = "flying";
    }
  });
}

function onCardFlightEnd() {
  if (drawState.value !== "flying") {
    return;
  }

  drawState.value = "ready-to-reveal";
  pullDistance.value = 0;
}

function revealCard() {
  if (!isReadyToReveal.value) {
    return;
  }

  drawState.value = "revealed";
}

onBeforeUnmount(() => {
  resetDraw();
});
</script>

<template>
  <GachaUi
    ref="gachaUi"
    :background-url="bgGachaUrl"
    :printer-url="gachaPrinterUrl"
    :draw-state="drawState"
    :is-pulling="isPulling"
    :is-ready-to-reveal="isReadyToReveal"
    :is-revealed="isRevealed"
    :is-draw-active="isDrawActive"
    :arrow-guide-style="arrowGuideStyle"
    @go-lobby="goLobby"
    @reset-draw="resetDraw"
    @printer-pointer-down="onPrinterPointerDown"
    @printer-pointer-move="onPrinterPointerMove"
    @printer-pointer-up="onPrinterPointerUp"
    @printer-pointer-cancel="onPrinterPointerCancel"
  >
    <GachaAnimation
      :is-card-visible="isCardVisible"
      :is-pulling="isPulling"
      :is-ready-to-reveal="isReadyToReveal"
      :is-revealed="isRevealed"
      :draw-state="drawState"
      :card-flight-style="cardFlightStyle"
      :card-pull-preview-style="cardPullPreviewStyle"
      :card-back-url="cardBackUrl"
      :card="ceoCard"
      @reveal="revealCard"
      @flight-end="onCardFlightEnd"
    />
  </GachaUi>
</template>
