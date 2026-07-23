<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { FastForward } from "@lucide/vue";
import gameTableBackgroundUrl from "@/assets/images/bg-game-table.webp";
import gameLogoUrl from "@/assets/images/logo-en-white.png";
import { useAudioSettings } from "@/composables/UseAudioSettings";
import { useButtonClickAudio } from "@/composables/UseButtonClickAudio";
import { useGameTableAudio } from "@/composables/UseGameTableAudio";
import { useGameStageCardPlay } from "@/composables/useGameStageCardPlay";
import { useGameStageCardVisibility } from "@/composables/useGameStageCardVisibility";
import { useGameStageDrawSequence } from "@/composables/useGameStageDrawSequence";
import { useGameStageEffectAnimation } from "@/composables/useGameStageEffectAnimation";
import { CARD_INFO_BY_RANK, getCardDisplayName } from "@/constants/cardInfo";
import {
  getEliminatedSnapshot,
  getRoundWinSnapshot,
  useGameStageNotices,
} from "@/composables/useGameStageNotices";
import { useGameAnimationRects } from "@/composables/useGameAnimationRects";
import { useGameTutorial } from "@/composables/UseGameTutorial";
import { useAppearanceStore } from "@/stores/appearanceStore.js";
import CardDrawAnimation from "../animations/CardDrawAnimation.vue";
import CardPlayAnimation from "../animations/CardPlayAnimation.vue";
import CardShuffleAnimation from "../animations/CardShuffleAnimation.vue";
import CardSwapAnimation from "../animations/CardSwapAnimation.vue";
import CleanerAnimation from "../animations/CleanerAnimation.vue";
import FlyInTextModal from "../animations/FlyInTextModal.vue";
import InternAnimation from "../animations/InternAnimation.vue";
import ManagerAnimation from "../animations/ManagerAnimation.vue";
import PMAnimation from "../animations/PMAnimation.vue";
import ProtectionAura from "../animations/ProtectionAura.vue";
import RoundShowdownAnimation from "../animations/RoundShowdownAnimation.vue";
import CardInspectionOverlay from "./CardInspectionOverlay.vue";
import CardPlayConfirmPanel from "./CardPlayConfirmPanel.vue";
import GameCard from "./GameCard.vue";
import GameRulesModal from "./GameRulesModal.vue";
import GameSettingsIcon from "./GameSettingsIcon.vue";
import GameSettingsModal from "./GameSettingsModal.vue";
import PlayerHand from "./PlayerHand.vue";
import PlayerSeats from "./PlayerSeats.vue";
import RotateDeviceNotice from "./RotateDeviceNotice.vue";
import TableCardPiles from "./TableCardPiles.vue";
import TurnStatus from "./TurnStatus.vue";

const SKIPPED_SETTLEMENT_NOTICE_DURATION_MS = 1000;
const SKIPPED_SETTLEMENT_ACK_BUFFER_MS = 150;

