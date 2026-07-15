<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { X } from "lucide-vue-next";
import bgGachaUrl from "@/assets/images/bg-gacha.webp";
import gachaPrinterUrl from "@/assets/images/gacha-printer.png";
import cardBackUrl from "@/assets/images/card-bg-back.webp";
import GameCard from "@/components/game/ui/GameCard.vue";
import GachaAnimation from "@/components/gacha/GachaAnimation.vue";
import GachaUi from "@/components/gacha/GachaUi.vue";
import CurrencyBar from "@/components/common/CurrencyBar.vue";
import { useAuthStore } from "@/stores/authStore.js";
import { useCurrencyStore } from "@/stores/currencyStore.js";
import { usePlayerStore } from "@/stores/playerStore.js";
import { drawGacha, getOwnedGachaCards } from "@/services/gachaApi.js";
import { cardAssetKeyByRank, cardAssetsByKey } from "@/constants/cardAssets.js";

const PULL_THRESHOLD = 70;
const MAX_PULL = 112;
const CARD_RATIO = 1.45;
const CARD_WIDTH_MIN = 150;
const CARD_WIDTH_MAX = 240;
const CARD_WIDTH_VW = 0.16;
const DESKTOP_CARD_WIDTH_MULTIPLIER = 2;
const DESKTOP_CARD_MIN_WIDTH = 1024;
const CARD_FLIGHT_DURATION_MS = 700;
const AUTO_REVEAL_DELAY_MS = 0;
const PRINT_START_MIN_RATIO = 0.48;
const PRINT_START_MAX_CARD_OFFSET = 0.34;

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const currencyStore = useCurrencyStore();
const playerStore = usePlayerStore();
const gachaUi = ref(null);
const screenMode = ref("select");
const drawState = ref("idle");
const pullDistance = ref(0);
const activePointerId = ref(null);
const pointerStartY = ref(0);
const isCardVisible = ref(false);
const cardFlightStyle = ref({});
const drawResults = ref([]);
const currentDrawIndex = ref(0);
const multiPrintIndex = ref(0);
const multiPrintStopY = ref(0);
const cardFlightKey = ref(0);
const selectedDrawCount = ref(1);
const statusMessage = ref("");
const isOwnedCardsOpen = ref(false);
const ownedCards = ref([]);
const isOwnedCardsLoading = ref(false);
const ownedCardsError = ref("");
let autoRevealTimer = null;
let autoRevealElapsed = false;
let cardFlightFallbackTimer = null;
let pendingDrawRequest = null;
let hasCommittedPull = false;

const isPulling = computed(() => drawState.value === "pulling");
const isReadyToReveal = computed(() => drawState.value === "ready-to-reveal");
const isRevealed = computed(() => drawState.value === "revealed");
const isMultiResults = computed(() => drawState.value === "multi-results");
const isCollecting = computed(
  () => drawState.value === "collecting" || drawState.value === "compensating",
);
const isDrawActive = computed(
  () => !["idle", "pulling"].includes(drawState.value),
);
const hasMultipleResults = computed(() => drawResults.value.length > 1);
const hasNextDrawResult = computed(
  () => currentDrawIndex.value < drawResults.value.length - 1,
);
const drawResultLabel = computed(() => {
  if (!hasMultipleResults.value) {
    return "";
  }

  return `${currentDrawIndex.value + 1} / ${drawResults.value.length}`;
});

function resolveGachaCardAsset(card) {
  const fallbackKey = cardAssetKeyByRank[card?.rank] ?? "ceo";
  const backgroundAsset = cardAssetsByKey[card?.imageKey] ?? cardAssetsByKey[fallbackKey];
  const frameAsset = cardAssetsByKey[card?.frameKey] ?? backgroundAsset;

  return {
    ...backgroundAsset,
    ...card,
    name: card?.name ?? backgroundAsset.name,
    backgroundUrl: card?.imageUrl ?? backgroundAsset.backgroundUrl,
    frameUrl: card?.frameUrl ?? frameAsset.frameUrl,
  };
}

