<script setup>
import { computed, ref } from "vue";
import cardBackUrl from "@/assets/images/card-bg-back.webp";
import PlayerAvatar from "./PlayerAvatar.vue";

const props = defineProps({
  players: {
    type: Array,
    required: true,
    validator: (players) => {
      const positions = ["top", "left", "right", "bottom"];

      return (
        players.length === 4 &&
        players.every(
          (player) =>
            typeof player?.id === "string" &&
            typeof player?.name === "string" &&
            typeof player?.avatarUrl === "string" &&
            Number.isInteger(player?.roundWins) &&
            player?.roundWins >= 0 &&
            player?.roundWins <= 3 &&
            (player?.level === undefined ||
              typeof player?.level === "number" ||
              typeof player?.level === "string") &&
            positions.includes(player?.position) &&
            typeof player?.isCurrentPlayer === "boolean" &&
            (player?.isTurnPlayer === undefined ||
              typeof player?.isTurnPlayer === "boolean"),
        )
      );
    },
  },
  dealtPlayerIds: {
    type: Array,
    default: () => [],
    validator: (playerIds) =>
      playerIds.every((playerId) => typeof playerId === "string"),
  },
  playerHandCardCounts: {
    type: Object,
    default: () => ({}),
    validator: (counts) =>
      Object.values(counts).every(
        (count) => Number.isInteger(count) && count >= 0,
      ),
  },
  isTargetSelectionActive: {
    type: Boolean,
    default: false,
  },
  selectablePlayerIds: {
    type: Array,
    default: () => [],
    validator: (playerIds) =>
      playerIds.every((playerId) => typeof playerId === "string"),
  },
  selectedTargetPlayerId: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(['target-select'])
const seatElements = ref({});
const handTargetElements = ref({});
const dealtPlayerIdSet = computed(() => new Set(props.dealtPlayerIds));
const selectablePlayerIdSet = computed(() => new Set(props.selectablePlayerIds));

const positionClasses = {
  top: "top-[48px] left-1/2 -translate-x-1/2 lg:top-28",
  left: "top-[42%] left-3 -translate-y-1/2 lg:left-7",
  right: "top-[42%] right-3 -translate-y-1/2 lg:right-7",
  bottom:
    "bottom-3 left-[calc(50%-220px)] lg:bottom-10 lg:left-[calc(50%-400px)]",
};

function setSeatElement(playerId, element) {
  if (!playerId) {
    return;
  }

  if (element) {
    seatElements.value[playerId] = element;
    return;
  }

  delete seatElements.value[playerId];
}

function setHandTargetElement(playerId, element) {
  if (!playerId) {
    return;
  }

  if (element) {
    handTargetElements.value[playerId] = element;
    return;
  }

  delete handTargetElements.value[playerId];
}

function getHandTargetRect(playerId) {
  return handTargetElements.value[playerId]?.getBoundingClientRect() ?? null;
}

function getHandCardCount(playerId) {
  if (Number.isInteger(props.playerHandCardCounts[playerId])) {
    return props.playerHandCardCounts[playerId];
  }

  return dealtPlayerIdSet.value.has(playerId) ? 1 : 0;
}

function getHandCardBacks(playerId) {
  const count = getHandCardCount(playerId);
  const visibleCount = Math.min(count, 4);
  const center = (visibleCount - 1) / 2;

  return Array.from({ length: visibleCount }, (_, index) => ({
    id: `${playerId}-hand-card-${index}`,
    offset: `${(index - center) * 9}px`,
    rotation: `${(index - center) * 7}deg`,
    zIndex: index + 1,
  }));
}

function isSelectableTarget(playerId) {
  return (
    props.isTargetSelectionActive && selectablePlayerIdSet.value.has(playerId)
  );
}

function isSelectedTarget(playerId) {
  return props.selectedTargetPlayerId === playerId;
}

function handleTargetSelect(player) {
  if (!isSelectableTarget(player.id)) {
    return;
  }

  emit('target-select', player.id);
}

defineExpose({
  getSeatRect(playerId) {
    return seatElements.value[playerId]?.getBoundingClientRect() ?? null;
  },
  getHandTargetRect,
});
</script>

<template>
  <div
    class="player-seats pointer-events-none absolute inset-0 z-10"
    :class="{ 'player-seats--target-selection-active': isTargetSelectionActive }"
    aria-label="玩家座位"
  >
    <div
      v-for="player in players"
      :key="player.id"
      :ref="(element) => setSeatElement(player.id, element)"
      class="player-seats__seat absolute"
      :class="[
        positionClasses[player.position],
        {
          'player-seats__seat--target-selectable': isSelectableTarget(player.id),
          'player-seats__seat--target-selected': isSelectedTarget(player.id),
        },
      ]"
    >
      <PlayerAvatar
        :name="player.name"
        :avatar-url="player.avatarUrl"
        :round-wins="player.roundWins"
        :level="player.level"
        :is-current-player="player.isCurrentPlayer"
        :is-turn-player="player.isTurnPlayer"
        :is-mirrored="player.position === 'right'"
      />

      <button
        v-if="isTargetSelectionActive"
        type="button"
        class="player-seats__target-button"
        :class="{
          'player-seats__target-button--selectable': isSelectableTarget(player.id),
          'player-seats__target-button--selected': isSelectedTarget(player.id),
        }"
        :disabled="!isSelectableTarget(player.id)"
        :aria-label="`指定 ${player.name}`"
        :aria-pressed="isSelectedTarget(player.id)"
        @click="handleTargetSelect(player)"
      ></button>

      <div
        v-if="player.position !== 'bottom'"
        :ref="(element) => setHandTargetElement(player.id, element)"
        class="player-seat-hand-target pointer-events-none absolute aspect-[3/4] h-[clamp(62px,10vh,92px)]"
        :class="`player-seat-hand-target--${player.position}`"
        aria-hidden="true"
      >
        <img
          v-for="cardBack in getHandCardBacks(player.id)"
          :key="cardBack.id"
          :src="cardBackUrl"
          alt=""
          class="player-seat-hand-target__card block size-full select-none object-contain"
          :style="{
            '--hand-card-offset': cardBack.offset,
            '--hand-card-rotation': cardBack.rotation,
            zIndex: cardBack.zIndex,
          }"
          draggable="false"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.player-seats__seat {
  position: absolute;
  isolation: isolate;
}