const props = defineProps({
  roundNumber: {
    type: [Number, String],
    required: true,
  },
  currentPhase: {
    type: String,
    required: true,
  },
  gamePhase: {
    type: String,
    default: "playing",
  },
  currentStep: {
    type: String,
    required: true,
  },
  isGameFinished: {
    type: Boolean,
    default: false,
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
  hasAnyCardBeenPlayed: {
    type: Boolean,
    default: false,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  isSkippingComputerFinish: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "return-lobby",
  "restart-game",
  "draw-request",
  "play-card",
  "auto-play-timeout",
  "skip-computer-finish",
  "round-sequence-complete",
]);

const { handleButtonClick } = useButtonClickAudio();
const appearanceStore = useAppearanceStore();
const { boardSkinUrl } = storeToRefs(appearanceStore);
const isSettingsOpen = ref(false);
const isDrawAnimating = ref(false);
const activeDrawCard = ref(null);
const tableCardPilesRef = ref(null);
const playerSeats = ref(null);
const playerHand = ref(null);
const gameSettingsIcon = ref(null);
const gameRulesModal = ref(null);
const cardDrawAnimation = ref(null);
const cardPlayAnimation = ref(null);
const cardShuffleAnimation = ref(null);
const roundShowdownAnimation = ref(null);
const roundShowdownHiddenPlayerIds = ref([]);
const activeEffectResult = ref(null);
const isInitialRoundDrawAnimating = ref(false);
const turnSecondsLeft = ref(30);
const initialRoundDealtPlayerIds = ref([]);
const lastInitialRoundDealSignature = ref(null);
const resolvedCurrentPlayerId = computed(
  () =>
    props.currentPlayerId ??
    props.players.find((player) => player.isCurrentPlayer)?.id ??
    null,
);
const {
  startTutorial,
  waitForTutorialSettlement,
  disposeTutorial,
  isBlocking: isTutorialBlocking,
} = useGameTutorial();

function getGameTutorialTargets() {
  return {
    deck: tableCardPilesRef.value?.getDeckElement?.() ?? null,
    hand: playerHand.value?.getHandElement?.() ?? null,
    discard: tableCardPilesRef.value?.getDiscardElement?.() ?? null,
    settings: gameSettingsIcon.value?.getButtonElement?.() ?? null,
    rules: gameRulesModal.value?.getTriggerElement?.() ?? null,
    opponents:
      playerSeats.value?.getOpponentSeatElements?.(
        resolvedCurrentPlayerId.value,
      ) ?? [],
  };
}
const resolvedTableBackgroundUrl = computed(
  () => boardSkinUrl.value || gameTableBackgroundUrl,
);
const animationRects = useGameAnimationRects({
  playerHand,
  playerSeats,
  tableCardPiles: tableCardPilesRef,
  currentPlayerId: resolvedCurrentPlayerId,
});

const guessOptions = Object.entries(CARD_INFO_BY_RANK).map(
  ([rank, cardInfo]) => ({
    rank: Number(rank),
    name: getCardDisplayName(cardInfo),
  }),
);

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
const {
  playGameCardDealSound,
  playGameCardPlaySound,
  playHrCardSwapSound,
  playInternGuessResultSound,
  playPlayerEliminatedSound,
  playRoundWinSound,
  playSeniorProtectionActivateSound,
} = useGameTableAudio();

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
const currentTurnPlayer = computed(
  () =>
    props.players.find(
      (player) => String(player.id) === String(props.currentTurnPlayerId),
    ) ?? null,
);
const canSkipComputerFinish = computed(() => {
  const humans = props.players.filter((player) => !player.isComputer);
  const computers = props.players.filter((player) => player.isComputer);
  const selfPlayer = props.players.find((player) => player.isCurrentPlayer);

  return (
    humans.length === 1 &&
    computers.length === 3 &&
    Boolean(selfPlayer?.isEliminated) &&
    !props.isSkippingComputerFinish &&
    !isSkipSettlementActive.value
  );
});

let getInitialRoundDealSignature = () => null;
let turnTimer = null;
const isSkipSettlementActive = ref(false);
const areAutoNoticesSuppressed = computed(
  () => props.isSkippingComputerFinish || isSkipSettlementActive.value,
);

function stopTurnTimer() {
  if (turnTimer) {
    window.clearInterval(turnTimer);
    turnTimer = null;
  }
}

const {
  isTurnNoticeOpen,
  isRoundStartNoticeOpen,
  isRoundWinnerNoticeOpen,
  roundWinnerNotice,
  isPlayerEliminatedNoticeOpen,
  playerEliminatedNotice,
  isGameEndNoticeOpen,
  roundStartNoticeText,
  playRoundStartNotice,
  playTurnNotice,
  playRoundWinnerNotice,
  playPlayerEliminatedNotice,
  playGameEndNotice,
  closeRoundStartNotice,
  closeTurnNotice,
  closeRoundWinnerNotice,
  closePlayerEliminatedNotice,
  closeGameEndNotice,
  waitForNoticeIdle,
  resolveNoticeIdleIfIdle,
  holdNoticeAckAfterClose,
  cleanupNotices,
  pendingNoticeOpenCount,
  pendingNoticeAckDelayCount,
} = useGameStageNotices({
  props,
  isInitialRoundDrawAnimating,
  activeEffectResult,
  getInitialRoundDealSignature: () => getInitialRoundDealSignature(),
  lastInitialRoundDealSignature,
  playPlayerEliminatedSound,
});

const areTurnStartAnimationsIdle = computed(
  () =>
    !isTutorialBlocking.value &&
    !isInitialRoundDrawAnimating.value &&
    !isDrawAnimating.value &&
    !activeEffectResult.value &&
    !isRoundStartNoticeOpen.value &&
    !isTurnNoticeOpen.value &&
    !isRoundWinnerNoticeOpen.value &&
    !isPlayerEliminatedNoticeOpen.value &&
    pendingNoticeOpenCount.value === 0 &&
    pendingNoticeAckDelayCount.value === 0,
);
const shouldRunTurnTimer = computed(
  () =>
    props.gamePhase === "playing" &&
    Boolean(currentTurnPlayer.value) &&
    !currentTurnPlayer.value.isComputer &&
    !currentTurnPlayer.value.isEliminated &&
    !props.isSkippingComputerFinish &&
    !isSkipSettlementActive.value &&
    areTurnStartAnimationsIdle.value,
);

const {
  playEffectAnimation,
  stopEffectAnimation,
  handleEffectAnimationComplete,
} = useGameStageEffectAnimation({
  activeEffectResult,
  holdNoticeAckAfterClose,
  playSeniorProtectionActivateSound,
  resolveNoticeIdleIfIdle,
});

const drawSequence = useGameStageDrawSequence({
  props,
  emit,
  playerHand,
  tableCardPilesRef,
  cardDrawAnimation,
  cardShuffleAnimation,
  animationRects,
  resolvedCurrentPlayerId,
  isExplicitCurrentPlayerTurn,
  isDrawAnimating,
  activeDrawCard,
  isInitialRoundDrawAnimating,
  initialRoundDealtPlayerIds,
  lastInitialRoundDealSignature,
  playRoundStartNotice,
  playTurnNotice,
  playGameCardDealSound,
  waitForTutorialSettlement,
  resolveNoticeIdleIfIdle,
});

getInitialRoundDealSignature = drawSequence.getInitialRoundDealSignature;

const {
  initialRoundDealtPlayerIdSet,
  resolvedPlayerHandCardCounts,
  playInitialRoundDrawSequence,
  playDrawAnimation,
} = drawSequence;

const {
  activeCard,
  draggingHandCard,
  isDragging,
  isOverPlayZone,
  pendingPlay,
  selectedTargetPlayerId,
  selectedGuessRank,
  inspectedCard,
  hasActivePlay,
  pendingRequiresTarget,
  pendingRequiresGuess,
  isPendingTargetSelectionActive,
  isPendingPlayPanelVisible,
  selectableTargetPlayerIds,
  visibleHandCards,
  visiblePlayerHandCardCounts,
  advisorRuleDisabledCardIds,
  visibleDiscardCards,
  selectedTargetPlayer,
  canConfirmPendingPlay,
  isHandDrawRequired,
  isPlayInteractionLocked,
  isDeckDrawDisabled,
  handDisabledMessage,
  deckBlockedMessage,
  dragPreviewStyle,
  requestDraw,
  selectTargetPlayer,
  selectGuessRank,
  confirmPendingPlay,
  cancelPendingPlay,
  handleCardPointerDown,
  playRemoteCardPlayAnimation,
  stageDiscardedCard,
  clearStagedDiscardCard,
  cleanupCardPlay,
  pruneHiddenPlayedCards,
} = useGameStageCardPlay({
  props,
  emit,
  animationRects,
  cardPlayAnimation,
  isInitialRoundDrawAnimating,
  initialRoundDealtPlayerIdSet,
  resolvedCurrentPlayerId,
  isCurrentPlayerTurn,
  isDrawAnimating,
  activeEffectResult,
  resolvedPlayerHandCardCounts,
  playGameCardPlaySound,
});

const protectedPlayers = computed(() =>
  props.players.filter((player) => player.isProtected),
);
const protectedPlayerIds = computed(() =>
  protectedPlayers.value.map((player) => String(player.id)),
);
function resolvePlayerName(playerId) {
  return (
    props.players.find(
      (player) => String(player.id) === String(playerId),
    )?.name ?? "玩家"
  );
}
const activeCleanerTargetPlayerName = computed(() => {
  if (activeEffectResult.value?.type !== "cleaner") {
    return "玩家";
  }

  return resolvePlayerName(activeEffectResult.value.targetPlayerId);
});
const {
  activeCleanerAnimationResult,
  temporarilyHiddenCardIds,
  temporarilyHiddenSeatHandPlayerIds,
} = useGameStageCardVisibility({
  activeEffectResult,
  handCards: computed(() => props.handCards),
  isSelfPlayer: animationRects.isSelfPlayer,
  roundShowdownHiddenPlayerIds,
});

function handleShowdownHiddenPlayerIdsChange(playerIds) {
  roundShowdownHiddenPlayerIds.value = Array.isArray(playerIds)
    ? playerIds.map(String)
    : [];
}
const activeInternTargetPlayerName = computed(() => {
  if (activeEffectResult.value?.type !== "intern") {
    return "玩家";
  }

  return (
    props.players.find(
      (player) =>
        String(player.id) === String(activeEffectResult.value.targetPlayerId),
    )?.name ?? "玩家"
  );
});
const activeManagerTargetPlayerName = computed(() => {
  if (activeEffectResult.value?.type !== "manager") {
    return "玩家";
  }

  return resolvePlayerName(activeEffectResult.value.targetPlayerId);
});
const activePmTargetPlayerName = computed(() => {
  if (activeEffectResult.value?.type !== "pm") {
    return "玩家";
  }

  return resolvePlayerName(activeEffectResult.value.targetPlayerId);
});
const activeSwapTargetPlayerName = computed(() => {
  if (activeEffectResult.value?.type !== "swap") {
    return "玩家";
  }

  return resolvePlayerName(activeEffectResult.value.targetPlayerId);
});
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

onBeforeUnmount(() => {
  stopTurnTimer();
  disposeTutorial();
  cleanupCardPlay();
  cardPlayAnimation.value?.stop?.();
  roundShowdownAnimation.value?.stop?.();
  stopEffectAnimation();
  cleanupNotices();
});

watch(
  () => [
    props.currentTurnPlayerId,
    props.gamePhase,
    shouldRunTurnTimer.value,
    props.isLoading,
  ],
  () => {
    stopTurnTimer();
    turnSecondsLeft.value = 30;

    if (!shouldRunTurnTimer.value || props.isLoading) {
      return;
    }

    turnTimer = window.setInterval(() => {
      turnSecondsLeft.value = Math.max(0, turnSecondsLeft.value - 1);

      if (turnSecondsLeft.value === 0) {
        stopTurnTimer();
        emit("auto-play-timeout", props.currentTurnPlayerId);
      }
    }, 1000);
  },
  { immediate: true },
);

watch(
  () => [
    resolvedCurrentPlayerId.value,
    props.hasAnyCardBeenPlayed,
    props.players
      .map((player) => `${player.id}:${Boolean(player.isComputer)}`)
      .join("|"),
  ],
  async () => {
    await nextTick();
    await startTutorial({
      players: props.players,
      currentPlayerId: resolvedCurrentPlayerId.value,
      hasAnyCardBeenPlayed: props.hasAnyCardBeenPlayed,
      targets: getGameTutorialTargets(),
    });
  },
  { immediate: true, flush: "post" },
);

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
    if (areAutoNoticesSuppressed.value) {
      return;
    }

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
    if (areAutoNoticesSuppressed.value) {
      return;
    }

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
    if (areAutoNoticesSuppressed.value) {
      return;
    }

    const winner = props.players.find((player) => {
      const playerId = String(player.id);
      const nextWinCount = Number(nextWins[playerId] ?? 0);
      const previousWinCount = Number(previousWins[playerId] ?? nextWinCount);

      return nextWinCount > previousWinCount;
    });

    if (winner) {
      playRoundWinSound();
      playRoundWinnerNotice(winner);
    }
  },
);