const currentCard = computed(() => {
  const resultCard = drawResults.value[currentDrawIndex.value]?.card;
  return resultCard ? resolveGachaCardAsset(resultCard) : null;
});
const currentDrawResult = computed(() => drawResults.value[currentDrawIndex.value] ?? null);
const currentCompensationCoins = computed(
  () => currentDrawResult.value?.compensationCoins ?? 0,
);
const ownedCardViews = computed(() =>
  ownedCards.value.map(resolveGachaCardAsset),
);
const drawResultViews = computed(() =>
  drawResults.value.map((result) => ({
    ...resolveGachaCardAsset(result.card),
    isDuplicate: result.isDuplicate,
    compensationCoins: result.compensationCoins ?? 0,
  })),
);
const arrowProgress = computed(() =>
  Math.min(1, pullDistance.value / PULL_THRESHOLD),
);
const arrowGuideStyle = computed(() => ({
  opacity: 0.5 + arrowProgress.value * 0.5,
  transform: `translate3d(-50%, ${arrowProgress.value * 18}px, 0)`,
}));
const isAnimationMode = computed(() => screenMode.value === "animation");

function getStoredGuestPlayer() {
  try {
    return JSON.parse(localStorage.getItem("guestPlayer") || "null");
  } catch {
    return null;
  }
}

const currentPlayerId = computed(() => {
  const routePlayerId = Number(route.query.playerId);

  if (Number.isInteger(routePlayerId) && routePlayerId > 0) {
    return routePlayerId;
  }

  const storedGuestPlayer = getStoredGuestPlayer();

  return (
    authStore.currentPlayer?.id ??
    playerStore.currentPlayerId ??
    storedGuestPlayer?.id ??
    null
  );
});

function syncCurrency(currency) {
  if (!currency) {
    return;
  }

  currencyStore.coins = currency.coins ?? currencyStore.coins;
  currencyStore.gems = currency.gems ?? currencyStore.gems;
  currencyStore.tickets = currency.tickets ?? currencyStore.tickets;
}

function mergeOwnedCardsFromDrawResults(results) {
  const existingIds = new Set(ownedCards.value.map((card) => card.id));
  const newCards = results
    .filter((result) => !result.isDuplicate && !existingIds.has(result.card?.id))
    .map((result) => result.card);

  ownedCards.value = [...ownedCards.value, ...newCards];
}

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
    ? printerRect.top + printerRect.height * 0.14
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

function getMultiPrintRects(cardSize) {
  const printerRect = gachaUi.value?.getPrinterRect();
  const centeredX = window.innerWidth / 2 - cardSize.width / 2;
  const startY = printerRect
    ? printerRect.top + printerRect.height * 0.04
    : window.innerHeight * 0.48;

  return {
    start: {
      x: centeredX,
      y: startY,
    },
    end: {
      x: centeredX,
      y: startY + 96,
    },
  };
}

function createCardFlightStyle(geometry, pullOffset = 0) {
  const previewScale = 0.36;
  const visibleBottomPadding = 16;
  const startY = getVisibleCardStartY(geometry, pullOffset);

  return {
    width: `${geometry.cardSize.width}px`,
    height: `${geometry.cardSize.height}px`,
    "--card-start-x": `${geometry.start.x}px`,
    "--card-start-y": `${startY}px`,
    "--card-preview-scale": `${previewScale}`,
    "--card-reveal-percent": `${Math.max(8, arrowProgress.value * 100)}%`,
    "--card-pull-opacity": arrowProgress.value,
  };
}

function getVisibleCardStartY(geometry, pullOffset = 0) {
  const previewScale = 0.36;
  const visibleBottomPadding = 16;

  return Math.min(
    geometry.start.y + pullOffset,
    window.innerHeight - geometry.cardSize.height * previewScale - visibleBottomPadding,
  );
}

function getCollectTarget() {
  return {
    x: window.innerWidth - 86,
    y: window.innerHeight - 92,
  };
}

const cardPullPreviewStyle = computed(() => {
  if (!isPulling.value || isCardVisible.value) {
    return {};
  }

  return createCardFlightStyle(getCardFlightRects(), pullDistance.value);
});

