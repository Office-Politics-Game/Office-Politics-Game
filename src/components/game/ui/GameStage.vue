<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import gameTableBackgroundUrl from "@/assets/images/bg-game-table.webp";
import gameLogoUrl from "@/assets/images/logo-en-white.png";
import { useAudioSettings } from "@/composables/UseAudioSettings";
import { useGameAnimationRects } from "@/composables/useGameAnimationRects";
import CardDrawAnimation from "../animations/CardDrawAnimation.vue";
import CardGuessSelector from "./CardGuessSelector.vue";
import CardPlayAnimation from "../animations/CardPlayAnimation.vue";
import CardShuffleAnimation from "../animations/CardShuffleAnimation.vue";
import CardSwapAnimation from "../animations/CardSwapAnimation.vue";
import CleanerAnimation from "../animations/CleanerAnimation.vue";
import FlyInTextModal from "../animations/FlyInTextModal.vue";
import GameCard from "./GameCard.vue";
import GameSettingsIcon from "./GameSettingsIcon.vue";
import GameSettingsModal from "./GameSettingsModal.vue";
import InternAnimation from "../animations/InternAnimation.vue";
import ManagerAnimation from "../animations/ManagerAnimation.vue";
import PMAnimation from "../animations/PMAnimation.vue";
import PlayerHand from "./PlayerHand.vue";
import PlayerSeats from "./PlayerSeats.vue";
import ProtectionAura from "../animations/ProtectionAura.vue";
import RotateDeviceNotice from "./RotateDeviceNotice.vue";
import TableCardPiles from "./TableCardPiles.vue";
import TurnStatus from "./TurnStatus.vue";