watch(
  () => getEliminatedSnapshot(props.players),
  (nextEliminated, previousEliminated = {}) => {
    if (props.isGameFinished) {
      return;
    }

    if (areAutoNoticesSuppressed.value) {
      return;
    }

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
  () => props.handCards,
  (handCards) => {
    pruneHiddenPlayedCards(handCards);
  },
);

async function playGameEndTransition() {
  stopEffectAnimation();
  clearStagedDiscardCard();

  await nextTick();
  await waitForNoticeIdle();

  return playGameEndNotice();
}

defineExpose({
  playSkippedRoundSettlement: async (playerId, applyNextRoundState) => {
    isSkipSettlementActive.value = true;
    try {
      const winner = props.players.find(
        (player) => String(player.id) === String(playerId),
      );

      if (winner) {
        playRoundWinnerNotice(winner);
        await waitForNoticeIdle();
      }

      await applyNextRoundState?.();
      await nextTick();

      const signature = getInitialRoundDealSignature();

      if (signature) {
        lastInitialRoundDealSignature.value = signature;
        await playInitialRoundDrawSequence(signature, {
          showRoundStartNotice: false,
        });
      } else {
        emit("round-sequence-complete");
      }
    } finally {
      isSkipSettlementActive.value = false;
    }
  },
  playDrawAnimation,
  playEffectAnimation,
  playRemoteCardPlayAnimation,
  stageDiscardedCard,
  clearStagedDiscardCard,
  playRoundShowdownAnimation: (result) =>
    roundShowdownAnimation.value?.play?.(result) ?? Promise.resolve(false),
  playGameEndTransition,
  waitForNoticeIdle,
});
</script>

<template>
  <main
    class="relative min-h-[100dvh] w-full overflow-hidden bg-[var(--brand-navy)]"
  >
    <section
      class="game-stage relative hidden h-[100dvh] w-[100dvw] overflow-hidden bg-cover bg-center bg-no-repeat"
      :style="{ backgroundImage: `url(${resolvedTableBackgroundUrl})` }"
      aria-label="Office Politics 遊戲桌面"
      @click.capture="handleButtonClick"
    >
      <div
        v-if="pendingPlay"
        class="play-target-backdrop"
        aria-hidden="true"
      ></div>

      <p
        v-if="isPendingTargetSelectionActive"
        class="play-target-prompt"
        role="status"
        aria-live="polite"
      >
        請選擇玩家
      </p>

      <PlayerSeats
        ref="playerSeats"
        :players="players"
        :dealt-player-ids="initialRoundDealtPlayerIds"
        :player-hand-card-counts="visiblePlayerHandCardCounts"
        :temporarily-hidden-hand-card-player-ids="temporarilyHiddenSeatHandPlayerIds"
        :is-target-selection-active="isPendingTargetSelectionActive"
        :selectable-player-ids="selectableTargetPlayerIds"
        :selected-target-player-id="selectedTargetPlayerId"
        :protected-player-ids="protectedPlayerIds"
        @target-select="selectTargetPlayer"
      />

      <div class="turn-controls absolute top-5 left-3 lg:top-8 lg:left-6">
        <TurnStatus
          :round-number="roundNumber"
          :current-phase="currentPhase"
          :current-step="currentStep"
        />
      </div>

      <div v-if="shouldRunTurnTimer" class="turn-countdown" role="timer">
        <span class="turn-countdown__hourglass" aria-hidden="true"></span>
        <span>倒數 {{ turnSecondsLeft }} 秒</span>
      </div>

      <button
        v-if="canSkipComputerFinish"
        type="button"
        class="skip-computer-button"
        :disabled="isSkippingComputerFinish"
        @click="emit('skip-computer-finish')"
      >
        <FastForward class="skip-computer-button__icon" aria-hidden="true" />
        <span>{{ isSkippingComputerFinish ? "結算中" : "跳過後續對戰" }}</span>
      </button>

      <div
        v-if="isSkippingComputerFinish && !isSkipSettlementActive"
        class="skip-settlement-overlay"
        role="status"
        aria-live="polite"
      >
        結算中
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
        <GameSettingsIcon
          ref="gameSettingsIcon"
          @open="isSettingsOpen = true"
        />
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

      <GameRulesModal ref="gameRulesModal" />

      <div class="absolute bottom-[-34px] left-1/2 z-20 -translate-x-1/2">
        <PlayerHand
          ref="playerHand"
          :cards="visibleHandCards"
          :dragging-card="draggingHandCard"
          :disabled-card-ids="advisorRuleDisabledCardIds"
          :temporarily-hidden-card-ids="temporarilyHiddenCardIds"
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
          :show-label="!player.isCurrentPlayer"
        />
      </TransitionGroup>

      <Transition name="protection-aura-fade">
        <ProtectionAura
          v-if="activeProtectionAnimationPlayer"
          :key="`protection-block-${activeEffectResult.id}`"
          :success-key="activeEffectResult.id"
          screen-anchored
          :position="activeProtectionAnimationPlayer.position"
          :show-label="!activeProtectionAnimationPlayer.isCurrentPlayer"
        />
      </Transition>

      <CardPlayConfirmPanel
        v-if="isPendingPlayPanelVisible"
        :pending-play="pendingPlay"
        :pending-requires-target="pendingRequiresTarget"
        :pending-requires-guess="pendingRequiresGuess"
        :selected-target-player="selectedTargetPlayer"
        :selected-guess-rank="selectedGuessRank"
        :guess-options="guessOptions"
        :can-confirm-pending-play="canConfirmPendingPlay"
        @select-guess="selectGuessRank"
        @confirm="confirmPendingPlay"
        @cancel="cancelPendingPlay"
      />

      <CardInspectionOverlay
        v-if="inspectedCard && !isDragging"
        :card="inspectedCard"
        @close="inspectedCard = null"
        @card-pointerdown="handleCardPointerDown"
      />

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
        :result="activeCleanerAnimationResult"
        :target-player-name="activeCleanerTargetPlayerName"
        :get-player-hand-rect="animationRects.getPlayerHandRect"
        :is-self-player="animationRects.isSelfPlayer"
        @complete="handleEffectAnimationComplete"
      />

      <InternAnimation
        v-if="activeEffectResult?.type === 'intern'"
        :result="activeEffectResult"
        :target-player-name="activeInternTargetPlayerName"
        :get-player-hand-rect="animationRects.getPlayerHandRect"
        :get-discard-rect="animationRects.getDiscardRect"
        @outcome-reveal="playInternGuessResultSound"
        @complete="handleEffectAnimationComplete"
      />

      <ManagerAnimation
        v-if="activeEffectResult?.type === 'manager'"
        :result="activeEffectResult"
        :target-player-name="activeManagerTargetPlayerName"
        :get-player-hand-rect="animationRects.getPlayerHandRect"
        :get-discard-rect="animationRects.getDiscardRect"
        :is-self-player="animationRects.isSelfPlayer"
        @complete="handleEffectAnimationComplete"
      />

      <PMAnimation
        v-if="activeEffectResult?.type === 'pm'"
        :result="activeEffectResult"
        :target-player-name="activePmTargetPlayerName"
        :get-player-hand-rect="animationRects.getPlayerHandRect"
        :get-discard-rect="animationRects.getDiscardRect"
        :get-deck-rect="animationRects.getDeckRect"
        :is-self-player="animationRects.isSelfPlayer"
        @complete="handleEffectAnimationComplete"
      />

      <CardSwapAnimation
        v-if="activeEffectResult?.type === 'swap'"
        :result="activeEffectResult"
        :target-player-name="activeSwapTargetPlayerName"
        :get-player-hand-rect="animationRects.getPlayerHandRect"
        @swap-motion-start="playHrCardSwapSound"
        @complete="handleEffectAnimationComplete"
      />

      <RoundShowdownAnimation
        ref="roundShowdownAnimation"
        :get-player-hand-rect="animationRects.getPlayerHandRect"
        :is-self-player="animationRects.isSelfPlayer"
        @hidden-player-ids-change="handleShowdownHiddenPlayerIdsChange"
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
      text="你的回合"
      @close="closeTurnNotice"
    />

    <FlyInTextModal
      :is-open="isRoundWinnerNoticeOpen"
      text="回合獲勝"
      :player-name="roundWinnerNotice?.name ?? ''"
      :avatar-url="roundWinnerNotice?.avatarUrl ?? ''"
      :duration="
        isSkipSettlementActive ? SKIPPED_SETTLEMENT_NOTICE_DURATION_MS : 2400
      "
      @close="
        closeRoundWinnerNotice(
          isSkipSettlementActive ? SKIPPED_SETTLEMENT_ACK_BUFFER_MS : undefined,
        )
      "
    />

    <FlyInTextModal
      :is-open="isPlayerEliminatedNoticeOpen"
      text="玩家淘汰"
      :player-name="playerEliminatedNotice?.name ?? ''"
      :avatar-url="playerEliminatedNotice?.avatarUrl ?? ''"
      tone="danger"
      :duration="2400"
      @close="closePlayerEliminatedNotice"
    />

    <FlyInTextModal
      :is-open="isGameEndNoticeOpen"
      text="遊戲結束"
      modal-class="fly-in-text-modal--game-end"
      :duration="2400"
      @close="closeGameEndNotice"
    />

    <RotateDeviceNotice />
  </main>
</template>

<style scoped>
.card-play-drag-preview {
  z-index: 49;
  cursor: var(--cursor-grabbing, grabbing);
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

.play-target-prompt {
  position: absolute;
  inset: 0;
  z-index: 45;
  display: grid;
  place-items: center;
  margin: 0;
  padding: 20px;
  pointer-events: none;
  color: #fff;
  font-size: clamp(24px, 5vw, 60px);
  font-weight: 900;
  letter-spacing: 0.12em;
  line-height: 1.1;
  text-align: center;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.skip-computer-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.82);
  border-radius: 0;
  background: var(--brand-hover);
  box-shadow:
    0 8px 20px rgba(0, 19, 50, 0.28),
    inset 0 0 0 1px rgba(255, 255, 255, 0.2);
  font-size: var(--text-sm);
  font-weight: 900;
  letter-spacing: 0.04em;
}

.skip-computer-button__icon {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  stroke-width: 2.6;
}

.turn-countdown {
  position: absolute;
  z-index: 44;
  left: 14px;
  bottom: 18px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  border: 0;
  border-radius: 0;
  padding: 8px 13px;
  color: white;
  background: transparent;
  box-shadow: none;
  font-size: var(--text-sm);
  font-weight: 700;
  letter-spacing: 0.04em;
}

.turn-countdown__hourglass {
  position: relative;
  display: inline-block;
  width: 18px;
  height: 24px;
  flex: 0 0 auto;
  border-top: 2px solid #facc15;
  border-bottom: 2px solid #facc15;
  animation: turn-hourglass-spin 4s cubic-bezier(0.65, 0, 0.35, 1) infinite;
}

.turn-countdown__hourglass::before,
.turn-countdown__hourglass::after {
  position: absolute;
  left: 50%;
  width: 0;
  height: 0;
  content: "";
  transform: translateX(-50%);
}

.turn-countdown__hourglass::before {
  top: 3px;
  border-right: 7px solid transparent;
  border-left: 7px solid transparent;
  border-top: 8px solid rgba(250, 204, 21, 0.95);
}

.turn-countdown__hourglass::after {
  bottom: 3px;
  border-right: 7px solid transparent;
  border-left: 7px solid transparent;
  border-bottom: 8px solid rgba(250, 204, 21, 0.45);
}

.skip-computer-button {
  position: absolute;
  z-index: 46;
  right: 18px;
  bottom: 92px;
  min-height: 40px;
  padding: 9px 16px;
  font-size: 13px;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;
}

@keyframes turn-hourglass-spin {
  0%,
  38% {
    transform: rotate(0deg);
  }

  50%,
  88% {
    transform: rotate(180deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

@media (max-width: 767px) {
  .turn-countdown {
    left: 6px;
    bottom: 6px;
    gap: 5px;
    min-height: 28px;
    padding: 3px 7px;
    font-size: 11px;
  }

  .turn-countdown__hourglass {
    width: 10px;
    height: 14px;
    border-top-width: 1px;
    border-bottom-width: 1px;
  }

  .turn-countdown__hourglass::before {
    top: 2px;
    border-right-width: 4px;
    border-left-width: 4px;
    border-top-width: 5px;
  }

  .turn-countdown__hourglass::after {
    bottom: 2px;
    border-right-width: 4px;
    border-left-width: 4px;
    border-bottom-width: 5px;
  }
}

.skip-computer-button:hover {
  border-color: rgba(255, 255, 255, 0.95);
  background: var(--brand-hover);
  box-shadow:
    0 10px 24px rgba(0, 19, 50, 0.34),
    inset 0 0 0 1px rgba(255, 255, 255, 0.32);
  transform: translateY(-1px);
}

.skip-computer-button:active {
  border-color: var(--brand-active);
  background: var(--brand-active);
  transform: translateY(1px);
}

.skip-computer-button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 5px var(--brand-focus);
}

.skip-computer-button:disabled {
  color: white;
  border-color: transparent;
  background: rgba(160, 166, 179, 0.62);
  box-shadow: none;
  cursor: not-allowed;
  transform: none;
}

.skip-settlement-overlay {
  position: absolute;
  z-index: 70;
  inset: 0;
  display: grid;
  place-items: center;
  color: white;
  background: rgba(0, 19, 50, 0.64);
  backdrop-filter: blur(6px);
  font-size: var(--text-lg);
  font-weight: 900;
  letter-spacing: 0.04em;
  pointer-events: auto;
}

@media (orientation: landscape), (min-width: 768px) {
  .game-stage {
    display: block;
  }
}
</style>