const isQueuedPrintCardVisible = computed(
  () =>
    selectedDrawCount.value > 1 &&
    isAnimationMode.value &&
    !isMultiResults.value &&
    ["printing", "flying", "waiting-result"].includes(drawState.value),
);

const queuedPrintCardStyle = computed(() => {
  if (!isQueuedPrintCardVisible.value) {
    return {};
  }

  const geometry = getCardFlightRects();
  const multiPrint = getMultiPrintRects(geometry.cardSize);
  const stopY = multiPrintStopY.value || multiPrint.end.y;

  return {
    ...createCardFlightStyle(geometry, 0),
    "--card-start-x": `${multiPrint.start.x}px`,
    "--card-start-y": `${stopY}px`,
    "--card-pull-opacity": 0.92,
  };
});

function clearAutoRevealTimer() {
  if (!autoRevealTimer) {
    autoRevealElapsed = false;
    return;
  }

  window.clearTimeout(autoRevealTimer);
  autoRevealTimer = null;
  autoRevealElapsed = false;
}

function clearCardFlightFallbackTimer() {
  if (!cardFlightFallbackTimer) {
    return;
  }

  window.clearTimeout(cardFlightFallbackTimer);
  cardFlightFallbackTimer = null;
}

function startDrawRequest(count = selectedDrawCount.value) {
  if (pendingDrawRequest) {
    return;
  }

  pendingDrawRequest = drawGacha({
    playerId: currentPlayerId.value,
    count,
  }).then(
    (result) => ({ result }),
    (error) => ({ error }),
  );
}

async function consumeDrawRequest(count = selectedDrawCount.value) {
  startDrawRequest(count);

  const response = await pendingDrawRequest;
  pendingDrawRequest = null;

  if (response.error) {
    throw response.error;
  }

  return response.result;
}

function scheduleAutoReveal() {
  clearAutoRevealTimer();

  autoRevealTimer = window.setTimeout(() => {
    autoRevealTimer = null;
    if (isReadyToReveal.value) {
      revealCard();
      return;
    }

    if (drawState.value === "waiting-result") {
      autoRevealElapsed = true;
    }
  }, AUTO_REVEAL_DELAY_MS);
}

function resetDraw() {
  clearAutoRevealTimer();
  clearCardFlightFallbackTimer();
  pendingDrawRequest = null;
  hasCommittedPull = false;
  isOwnedCardsOpen.value = false;
  screenMode.value = "select";
  drawState.value = "idle";
  pullDistance.value = 0;
  activePointerId.value = null;
  isCardVisible.value = false;
  cardFlightStyle.value = {};
  drawResults.value = [];
  currentDrawIndex.value = 0;
  multiPrintIndex.value = 0;
  multiPrintStopY.value = 0;
  cardFlightKey.value = 0;
  statusMessage.value = "";
}

function goLobby() {
  router.push("/lobby");
}

async function fetchOwnedCards() {
  if (!currentPlayerId.value) {
    ownedCards.value = [];
    ownedCardsError.value = "找不到玩家資料";
    return;
  }

  isOwnedCardsLoading.value = true;
  ownedCardsError.value = "";

  try {
    const result = await getOwnedGachaCards({
      playerId: currentPlayerId.value,
    });

    ownedCards.value = result.cards ?? [];
  } catch (error) {
    ownedCardsError.value = error.message || "卡牌讀取失敗";
  } finally {
    isOwnedCardsLoading.value = false;
  }
}

function closeOwnedCardsModal() {
  isOwnedCardsOpen.value = false;
}

function openOwnedCardsModal() {
  isOwnedCardsOpen.value = true;
  fetchOwnedCards();
}

function toggleOwnedCardsPanel() {
  if (isOwnedCardsOpen.value) {
    closeOwnedCardsModal();
    return;
  }

  openOwnedCardsModal();
}

