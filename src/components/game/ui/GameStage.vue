<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import gameTableBackgroundUrl from "@/assets/images/bg-game-table.webp";
import gameLogoUrl from "@/assets/images/logo-en-white.png";
import { useAudioSettings } from "@/composables/UseAudioSettings";
import { useButtonClickAudio } from "@/composables/UseButtonClickAudio";
import { useGameTableAudio } from "@/composables/UseGameTableAudio";
import { useGameStageCardPlay } from "@/composables/useGameStageCardPlay";
import { useGameStageCardVisibility } from "@/composables/useGameStageCardVisibility";
import { useGameStageDrawSequence } from "@/composables/useGameStageDrawSequence";
import { useGameStageEffectAnimation } from "@/composables/useGameStageEffectAnimation";
import { CARD_INFO_BY_RANK } from "@/constants/cardInfo";
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
import GameSettingsIcon from "./GameSettingsIcon.vue";
import GameSettingsModal from "./GameSettingsModal.vue";
import PlayerHand from "./PlayerHand.vue";
import PlayerSeats from "./PlayerSeats.vue";
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
});

const emit = defineEmits([
  "return-lobby",
  "restart-game",
  "draw-request",
  "play-card",
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
const cardDrawAnimation = ref(null);
const cardPlayAnimation = ref(null);
const cardShuffleAnimation = ref(null);
const roundShowdownAnimation = ref(null);
const roundShowdownHiddenPlayerIds = ref([]);
const activeEffectResult = ref(null);
const isInitialRoundDrawAnimating = ref(false);
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
} = useGameTutorial();

function getGameTutorialTargets() {
  return {
    deck: tableCardPilesRef.value?.getDeckElement?.() ?? null,
    hand: playerHand.value?.getHandElement?.() ?? null,
    discard: tableCardPilesRef.value?.getDiscardElement?.() ?? null,
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
    name: cardInfo.chinese,
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

let getInitialRoundDealSignature = () => null;

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
} = useGameStageNotices({
  props,
  isInitialRoundDrawAnimating,
  activeEffectResult,
  getInitialRoundDealSignature: () => getInitialRoundDealSignature(),
  lastInitialRoundDealSignature,
  playPlayerEliminatedSound,
});

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
  disposeTutorial();
  cleanupCardPlay();
  cardPlayAnimation.value?.stop?.();
  roundShowdownAnimation.value?.stop?.();
  stopEffectAnimation();
  cleanupNotices();
});

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
        />
      </TransitionGroup>

      <Transition name="protection-aura-fade">
        <ProtectionAura
          v-if="activeProtectionAnimationPlayer"
          :key="`protection-block-${activeEffectResult.id}`"
          :success-key="activeEffectResult.id"
          :show-success-label="Boolean(activeEffectResult.sourceType) && activeEffectResult.sourceType !== 'senior'"
          screen-anchored
          :position="activeProtectionAnimationPlayer.position"
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
      :duration="2400"
      @close="closeRoundWinnerNotice"
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

@media (orientation: landscape), (min-width: 768px) {
  .game-stage {
    display: block;
  }
}
</style>