.player-seat-hand-target {
  z-index: 0;
  filter: drop-shadow(0 8px 12px rgba(0, 19, 50, 0.34));
}

.player-seat-hand-target__card {
  position: absolute;
  inset: 0;
}

.player-seat-hand-target--top {
  top: calc(100% + clamp(8px, 1.5vh, 14px));
  left: 50%;
  transform: translateX(-50%);
}

.player-seat-hand-target--left {
  top: 50%;
  left: calc(100% + clamp(8px, 1vw, 14px));
  transform: translateY(-50%);
}

.player-seat-hand-target--right {
  top: 50%;
  right: calc(100% + clamp(8px, 1vw, 14px));
  transform: translateY(-50%);
}

.player-seat-hand-target--top .player-seat-hand-target__card {
  transform:
    translateX(var(--hand-card-offset))
    rotate(calc(180deg - var(--hand-card-rotation)));
}

.player-seat-hand-target--left .player-seat-hand-target__card {
  transform:
    translateY(var(--hand-card-offset))
    rotate(calc(90deg + var(--hand-card-rotation)));
}

.player-seat-hand-target--right .player-seat-hand-target__card {
  transform:
    translateY(var(--hand-card-offset))
    rotate(calc(-90deg - var(--hand-card-rotation)));
}

@media (max-height: 480px) {
  .player-seat-hand-target {
    height: 54px;
  }
}

.player-seats--target-selection-active {
  z-index: 46;
}

.player-seats__target-button {
  position: absolute;
  inset: -10px -14px;
  z-index: 30;
  border: 0;
  border-radius: 8px;
  padding: 0;
  cursor: not-allowed;
  background: transparent;
  opacity: 0;
  pointer-events: auto;
}

.player-seats__target-button--selectable {
  cursor: pointer;
}

.player-seats__seat--target-selectable {
  pointer-events: auto;
}

.player-seats__seat--target-selectable :deep(.player-avatar__frame) {
  animation: target-choice-pulse 1.08s ease-in-out infinite;
  border-color: #facc15;
  box-shadow:
    0 0 0 5px rgba(250, 204, 21, 0.22),
    0 0 28px rgba(250, 204, 21, 0.68),
    0 7px 20px rgba(0, 19, 50, 0.36);
}

.player-seats__seat--target-selectable :deep(.player-avatar__info) {
  box-shadow:
    inset 0 0 0 1px rgba(250, 204, 21, 0.54),
    0 0 22px rgba(250, 204, 21, 0.28);
}

.player-seats__seat--target-selectable:hover :deep(.player-avatar__frame),
.player-seats__seat--target-selected :deep(.player-avatar__frame) {
  border-color: #ffffff;
  box-shadow:
    0 0 0 7px rgba(250, 204, 21, 0.3),
    0 0 38px rgba(250, 204, 21, 0.82),
    0 0 58px rgba(255, 255, 255, 0.34),
    0 7px 20px rgba(0, 19, 50, 0.36);
}

.player-seats__seat--target-selected :deep(.player-avatar__info) {
  background: linear-gradient(
    90deg,
    rgba(161, 98, 7, 0.9) 0%,
    rgba(202, 138, 4, 0.74) 44%,
    rgba(15, 23, 42, 0.08) 100%
  );
  box-shadow:
    inset 0 0 0 2px rgba(255, 255, 255, 0.82),
    0 0 28px rgba(250, 204, 21, 0.44);
}

.player-seats__seat--target-selected :deep(.player-avatar__info--mirrored) {
  background: linear-gradient(
    270deg,
    rgba(161, 98, 7, 0.9) 0%,
    rgba(202, 138, 4, 0.74) 52%,
    rgba(15, 23, 42, 0.08) 100%
  );
}

.player-seats__seat--target-selected :deep(.player-avatar__frame img) {
  filter: hue-rotate(18deg) saturate(1.35) brightness(1.16);
}

@keyframes target-choice-pulse {
  0%,
  100% {
    box-shadow:
      0 0 0 4px rgba(250, 204, 21, 0.18),
      0 0 24px rgba(250, 204, 21, 0.48),
      0 7px 20px rgba(0, 19, 50, 0.36);
  }

  50% {
    box-shadow:
      0 0 0 10px rgba(250, 204, 21, 0.28),
      0 0 44px rgba(250, 204, 21, 0.82),
      0 7px 20px rgba(0, 19, 50, 0.36);
  }
}
</style>