function onPrinterPointerDown(event) {
  if (!isAnimationMode.value) {
    return;
  }

  if (isDrawActive.value || activePointerId.value !== null) {
    return;
  }

  event.currentTarget.setPointerCapture?.(event.pointerId);
  activePointerId.value = event.pointerId;
  pointerStartY.value = event.clientY;
  pullDistance.value = 0;
  hasCommittedPull = false;
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

  if (pullDistance.value >= PULL_THRESHOLD) {
    hasCommittedPull = true;
    startDrawRequest(selectedDrawCount.value);
  }
}

function onPrinterPointerCancel(event) {
  if (event.pointerId !== activePointerId.value) {
    return;
  }

  event.currentTarget.releasePointerCapture?.(event.pointerId);
  activePointerId.value = null;

  if (hasCommittedPull) {
    performDraw(selectedDrawCount.value, pullDistance.value);
    return;
  }

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

  if (pullDistance.value < PULL_THRESHOLD && !hasCommittedPull) {
    drawState.value = "idle";
    pullDistance.value = 0;
    isCardVisible.value = false;
    return;
  }

  performDraw(selectedDrawCount.value, pullDistance.value);
}

async function startDraw(count = selectedDrawCount.value) {
  if (isAnimationMode.value) {
    return;
  }

  if (!currentPlayerId.value) {
    statusMessage.value = "找不到玩家資料，請回大廳重新進入";
    drawState.value = "idle";
    pullDistance.value = 0;
    screenMode.value = "select";
    return;
  }

  selectedDrawCount.value = count;
  statusMessage.value = "";
  screenMode.value = "animation";
  drawState.value = "idle";
  pullDistance.value = 0;
  isCardVisible.value = false;
  cardFlightStyle.value = {};
  await nextTick();
}

function playCurrentCardFlight(pullOffset = 0) {
  const geometry = getCardFlightRects();
  const isMultiPrint = selectedDrawCount.value > 1;
  const multiPrint = getMultiPrintRects(geometry.cardSize);
  const flightDuration = isMultiPrint ? 240 : CARD_FLIGHT_DURATION_MS;
  const multiPrintTargetY = multiPrintStopY.value || multiPrint.end.y;

  clearCardFlightFallbackTimer();
  cardFlightKey.value += 1;
  drawState.value = "printing";
  isCardVisible.value = true;
  cardFlightStyle.value = {
    ...createCardFlightStyle(geometry, isMultiPrint ? 0 : pullOffset),
    ...(isMultiPrint
      ? {
          "--card-start-x": `${multiPrint.start.x}px`,
          "--card-start-y": `${multiPrint.start.y}px`,
        }
      : {}),
    "--card-offscreen-x": `${geometry.offscreen.x}px`,
    "--card-offscreen-y": `${geometry.offscreen.y}px`,
    "--card-end-x": `${isMultiPrint ? multiPrint.end.x : geometry.end.x}px`,
    "--card-end-y": `${isMultiPrint ? multiPrintTargetY : geometry.end.y}px`,
    "--card-flight-animation": isMultiPrint ? "gacha-card-pop" : "gacha-card-flight",
    "--card-flight-duration": `${flightDuration}ms`,
    "--card-pull-opacity": 1,
  };

  nextTick(() => {
    window.requestAnimationFrame(() => {
      if (drawState.value === "printing") {
        drawState.value = "flying";
        cardFlightFallbackTimer = window.setTimeout(() => {
          cardFlightFallbackTimer = null;
          onCardFlightEnd();
        }, flightDuration + 80);
      }
    });
  });
}

function collectCurrentCard() {
  const geometry = getCardFlightRects();
  const collectTarget = getCollectTarget();

  cardFlightStyle.value = {
    ...cardFlightStyle.value,
    "--card-end-x": `${geometry.end.x}px`,
    "--card-end-y": `${geometry.end.y}px`,
    "--card-collect-x": `${collectTarget.x}px`,
    "--card-collect-y": `${collectTarget.y}px`,
  };
  drawState.value = currentDrawResult.value?.isDuplicate
    ? "compensating"
    : "collecting";
}

