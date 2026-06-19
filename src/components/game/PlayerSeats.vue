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
            typeof player?.isCurrentPlayer === "boolean",
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
const seatElements = ref({})
const handTargetElements = ref({})
const dealtPlayerIdSet = computed(() => new Set(props.dealtPlayerIds))
const selectablePlayerIdSet = computed(() => new Set(props.selectablePlayerIds))

const positionClasses = {
  top: "top-[48px] left-1/2 -translate-x-1/2 lg:top-28",
  left: "top-[42%] left-3 -translate-y-1/2 lg:left-7",
  right: "top-[42%] right-3 -translate-y-1/2 lg:right-7",
  bottom:
    "bottom-3 left-[calc(50%-220px)] lg:bottom-10 lg:left-[calc(50%-400px)]",
};

function setSeatElement(playerId, element) {
  if (!playerId) {
    return
  }

  if (element) {
    seatElements.value[playerId] = element
    return
  }

  delete seatElements.value[playerId]
}

function setHandTargetElement(playerId, element) {
  if (element) {
    handTargetElements.value[playerId] = element;
    return;
  }

  delete handTargetElements.value[playerId];
}

function getHandTargetRect(playerId) {
  return handTargetElements.value[playerId]?.getBoundingClientRect() ?? null;
}

function isSelectableTarget(playerId) {
  return props.isTargetSelectionActive && selectablePlayerIdSet.value.has(playerId)
}

function handleTargetSelect(player) {
  if (!isSelectableTarget(player.id)) {
    return
  }

  emit('target-select', player.id)
}

defineExpose({
  getSeatRect(playerId) {
    return seatElements.value[playerId]?.getBoundingClientRect() ?? null
  },
  getHandTargetRect,
});
</script>

<template>
  <div
    class="player-seats pointer-events-none absolute inset-0 z-10"
    aria-label="玩家座位"
  >
    <div
      v-for="player in players"
      :key="player.id"
      :ref="(element) => setSeatElement(player.id, element)"
      class="player-seats__seat absolute"
      :class="positionClasses[player.position]"
    >
      <PlayerAvatar
        :name="player.name"
        :avatar-url="player.avatarUrl"
        :round-wins="player.roundWins"
        :level="player.level"
        :is-current-player="player.isCurrentPlayer"
        :is-mirrored="player.position === 'right'"
      />

      <button
        v-if="isTargetSelectionActive"
        type="button"
        class="player-seats__target-button"
        :class="{
          'player-seats__target-button--selectable': isSelectableTarget(player.id),
          'player-seats__target-button--selected': selectedTargetPlayerId === player.id,
        }"
        :disabled="!isSelectableTarget(player.id)"
        :aria-label="`指定 ${player.name}`"
        :aria-pressed="selectedTargetPlayerId === player.id"
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
          v-if="dealtPlayerIdSet.has(player.id)"
          :src="cardBackUrl"
          alt=""
          class="player-seat-hand-target__card block size-full select-none object-contain"
          draggable="false"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.player-seats__seat {
  position: absolute;
}

.player-seats__target-button {
  position: absolute;
  inset: -8px;
  z-index: 3;
  border: 2px solid transparent;
  border-radius: 999px;
  padding: 0;
  cursor: not-allowed;
  background: rgba(2, 6, 23, 0.22);
  opacity: 0.4;
  pointer-events: auto;
}

.player-seats__target-button--selectable {
  cursor: pointer;
  border-color: rgba(250, 204, 21, 0.78);
  background:
    radial-gradient(circle at 50% 50%, rgba(250, 204, 21, 0.28), transparent 64%),
    rgba(2, 6, 23, 0.08);
  box-shadow:
    0 0 0 6px rgba(250, 204, 21, 0.12),
    0 0 26px rgba(250, 204, 21, 0.34);
  opacity: 1;
}

.player-seats__target-button--selectable:hover,
.player-seats__target-button--selected {
  border-color: #ffffff;
  box-shadow:
    0 0 0 8px rgba(250, 204, 21, 0.18),
    0 0 36px rgba(250, 204, 21, 0.58);
}
</style>