const props = defineProps({
  roundNumber: {
    type: [Number, String],
    required: true,
  },
  currentPhase: {
    type: String,
    required: true,
  },
  currentStep: {
    type: String,
    required: true,
  },
  deckCount: {
    type: [Number, String],
    required: true,
  },
  discardCards: {
    type: Array,
    default: () => [],
  },
  players: {
    type: Array,
    required: true,
  },
  playerHandCardCounts: {
    type: Object,
    default: () => ({}),
  },
  handCards: {
    type: Array,
    required: true,
    validator: (cards) =>
      cards.every(
        (card) =>
          typeof card?.id === "string" &&
          typeof card?.name === "string" &&
          typeof card?.backgroundUrl === "string" &&
          typeof card?.frameUrl === "string",
      ),
  },
  canDraw: {
    type: Boolean,
    default: false,
  },
  drawPlayerId: {
    type: String,
    default: null,
  },
  currentPlayerId: {
    type: String,
    default: null,
  },
  currentTurnPlayerId: {
    type: [Number, String],
    default: null,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "return-lobby",
  "restart-game",
  "draw-request",
  "play-card",
]);
const isSettingsOpen = ref(false);
const isDrawAnimating = ref(false);
const activeDrawCard = ref(null);
const tableCardPilesRef = ref(null);
const playerSeats = ref(null);
const playerHand = ref(null);
const cardDrawAnimation = ref(null);
const cardPlayAnimation = ref(null);
const cardShuffleAnimation = ref(null);
const activeEffectResult = ref(null);
const activeCard = ref(null);
const originRect = ref(null);
const dragPoint = ref(null);
const playZoneRect = ref(null);
const discardRect = ref(null);
const draggingCardId = ref(null);
const isDragging = ref(false);
const isOverPlayZone = ref(false);
const isTurnNoticeOpen = ref(false);
const isRoundStartNoticeOpen = ref(false);
const isRoundWinnerNoticeOpen = ref(false);
const roundWinnerNotice = ref(null);
const isPlayerEliminatedNoticeOpen = ref(false);
const playerEliminatedNotice = ref(null);
const isInitialRoundDrawAnimating = ref(false);
const initialRoundDealtPlayerIds = ref([]);
const lastInitialRoundDealSignature = ref(null);
const lastRoundStartNoticeKey = ref(null);
const locallyHiddenPlayedCardIds = ref([]);
const pendingPlay = ref(null);
const selectedTargetPlayerId = ref(null);
const selectedGuessRank = ref(null);
let roundStartNoticeResolve = null;
let effectAnimationResolve = null;
let effectAnimationTimeout = null;
let effectAnimationSequence = 0;
let pointerMoveHandler = null;
let pointerUpHandler = null;
const hiddenPlayedCardTimers = new Map();
const resolvedCurrentPlayerId = computed(
  () =>
    props.currentPlayerId ??
    props.players.find((player) => player.isCurrentPlayer)?.id ??
    null,
);
const animationRects = useGameAnimationRects({
  playerHand,
  playerSeats,
  tableCardPiles: tableCardPilesRef,
  currentPlayerId: resolvedCurrentPlayerId,
});

const guessOptions = [
  { rank: 2, name: "打掃阿姨" },
  { rank: 3, name: "部門主管" },
  { rank: 4, name: "職場老鳥" },
  { rank: 5, name: "專案經理" },
  { rank: 6, name: "人資主管" },
  { rank: 7, name: "資深顧問" },
  { rank: 8, name: "執行長" },
];

const {
  musicEnabled,
  musicVolume,
  soundEnabled,
  soundVolume,
  setMusicEnabled,
  setMusicVolume,
  setSoundEnabled,
  setSoundVolume,
} = useAudioSettings();

const hasActivePlay = computed(() =>
  Boolean(activeCard.value && originRect.value),
);
const roundStartNoticeText = computed(() => `第 ${props.roundNumber} 回合開始`);
const isCurrentPlayerTurn = computed(() => {
  if (!props.currentTurnPlayerId || !resolvedCurrentPlayerId.value) {
    return true;
  }

  return (
    String(props.currentTurnPlayerId) === String(resolvedCurrentPlayerId.value)
  );
});
const isExplicitCurrentPlayerTurn = computed(
  () =>
    Boolean(props.currentTurnPlayerId && resolvedCurrentPlayerId.value) &&
    String(props.currentTurnPlayerId) === String(resolvedCurrentPlayerId.value),
);
const pendingTargetMode = computed(
  () => pendingPlay.value?.card.targetMode ?? "none",
);
const pendingRequiresTarget = computed(
  () =>
    pendingTargetMode.value === "opponent" ||
    pendingTargetMode.value === "anyPlayer",
);
const pendingRequiresGuess = computed(() =>
  Boolean(pendingPlay.value?.card.requiresGuess),
);
const selectableTargetPlayerIds = computed(() => {
  if (!pendingRequiresTarget.value) {
    return [];
  }

  return props.players
    .filter((player) => {
      if (pendingTargetMode.value === "opponent") {
        return !player.isCurrentPlayer;
      }

      return true;
    })
    .map((player) => player.id);
});
const initialRoundDealtPlayerIdSet = computed(
  () => new Set(initialRoundDealtPlayerIds.value),
);
const resolvedPlayerHandCardCounts = computed(() => {
  if (!isInitialRoundDrawAnimating.value) {
    return props.playerHandCardCounts;
  }

  return Object.fromEntries(
    props.players.map((player) => [
      player.id,
      initialRoundDealtPlayerIdSet.value.has(player.id)
        ? Number(props.playerHandCardCounts[player.id] ?? 0)
        : 0,
    ]),
  );
});
const visibleHandCards = computed(() => {
  if (
    isInitialRoundDrawAnimating.value &&
    resolvedCurrentPlayerId.value &&
    !initialRoundDealtPlayerIdSet.value.has(
      String(resolvedCurrentPlayerId.value),
    )
  ) {
    return [];
  }

  const pendingCardId = pendingPlay.value?.card?.id;
  const hiddenCardIds = new Set(locallyHiddenPlayedCardIds.value);
  const cards = pendingCardId
    ? props.handCards.filter((card) => card.id !== pendingCardId)
    : props.handCards;

  return cards.filter((card) => !hiddenCardIds.has(card.id));
});
const advisorRuleDisabledCardIds = computed(() => {
  const hasAdvisor = visibleHandCards.value.some(isAdvisorCard);
  const hasPmOrHr = visibleHandCards.value.some(isPmOrHrCard);

  if (!hasAdvisor || !hasPmOrHr) {
    return [];
  }

  return visibleHandCards.value
    .filter((card) => !isAdvisorCard(card))
    .map((card) => card.id);
});
const visibleDiscardCards = computed(() => {
  const pendingCard = pendingPlay.value?.card;

  if (
    !pendingCard ||
    props.discardCards.some((card) => card.id === pendingCard.id)
  ) {
    return props.discardCards;
  }

  return [...props.discardCards, pendingCard];
});
const selectedTargetPlayer = computed(
  () =>
    props.players.find(
      (player) => player.id === selectedTargetPlayerId.value,
    ) ?? null,
);
const selectedGuessOption = computed(
  () =>
    guessOptions.find((option) => option.rank === selectedGuessRank.value) ??
    null,
);
const protectedPlayers = computed(() =>
  props.players.filter((player) => player.isProtected),
);
const activeProtectionAnimationPlayer = computed(() => {
  if (activeEffectResult.value?.type !== "protection") {
    return null;
  }

  return (
    props.players.find(
      (player) =>
        String(player.id) === String(activeEffectResult.value.targetPlayerId),
    ) ?? null
  );
});
const canConfirmPendingPlay = computed(() => {
  if (!pendingPlay.value) {
    return false;
  }

  if (pendingRequiresTarget.value && !selectedTargetPlayerId.value) {
    return false;
  }

  if (pendingRequiresGuess.value && !selectedGuessRank.value) {
    return false;
  }

  return true;
});
const isHandDrawRequired = computed(() => props.canDraw);
const isPlayInteractionLocked = computed(
  () =>
    props.isLoading ||
    isInitialRoundDrawAnimating.value ||
    !isCurrentPlayerTurn.value ||
    Boolean(activeCard.value) ||
    Boolean(pendingPlay.value) ||
    isDrawAnimating.value ||
    Boolean(activeEffectResult.value),
);
const isHandPlayInteractionLocked = computed(
  () => isPlayInteractionLocked.value || isHandDrawRequired.value,
);
const isDeckDrawDisabled = computed(
  () => isPlayInteractionLocked.value || !props.canDraw,
);
const handDisabledMessage = computed(() =>
  isHandDrawRequired.value ? "請先抽下一張牌" : "",
);
const deckBlockedMessage = computed(() =>
  !isCurrentPlayerTurn.value ? "還沒輪到你" : "",
);
const dragPreviewStyle = computed(() => {
  if (
    !hasActivePlay.value ||
    !originRect.value ||
    !dragPoint.value ||
    !isDragging.value
  ) {
    return { display: "none" };
  }

  const translateX =
    dragPoint.value.x - (originRect.value.left + originRect.value.width / 2);
  const translateY =
    dragPoint.value.y - (originRect.value.top + originRect.value.height / 2);

  return {
    ...animationRects.rectToFixedStyle(originRect.value),
    transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${isOverPlayZone.value ? 1.06 : 1})`,
  };
});

function getCardName(card) {
  return String(card?.name ?? "")
    .trim()
    .toLowerCase();
}

function getCardRank(card) {
  return Number(card?.rank ?? card?.cardRank ?? card?.value);
}

function isAdvisorCard(card) {
  return (
    getCardRank(card) === 7 ||
    ["advisor", "adviser"].includes(getCardName(card))
  );
}

function isPmOrHrCard(card) {
  const cardName = getCardName(card);

  return (
    getCardRank(card) === 5 ||
    getCardRank(card) === 6 ||
    cardName === "pm" ||
    cardName === "hr"
  );
}

function isSelfDraw(playerId) {
  return !playerId || animationRects.isSelfPlayer(playerId);
}

function getInitialRoundDealSignature() {
  if (
    props.players.length === 0 ||
    props.discardCards.length > 0 ||
    props.handCards.length !== 1
  ) {
    return null;
  }

  const handCounts = props.players.map((player) =>
    Number(props.playerHandCardCounts[player.id] ?? 0),
  );

  if (handCounts.some((count) => count !== 1)) {
    return null;
  }

  return props.players
    .map(
      (player) =>
        `${player.id}:${player.roundWins}:${props.playerHandCardCounts[player.id]}`,
    )
    .join("|");
}

function getRoundStartNoticeKey(signature) {
  return signature ? `${props.roundNumber}:${signature}` : null;
}

function getInitialRoundDealCard(playerId) {
  return animationRects.isSelfPlayer(playerId) ? props.handCards[0] : null;
}

async function playInitialRoundDrawSequence(signature) {
  if (!signature || isInitialRoundDrawAnimating.value) {
    return;
  }

  isInitialRoundDrawAnimating.value = true;
  initialRoundDealtPlayerIds.value = [];
  await nextTick();

  try {
    const deckPose = tableCardPilesRef.value?.getDeckAnimationPose?.();

    if (deckPose) {
      await cardShuffleAnimation.value?.play({
        deckPose,
        deckCount: Number(props.deckCount) || 0,
      });
    }

    for (const player of props.players) {
      const didDraw = await playDrawAnimation(
        getInitialRoundDealCard(player.id),
        player.id,
      );

      initialRoundDealtPlayerIds.value = [
        ...new Set([...initialRoundDealtPlayerIds.value, player.id]),
      ];

      if (!didDraw) {
        await nextTick();
      }
    }
  } finally {
    initialRoundDealtPlayerIds.value = props.players.map((player) => player.id);
    isInitialRoundDrawAnimating.value = false;

    await playRoundStartNotice(signature);

    if (isExplicitCurrentPlayerTurn.value) {
      playTurnNotice({ force: true });
    }
  }
}

function requestDraw() {
  if (isPlayInteractionLocked.value || !props.canDraw) {
    return;
  }

  emit("draw-request");
}

async function playDrawAnimation(card, playerId = null) {
  if (isDrawAnimating.value) {
    return false;
  }

  const activeDrawPlayerId =
    playerId ?? props.drawPlayerId ?? resolvedCurrentPlayerId.value;
  const shouldDrawSelf = isSelfDraw(activeDrawPlayerId);

  if (shouldDrawSelf && !card) {
    return false;
  }

  isDrawAnimating.value = true;
  activeDrawCard.value = card ? { ...card } : null;

  if (shouldDrawSelf) {
    playerHand.value?.prepareDrawTarget();
  }

  await nextTick();

  const startRect = animationRects.getDrawRect("source");
  const targetRect = shouldDrawSelf
    ? animationRects.getDrawRect("target")
    : animationRects.getDrawRect("target", activeDrawPlayerId);

  if (!startRect || !targetRect) {
    playerHand.value?.finishDraw();
    activeDrawCard.value = null;
    isDrawAnimating.value = false;
    return false;
  }

  try {
    if (shouldDrawSelf) {
      await cardDrawAnimation.value?.selfDraw({
        startRect,
        targetRect,
      });
    } else {
      await cardDrawAnimation.value?.othersDraw({
        startRect,
        targetRect,
      });
    }
    await nextTick();
    return true;
  } finally {
    playerHand.value?.finishDraw();
    activeDrawCard.value = null;
    isDrawAnimating.value = false;
  }
}

function settleEffectAnimation(result, completed = false) {
  if (
    result &&
    activeEffectResult.value?.id &&
    activeEffectResult.value.id !== result.id
  ) {
    return;
  }

  if (effectAnimationTimeout) {
    window.clearTimeout(effectAnimationTimeout);
    effectAnimationTimeout = null;
  }

  const resolve = effectAnimationResolve;
  effectAnimationResolve = null;
  activeEffectResult.value = null;
  resolve?.(completed);
}

function stopEffectAnimation() {
  settleEffectAnimation(null, false);
}

function settleRoundStartNotice(completed = false) {
  const resolve = roundStartNoticeResolve;
  roundStartNoticeResolve = null;
  resolve?.(completed);
}

function closeRoundStartNotice() {
  isRoundStartNoticeOpen.value = false;
  settleRoundStartNotice(true);
}

async function playRoundStartNotice(
  signature = getInitialRoundDealSignature(),
) {
  const noticeKey = getRoundStartNoticeKey(signature);

  if (
    !noticeKey ||
    isRoundWinnerNoticeOpen.value ||
    isPlayerEliminatedNoticeOpen.value ||
    lastRoundStartNoticeKey.value === noticeKey
  ) {
    return false;
  }

  lastRoundStartNoticeKey.value = noticeKey;
  isTurnNoticeOpen.value = false;
  isRoundStartNoticeOpen.value = false;
  settleRoundStartNotice(false);

  await nextTick();

  return new Promise((resolve) => {
    roundStartNoticeResolve = resolve;
    isRoundStartNoticeOpen.value = true;
  });
}

function playTurnNotice({ force = false } = {}) {
  const initialRoundDealSignature = getInitialRoundDealSignature();

  if (
    isRoundStartNoticeOpen.value ||
    isRoundWinnerNoticeOpen.value ||
    isPlayerEliminatedNoticeOpen.value ||
    isInitialRoundDrawAnimating.value ||
    (!force &&
      initialRoundDealSignature &&
      lastInitialRoundDealSignature.value !== initialRoundDealSignature)
  ) {
    return;
  }

  isTurnNoticeOpen.value = false;

  nextTick(() => {
    isTurnNoticeOpen.value = true;
  });
}

function playRoundWinnerNotice(player) {
  if (!player) {
    return;
  }

  isRoundStartNoticeOpen.value = false;
  settleRoundStartNotice(false);
  isTurnNoticeOpen.value = false;
  isPlayerEliminatedNoticeOpen.value = false;
  isRoundWinnerNoticeOpen.value = false;
  roundWinnerNotice.value = {
    name: player.name,
    avatarUrl: player.avatarUrl,
  };

  nextTick(() => {
    isRoundWinnerNoticeOpen.value = true;
  });
}

function playPlayerEliminatedNotice(player) {
  if (!player) {
    return;
  }

  isRoundStartNoticeOpen.value = false;
  settleRoundStartNotice(false);
  isTurnNoticeOpen.value = false;
  isRoundWinnerNoticeOpen.value = false;
  isPlayerEliminatedNoticeOpen.value = false;
  playerEliminatedNotice.value = {
    name: player.name,
    avatarUrl: player.avatarUrl,
  };

  nextTick(() => {
    isPlayerEliminatedNoticeOpen.value = true;
  });
}

function getRoundWinSnapshot(players) {
  return Object.fromEntries(
    players.map((player) => [String(player.id), Number(player.roundWins ?? 0)]),
  );
}

function getEliminatedSnapshot(players) {
  return Object.fromEntries(
    players.map((player) => [String(player.id), Boolean(player.isEliminated)]),
  );
}

function playEffectAnimation(result) {
  if (!result?.type) {
    return Promise.resolve(false);
  }

  stopEffectAnimation();

  const nextResult = {
    ...result,
    id: result.id ?? `effect-${Date.now()}-${++effectAnimationSequence}`,
  };

  return new Promise((resolve) => {
    effectAnimationResolve = resolve;
    activeEffectResult.value = nextResult;

    effectAnimationTimeout = window.setTimeout(
      () => {
        settleEffectAnimation(nextResult, nextResult.type === "protection");
      },
      nextResult.type === "protection" ? 1000 : 8000,
    );
  });
}

async function playRemoteCardPlayAnimation(action) {
  const playerId = action?.playerId;
  const card = action?.discardedCard;

  if (!playerId || !card || animationRects.isSelfPlayer(playerId)) {
    return false;
  }

  const player = props.players.find(
    (candidate) => String(candidate.id) === String(playerId),
  );
  const originRect = animationRects.getPlayerHandRect(playerId);
  const targetRect = animationRects.getDiscardRect();

  if (!originRect || !targetRect) {
    return false;
  }

  return Boolean(
    await cardPlayAnimation.value?.play({
      card,
      originRect,
      targetRect,
      position: player?.position ?? "top",
      faceUp: false,
    }),
  );
}

function handleEffectAnimationComplete(result) {
  settleEffectAnimation(result, true);
}

function refreshDiscardRect() {
  discardRect.value = animationRects.getPlayRect("discard");
}

function refreshPlayZoneRect() {
  playZoneRect.value = animationRects.getPlayRect("zone");
}

function pointInsideRect(point, rect) {
  if (!point || !rect) {
    return false;
  }

  return (
    point.x >= rect.left &&
    point.x <= rect.left + rect.width &&
    point.y >= rect.top &&
    point.y <= rect.top + rect.height
  );
}

function clearPointerListeners() {
  if (pointerMoveHandler) {
    window.removeEventListener("pointermove", pointerMoveHandler);
    pointerMoveHandler = null;
  }

  if (pointerUpHandler) {
    window.removeEventListener("pointerup", pointerUpHandler);
    window.removeEventListener("pointercancel", pointerUpHandler);
    pointerUpHandler = null;
  }
}

function resetInteraction() {
  clearPointerListeners();
  activeCard.value = null;
  originRect.value = null;
  dragPoint.value = null;
  playZoneRect.value = null;
  discardRect.value = null;
  draggingCardId.value = null;
  isDragging.value = false;
  isOverPlayZone.value = false;
}

function resetPendingChoices() {
  selectedTargetPlayerId.value = null;
  selectedGuessRank.value = null;
}

function preparePendingPlay(card) {
  pendingPlay.value = { card };
  resetPendingChoices();
}

function cardRequiresPlayChoices(card) {
  return (
    card?.targetMode === "opponent" ||
    card?.targetMode === "anyPlayer" ||
    Boolean(card?.requiresGuess)
  );
}

function clearHiddenPlayedCard(cardId) {
  const timer = hiddenPlayedCardTimers.get(cardId);

  if (timer) {
    window.clearTimeout(timer);
    hiddenPlayedCardTimers.delete(cardId);
  }

  locallyHiddenPlayedCardIds.value = locallyHiddenPlayedCardIds.value.filter(
    (hiddenCardId) => hiddenCardId !== cardId,
  );
}

function hideSubmittedCard(cardId) {
  if (!cardId || locallyHiddenPlayedCardIds.value.includes(cardId)) {
    return;
  }

  locallyHiddenPlayedCardIds.value = [
    ...locallyHiddenPlayedCardIds.value,
    cardId,
  ];

  const timer = window.setTimeout(() => {
    clearHiddenPlayedCard(cardId);
  }, 5000);

  hiddenPlayedCardTimers.set(cardId, timer);
}

function emitPlayCard(card, targetPlayerId = null, guessedRank = null) {
  hideSubmittedCard(card.id);

  emit("play-card", {
    card,
    cardId: card.id,
    cardRank: card.rank,
    effectKey: card.effectKey,
    targetPlayerId,
    guessedRank,
  });
}

function selectTargetPlayer(playerId) {
  if (!selectableTargetPlayerIds.value.includes(playerId)) {
    return;
  }

  selectedTargetPlayerId.value = playerId;
}

function selectGuessRank(rank) {
  if (!pendingRequiresGuess.value) {
    return;
  }

  selectedGuessRank.value = rank;
}

function confirmPendingPlay() {
  if (!canConfirmPendingPlay.value) {
    return;
  }

  const playedCard = pendingPlay.value.card;

  emitPlayCard(
    playedCard,
    selectedTargetPlayerId.value,
    selectedGuessRank.value,
  );

  pendingPlay.value = null;
  resetPendingChoices();
}

function cancelPendingPlay() {
  pendingPlay.value = null;
  resetPendingChoices();
}

function getDragReleaseRect() {
  if (!originRect.value || !dragPoint.value) {
    return null;
  }

  return animationRects.createPointCenteredRect(
    dragPoint.value,
    originRect.value,
  );
}

async function playActiveCard() {
  const card = activeCard.value;
  const releaseRect = getDragReleaseRect();
  refreshDiscardRect();

  if (!card || !releaseRect || !discardRect.value) {
    resetInteraction();
    return;
  }

  const targetRect = discardRect.value;

  try {
    const didPlay = await cardPlayAnimation.value?.play({
      card,
      originRect: releaseRect,
      targetRect,
      position: "bottom",
      faceUp: true,
    });

    if (didPlay) {
      if (cardRequiresPlayChoices(card)) {
        preparePendingPlay(card);
      } else {
        emitPlayCard(card);
      }
    }
  } finally {
    resetInteraction();
  }
}

function handleWindowPointerMove(event) {
  if (!hasActivePlay.value) {
    return;
  }

  dragPoint.value = {
    x: event.clientX,
    y: event.clientY,
  };

  refreshPlayZoneRect();
  isOverPlayZone.value = pointInsideRect(dragPoint.value, playZoneRect.value);
}

function handleWindowPointerUp(event) {
  if (!hasActivePlay.value) {
    resetInteraction();
    return;
  }

  dragPoint.value = {
    x: event.clientX,
    y: event.clientY,
  };

  refreshPlayZoneRect();
  isOverPlayZone.value = pointInsideRect(dragPoint.value, playZoneRect.value);
  isDragging.value = false;
  clearPointerListeners();

  if (isOverPlayZone.value) {
    playActiveCard();
    return;
  }

  resetInteraction();
}

function handleCardPointerDown(card, event) {
  if (
    isHandPlayInteractionLocked.value ||
    advisorRuleDisabledCardIds.value.includes(card.id)
  ) {
    return;
  }

  const cardElement = event.currentTarget;
  const cardRect = animationRects.getCardElementRect(cardElement);

  if (!cardRect) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  activeCard.value = card;
  draggingCardId.value = card.id;
  originRect.value = cardRect;
  dragPoint.value = {
    x: event.clientX,
    y: event.clientY,
  };
  refreshDiscardRect();
  refreshPlayZoneRect();
  isDragging.value = true;
  isOverPlayZone.value = pointInsideRect(dragPoint.value, playZoneRect.value);

  pointerMoveHandler = handleWindowPointerMove;
  pointerUpHandler = handleWindowPointerUp;
  window.addEventListener("pointermove", pointerMoveHandler, { passive: true });
  window.addEventListener("pointerup", pointerUpHandler);
  window.addEventListener("pointercancel", pointerUpHandler);

  if (typeof cardElement.setPointerCapture === "function") {
    try {
      cardElement.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is a best-effort improvement only.
    }
  }
}

onBeforeUnmount(() => {
  clearPointerListeners();
  cardPlayAnimation.value?.stop?.();
  stopEffectAnimation();
  settleRoundStartNotice(false);
  hiddenPlayedCardTimers.forEach((timer) => window.clearTimeout(timer));
  hiddenPlayedCardTimers.clear();
});

watch(
  () => [props.currentTurnPlayerId, resolvedCurrentPlayerId.value],
  ([turnPlayerId], [previousTurnPlayerId] = []) => {
    if (
      isExplicitCurrentPlayerTurn.value &&
      String(turnPlayerId) !== String(previousTurnPlayerId)
    ) {
      playTurnNotice();
    }
  },
  { immediate: true },
);

watch(
  getInitialRoundDealSignature,
  (signature) => {
    if (!signature || signature === lastInitialRoundDealSignature.value) {
      return;
    }

    lastInitialRoundDealSignature.value = signature;
    playInitialRoundDrawSequence(signature);
  },
  { immediate: true },
);

watch(
  () => props.roundNumber,
  () => {
    const signature = getInitialRoundDealSignature();

    if (
      !signature ||
      signature !== lastInitialRoundDealSignature.value ||
      isInitialRoundDrawAnimating.value
    ) {
      return;
    }

    playRoundStartNotice(signature);
  },
);

watch(
  () => getRoundWinSnapshot(props.players),
  (nextWins, previousWins = {}) => {
    const winner = props.players.find((player) => {
      const playerId = String(player.id);
      const nextWinCount = Number(nextWins[playerId] ?? 0);
      const previousWinCount = Number(previousWins[playerId] ?? nextWinCount);

      return nextWinCount > previousWinCount;
    });

    if (winner) {
      playRoundWinnerNotice(winner);
    }
  },
);

watch(
  () => getEliminatedSnapshot(props.players),
  (nextEliminated, previousEliminated = {}) => {
    const eliminatedPlayer = props.players.find((player) => {
      const playerId = String(player.id);

      return (
        Boolean(nextEliminated[playerId]) &&
        !Boolean(previousEliminated[playerId])
      );
    });

    if (eliminatedPlayer) {
      playPlayerEliminatedNotice(eliminatedPlayer);
    }
  },
);

watch(
  () => props.handCards.map((card) => card.id),
  (cardIds) => {
    const handCardIdSet = new Set(cardIds);

    locallyHiddenPlayedCardIds.value
      .filter((cardId) => !handCardIdSet.has(cardId))
      .forEach(clearHiddenPlayedCard);
  },
);

defineExpose({
  playDrawAnimation,
  playEffectAnimation,
  playRemoteCardPlayAnimation,
});
</script>

<template>
  <main
    class="relative min-h-[100dvh] w-full overflow-hidden bg-[var(--brand-navy)]"
  >
    <section
      class="game-stage relative hidden h-[100dvh] w-[100dvw] overflow-hidden bg-cover bg-center bg-no-repeat"
      :style="{ backgroundImage: `url(${gameTableBackgroundUrl})` }"
      aria-label="Office Politics 遊戲舞台"
    >
      <div
        v-if="pendingPlay"
        class="play-target-backdrop"
        aria-hidden="true"
      ></div>

      <PlayerSeats
        ref="playerSeats"
        :players="players"
        :dealt-player-ids="initialRoundDealtPlayerIds"
        :player-hand-card-counts="resolvedPlayerHandCardCounts"
        :is-target-selection-active="
          Boolean(pendingPlay) && pendingRequiresTarget
        "
        :selectable-player-ids="selectableTargetPlayerIds"
        :selected-target-player-id="selectedTargetPlayerId"
        @target-select="selectTargetPlayer"
      />

      <div class="turn-controls absolute top-5 left-3 lg:top-8 lg:left-6">
        <TurnStatus
          :round-number="roundNumber"
          :current-phase="currentPhase"
          :current-step="currentStep"
        />
      </div>

      <div
        class="game-brand-tools absolute top-2 right-3 flex items-center gap-2 lg:top-4 lg:right-4 lg:gap-6"
      >
        <img
          :src="gameLogoUrl"
          alt="Office Politics"
          class="block h-auto w-24 select-none object-contain drop-shadow-[0_3px_10px_rgba(0,19,50,0.48)] lg:w-40"
          draggable="false"
        />
        <GameSettingsIcon @open="isSettingsOpen = true" />
      </div>

      <div
        class="table-card-piles absolute top-[38%] left-1/2 -translate-x-1/2"
      >
        <TableCardPiles
          ref="tableCardPilesRef"
          :deck-count="deckCount"
          :discard-cards="visibleDiscardCards"
          :is-draw-disabled="isDeckDrawDisabled"
          :draw-disabled-message="deckBlockedMessage"
          :is-drop-target-active="isOverPlayZone && hasActivePlay"
          @draw="requestDraw"
        />
      </div>

      <div class="absolute bottom-[-34px] left-1/2 z-20 -translate-x-1/2">
        <PlayerHand
          ref="playerHand"
          :cards="visibleHandCards"
          :dragging-card-id="draggingCardId"
          :disabled-card-ids="advisorRuleDisabledCardIds"
          :is-interaction-disabled="isHandDrawRequired"
          :disabled-message="handDisabledMessage"
          @card-pointerdown="handleCardPointerDown"
        />
      </div>

      <TransitionGroup name="protection-aura-fade">
        <ProtectionAura
          v-for="player in protectedPlayers"
          :key="`protection-aura-${player.id}`"
          screen-anchored
          :position="player.position"
        />
      </TransitionGroup>

      <Transition name="protection-aura-fade">
        <ProtectionAura
          v-if="activeProtectionAnimationPlayer"
          :key="`protection-block-${activeEffectResult.id}`"
          :success-key="activeEffectResult.id"
          screen-anchored
          :position="activeProtectionAnimationPlayer.position"
        />
      </Transition>

      <section
        v-if="pendingPlay"
        class="play-confirm-panel"
        aria-label="出牌確認"
      >
        <div class="play-confirm-panel__summary">
          <span>準備出牌</span>
          <strong>{{ pendingPlay.card.name }}</strong>
          <small>
            {{
              pendingRequiresTarget
                ? selectedTargetPlayer
                  ? `目標：${selectedTargetPlayer.name}`
                  : "請點選玩家頭像"
                : "此牌不需要指定目標"
            }}
          </small>
        </div>

        <CardGuessSelector
          v-if="pendingRequiresGuess"
          :guess-options="guessOptions"
          :selected-rank="selectedGuessRank"
          :excluded-ranks="[1]"
          @select="selectGuessRank"
        />

        <p v-if="pendingRequiresGuess" class="play-confirm-panel__hint">
          {{
            selectedGuessOption
              ? `猜測：${selectedGuessOption.name}`
              : "實習生不能猜實習生，請選擇 2-8 的牌。"
          }}
        </p>

        <div class="play-confirm-panel__actions">
          <button type="button" @click="cancelPendingPlay">取消</button>
          <button
            type="button"
            class="play-confirm-panel__confirm"
            :disabled="!canConfirmPendingPlay"
            @click="confirmPendingPlay"
          >
            確認出牌
          </button>
        </div>
      </section>

      <CardDrawAnimation ref="cardDrawAnimation" :card="activeDrawCard" />
      <CardShuffleAnimation ref="cardShuffleAnimation" />

      <div
        v-if="hasActivePlay && isDragging"
        class="card-play-drag-preview fixed pointer-events-none"
        :class="{ 'card-play-drag-preview--over': isOverPlayZone }"
        :style="dragPreviewStyle"
        aria-hidden="true"
      >
        <div
          class="card-play-drag-preview__glow"
          :style="{ '--accent': activeCard.color }"
        ></div>
        <GameCard
          :name="activeCard.name"
          :background-url="activeCard.backgroundUrl"
          :frame-url="activeCard.frameUrl"
        />
      </div>

      <CardPlayAnimation ref="cardPlayAnimation" />

      <CleanerAnimation
        v-if="activeEffectResult?.type === 'cleaner'"
        :result="activeEffectResult"
        :get-player-hand-rect="animationRects.getPlayerHandRect"
        :is-self-player="animationRects.isSelfPlayer"
        @complete="handleEffectAnimationComplete"
      />

      <InternAnimation
        v-if="activeEffectResult?.type === 'intern'"
        :result="activeEffectResult"
        :get-player-hand-rect="animationRects.getPlayerHandRect"
        :get-discard-rect="animationRects.getDiscardRect"
        @complete="handleEffectAnimationComplete"
      />

      <ManagerAnimation
        v-if="activeEffectResult?.type === 'manager'"
        :result="activeEffectResult"
        :get-player-hand-rect="animationRects.getPlayerHandRect"
        :get-discard-rect="animationRects.getDiscardRect"
        :is-self-player="animationRects.isSelfPlayer"
        @complete="handleEffectAnimationComplete"
      />

      <PMAnimation
        v-if="activeEffectResult?.type === 'pm'"
        :result="activeEffectResult"
        :get-player-hand-rect="animationRects.getPlayerHandRect"
        :get-discard-rect="animationRects.getDiscardRect"
        :get-deck-rect="animationRects.getDeckRect"
        :is-self-player="animationRects.isSelfPlayer"
        @complete="handleEffectAnimationComplete"
      />

      <CardSwapAnimation
        v-if="activeEffectResult?.type === 'swap'"
        :result="activeEffectResult"
        :get-player-hand-rect="animationRects.getPlayerHandRect"
        @complete="handleEffectAnimationComplete"
      />
    </section>

    <GameSettingsModal
      :is-open="isSettingsOpen"
      :music-enabled="musicEnabled"
      :music-volume="musicVolume"
      :sound-enabled="soundEnabled"
      :sound-volume="soundVolume"
      @close="isSettingsOpen = false"
      @update:music-enabled="setMusicEnabled"
      @update:music-volume="setMusicVolume"
      @update:sound-enabled="setSoundEnabled"
      @update:sound-volume="setSoundVolume"
      @return-lobby="emit('return-lobby')"
      @restart-game="emit('restart-game')"
    />

    <FlyInTextModal
      :is-open="isRoundStartNoticeOpen"
      :text="roundStartNoticeText"
      @close="closeRoundStartNotice"
    />

    <FlyInTextModal
      :is-open="isTurnNoticeOpen"
      text="輪到你的回合"
      @close="isTurnNoticeOpen = false"
    />

    <FlyInTextModal
      :is-open="isRoundWinnerNoticeOpen"
      text="回合勝利"
      :player-name="roundWinnerNotice?.name ?? ''"
      :avatar-url="roundWinnerNotice?.avatarUrl ?? ''"
      :duration="2400"
      @close="isRoundWinnerNoticeOpen = false"
    />

    <FlyInTextModal
      :is-open="isPlayerEliminatedNoticeOpen"
      text="玩家淘汰"
      :player-name="playerEliminatedNotice?.name ?? ''"
      :avatar-url="playerEliminatedNotice?.avatarUrl ?? ''"
      tone="danger"
      :duration="2400"
      @close="isPlayerEliminatedNoticeOpen = false"
    />

    <RotateDeviceNotice />
  </main>
</template>

<style scoped>
.card-play-drag-preview {
  z-index: 49;
  cursor: grabbing;
  filter: drop-shadow(0 18px 24px rgba(0, 0, 0, 0.42));
  transform-origin: 50% 50%;
  will-change: transform;
}

.card-play-drag-preview__glow {
  position: absolute;
  inset: -14%;
  border-radius: 18px;
  background:
    radial-gradient(
      circle at 50% 50%,
      rgba(255, 255, 255, 0.34),
      transparent 36%
    ),
    radial-gradient(circle at 50% 50%, var(--accent), transparent 68%);
  filter: blur(13px);
  opacity: 0;
  transform: scale(0.82);
  transition:
    opacity 0.14s ease,
    transform 0.14s ease;
}

.card-play-drag-preview--over .card-play-drag-preview__glow {
  opacity: 0.82;
  transform: scale(1);
}

.play-target-backdrop {
  position: absolute;
  inset: 0;
  z-index: 44;
  pointer-events: none;
  background: rgba(0, 0, 0, 0.42);
  -webkit-backdrop-filter: blur(5px);
  backdrop-filter: blur(5px);
}

.play-confirm-panel {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 78;
  display: grid;
  gap: 12px;
  width: min(340px, calc(100vw - 32px));
  max-height: min(420px, calc(100dvh - 224px));
  overflow: auto;
  border: 1px solid rgba(250, 204, 21, 0.58);
  border-radius: var(--radius-md, 0);
  padding: 16px;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(7, 17, 29, 0.9)),
    rgba(7, 17, 29, 0.82);
  box-shadow:
    0 0 24px rgba(250, 204, 21, 0.16),
    0 22px 48px rgba(0, 0, 0, 0.46);
  color: #f8fafc;
  backdrop-filter: blur(10px);
}

.play-confirm-panel__summary {
  display: grid;
  gap: 4px;
}

.play-confirm-panel__summary span {
  color: #facc15;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.play-confirm-panel__summary strong {
  font-size: 24px;
  line-height: 1.05;
}

.play-confirm-panel__summary small,
.play-confirm-panel__hint {
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.35;
}

.play-confirm-panel__hint {
  margin: 0;
}

.play-confirm-panel__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.play-confirm-panel__actions button {
  min-height: 38px;
  border: 1px solid rgba(148, 163, 184, 0.48);
  border-radius: var(--radius-md, 0);
  padding: 0 12px;
  cursor: pointer;
  background: rgba(15, 23, 42, 0.72);
  color: #f8fafc;
  font-size: 13px;
  font-weight: 900;
}

.play-confirm-panel__confirm {
  border-color: rgba(250, 204, 21, 0.72) !important;
  background: rgba(250, 204, 21, 0.18) !important;
}

.play-confirm-panel__actions button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

@media (orientation: landscape), (min-width: 768px) {
  .game-stage {
    display: block;
  }
}
</style>