async function performDraw(count = selectedDrawCount.value, pullOffset = 0) {
  if (isDrawActive.value && !isPulling.value) {
    return;
  }

  activePointerId.value = "draw-request";

  if (count === 1) {
    playCurrentCardFlight(pullOffset);
  } else {
    multiPrintIndex.value = 0;
    multiPrintStopY.value = getVisibleCardStartY(
      getCardFlightRects(),
      Math.min(MAX_PULL, Math.max(PULL_THRESHOLD, pullOffset)),
    );
    playCurrentCardFlight(0);
  }

  let result;
  try {
    result = await consumeDrawRequest(count);
  } catch (error) {
    statusMessage.value = error.message || "抽卡失敗";
    drawState.value = "idle";
    pullDistance.value = 0;
    activePointerId.value = null;
    isCardVisible.value = false;
    screenMode.value = "select";
    return;
  }

  drawResults.value = result.results ?? [];
  mergeOwnedCardsFromDrawResults(drawResults.value);
  currentDrawIndex.value = 0;
  syncCurrency(result.currency);
  activePointerId.value = null;

  if (count > 1) {
    if (drawState.value === "waiting-result") {
      drawState.value = "multi-results";
      isCardVisible.value = false;
    }
    return;
  }

  if (drawState.value === "waiting-result") {
    drawState.value = "ready-to-reveal";

    if (autoRevealElapsed) {
      revealCard();
    }
  }
}
function onCardFlightEnd() {
  clearCardFlightFallbackTimer();

  if (isCollecting.value) {
    finishCurrentDrawResult();
    return;
  }

  if (drawState.value !== "flying") {
    return;
  }

  pullDistance.value = 0;

  if (selectedDrawCount.value > 1) {
    if (multiPrintIndex.value < selectedDrawCount.value - 1) {
      multiPrintIndex.value += 1;
      isCardVisible.value = false;
      playCurrentCardFlight(0);
      return;
    }

    if (drawResults.value.length) {
      drawState.value = "multi-results";
      isCardVisible.value = false;
      return;
    }

    isCardVisible.value = true;
    drawState.value = "waiting-result";
    return;
  }

  drawState.value = drawResults.value.length ? "ready-to-reveal" : "waiting-result";
  scheduleAutoReveal();
}

function finishCurrentDrawResult() {
  if (hasNextDrawResult.value) {
    showNextDrawResult();
    return;
  }

  resetDraw();
}

function revealCard() {
  if (!isReadyToReveal.value) {
    return;
  }

  clearAutoRevealTimer();
  drawState.value = "revealed";
}

function showNextDrawResult() {
  if (!hasNextDrawResult.value) {
    drawState.value = "multi-results";
    isCardVisible.value = false;
    return;
  }

  currentDrawIndex.value += 1;
  isCardVisible.value = false;
  playCurrentCardFlight();
}

function handleAnimationScreenClick() {
  if (isMultiResults.value) {
    resetDraw();
    return;
  }

  if (isReadyToReveal.value) {
    revealCard();
    return;
  }

  if (!isRevealed.value) {
    return;
  }

  collectCurrentCard();
}

onBeforeUnmount(() => {
  resetDraw();
});

watch(
  currentPlayerId,
  (playerId) => {
    if (!playerId) {
      return;
    }

    currencyStore.fetchPlayerCurrency(playerId).catch(() => {});
  },
  { immediate: true },
);
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
    :show-guide="isAnimationMode"
    :show-actions="false"
    @go-lobby="goLobby"
    @reset-draw="resetDraw"
    @printer-pointer-down="onPrinterPointerDown"
    @printer-pointer-move="onPrinterPointerMove"
    @printer-pointer-up="onPrinterPointerUp"
    @printer-pointer-cancel="onPrinterPointerCancel"
    @stage-click="isAnimationMode && handleAnimationScreenClick()"
  >
    <CurrencyBar
      v-if="!isAnimationMode"
      class="fixed right-20 top-5 z-40 origin-top-right"
      :items="['tickets']"
      tooltip-size="small"
    />

    <button
      v-if="!isAnimationMode"
      type="button"
      class="fixed right-5 top-5 z-50 grid size-8 place-items-center border border-white/60 bg-white/10 text-white backdrop-blur-[2px] transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-[4px] focus-visible:ring-[var(--brand-focus)]"
      aria-label="返回大廳"
      @click.stop="goLobby"
    >
      <X class="size-4" :stroke-width="2.5" aria-hidden="true" />
    </button>

    <section
      v-if="!isAnimationMode"
      class="pointer-events-none fixed inset-x-0 bottom-[clamp(10px,3vh,36px)] z-40 grid justify-items-center px-4 text-center"
    >
      <div class="pointer-events-auto grid justify-items-center gap-5">
        <div class="flex flex-wrap justify-center gap-6">
          <button
            type="button"
            class="gacha-button border btn-glass min-h-10 min-w-28 px-5 py-2 text-xs font-black"
            @click.stop="startDraw(1)"
          >
            單抽
          </button>
          <button
            type="button"
            class="gacha-button border btn-glass min-h-10 min-w-28 px-5 py-2 text-xs font-black"
            @click.stop="startDraw(10)"
          >
            十抽
          </button>
        </div>

        <p
          v-if="statusMessage"
          class="bg-slate-950/80 px-4 py-2 text-sm font-bold text-white"
        >
          {{ statusMessage }}
        </p>
      </div>
    </section>

    <section
      v-if="!isAnimationMode && isOwnedCardsOpen"
      class="fixed inset-0 z-[70] grid place-items-center bg-slate-950/60 px-4 py-8 text-white backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="owned-cards-title"
      @click.self="closeOwnedCardsModal"
    >
      <div class="flex max-h-[82vh] w-[min(92vw,760px)] flex-col border border-white/60 bg-slate-950/88 p-4 shadow-[0_24px_70px_rgba(0,19,50,0.5)]">
        <div class="mb-3 flex items-center justify-between gap-3">
          <h2 id="owned-cards-title" class="m-0 text-base font-black tracking-normal">
            我的卡牌
          </h2>
          <button
            type="button"
            class="grid size-8 place-items-center border border-white/50 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-[4px] focus-visible:ring-[var(--brand-focus)]"
            aria-label="關閉我的卡牌"
            @click.stop="closeOwnedCardsModal"
          >
            <X class="size-4" :stroke-width="2.5" aria-hidden="true" />
          </button>
        </div>

        <div
          v-if="isOwnedCardsLoading"
          class="grid min-h-48 place-items-center border border-white/20 bg-white/8 text-sm font-black text-white/75"
        >
          讀取中...
        </div>

        <div
          v-else-if="ownedCardsError"
          class="grid min-h-48 place-items-center border border-white/20 bg-white/8 px-4 text-center text-sm font-black text-white/75"
        >
          {{ ownedCardsError }}
        </div>

        <div
          v-else-if="!ownedCardViews.length"
          class="grid min-h-48 place-items-center border border-dashed border-white/30 bg-white/8 px-4 text-center text-sm font-black text-white/65"
        >
          目前還沒有卡牌
        </div>

        <div
          v-else
          class="grid max-h-[66vh] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4 md:grid-cols-5"
        >
          <div
            v-for="card in ownedCardViews"
            :key="card.id"
            class="grid gap-1"
          >
            <div class="aspect-[3/4] w-full">
              <GameCard
                :name="card.name"
                :background-url="card.backgroundUrl"
                :frame-url="card.frameUrl"
              />
            </div>
            <div class="min-h-7 text-center text-[10px] font-black leading-tight text-white/85 sm:text-xs">
              {{ card.name }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <button
      v-if="!isAnimationMode"
      type="button"
      class="fixed bottom-5 right-5 z-50 grid w-[72px] gap-1 border-0 bg-transparent p-0 text-white focus-visible:outline-none focus-visible:ring-[4px] focus-visible:ring-[var(--brand-focus)]"
      :aria-expanded="isOwnedCardsOpen"
      aria-label="我的卡牌"
      @click.stop="toggleOwnedCardsPanel"
    >
      <span class="relative mx-auto block aspect-[3/4] w-14 overflow-hidden border border-white/70 bg-slate-900 shadow-[0_12px_28px_rgba(0,19,50,0.36)] transition hover:-translate-y-1">
        <img
          :src="cardBackUrl"
          alt=""
          aria-hidden="true"
          class="block size-full object-cover"
          draggable="false"
        />
      </span>
      <span class="text-center text-[11px] font-black tracking-normal text-white drop-shadow-[0_2px_5px_rgba(0,19,50,0.8)]">
        我的卡牌
      </span>
    </button>

    <button
      v-if="isAnimationMode && !isDrawActive"
      type="button"
      class="fixed bottom-2 left-1/2 z-50 min-h-8 min-w-20 -translate-x-1/2 border btn-glass px-3 py-1.5 text-xs font-black"
      @click.stop="resetDraw"
    >
      返回
    </button>

    <GachaAnimation
      v-if="isAnimationMode"
      :is-card-visible="isCardVisible"
      :is-pulling="isPulling"
      :is-ready-to-reveal="isReadyToReveal"
      :is-revealed="isRevealed"
      :is-collecting="isCollecting"
      :show-queued-card="isQueuedPrintCardVisible"
      :draw-state="drawState"
      :card-flight-key="cardFlightKey"
      :card-flight-style="cardFlightStyle"
      :queued-card-style="queuedPrintCardStyle"
      :card-pull-preview-style="cardPullPreviewStyle"
      :card-back-url="cardBackUrl"
      :card="currentCard"
      :compensation-coins="currentCompensationCoins"
      @reveal="revealCard"
      @flight-end="onCardFlightEnd"
    />

    <section
      v-if="isAnimationMode && isMultiResults"
      class="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 px-4 py-8 text-white"
    >
      <div
        class="grid w-[min(84vw,760px)] grid-cols-5 gap-2 sm:gap-3 lg:w-[min(94vw,920px)] lg:gap-4"
        @click.stop
      >
        <div
          v-for="(card, index) in drawResultViews"
          :key="`${card.id}-${card.name}`"
          class="multi-result-card relative aspect-[3/4]"
          :style="{ '--deal-index': index }"
        >
          <div class="multi-result-card-inner absolute inset-0">
            <img
              :src="cardBackUrl"
              alt=""
              aria-hidden="true"
              class="multi-result-card-face absolute inset-0 size-full object-cover"
              draggable="false"
            />
            <GameCard
              class="multi-result-card-face multi-result-card-front absolute inset-0"
              :name="card.name"
              :background-url="card.backgroundUrl"
              :frame-url="card.frameUrl"
            />
            <div
              v-if="card.isDuplicate"
              class="multi-result-card-face multi-result-card-front multi-result-card-bonus absolute inset-x-1 bottom-1 bg-slate-950/85 px-1 py-1 text-center text-[10px] font-black text-amber-200"
            >
              +{{ card.compensationCoins }} 金幣
            </div>
          </div>
        </div>
      </div>
    </section>

    <div
      v-if="isAnimationMode && isRevealed && hasMultipleResults"
      class="pointer-events-none fixed left-1/2 top-6 z-40 flex -translate-x-1/2 items-center gap-3 bg-slate-950/80 px-4 py-2 text-sm font-bold text-white"
    >
      <span>{{ drawResultLabel }}</span>
    </div>
  </GachaUi>
</template>

<style scoped>
.multi-result-card {
  opacity: 0;
  perspective: 900px;
  transform: translate3d(0, -52px, 0) scale(0.72);
  animation: multi-result-deal 220ms ease-out forwards;
  animation-delay: calc(var(--deal-index) * 80ms);
}

.multi-result-card-inner {
  transform-style: preserve-3d;
  animation: multi-result-flip 1400ms ease-out forwards;
  animation-delay: calc(var(--deal-index) * 80ms + 160ms);
}

.multi-result-card-face {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.multi-result-card-front {
  transform: rotateY(180deg);
}

.multi-result-card-bonus {
  opacity: 0;
  animation: multi-result-bonus 180ms ease-out forwards;
  animation-delay: calc(var(--deal-index) * 80ms + 760ms);
}

@keyframes multi-result-deal {
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@keyframes multi-result-flip {
  to {
    transform: rotateY(180deg);
  }
}

@keyframes multi-result-bonus {
  to {
    opacity: 1;
  }
}
</style>
