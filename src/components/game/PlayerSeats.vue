<script setup>
import { computed, ref } from 'vue'
import cardBackUrl from '@/assets/images/card-bg-back.webp'
import PlayerAvatar from './PlayerAvatar.vue'

const props = defineProps({
  players: {
    type: Array,
    required: true,
    validator: (players) => {
      const positions = ['top', 'left', 'right', 'bottom']

      return (
        players.length === 4 &&
        players.every(
          (player) =>
            typeof player?.id === 'string' &&
            typeof player?.name === 'string' &&
            typeof player?.avatarUrl === 'string' &&
            Number.isInteger(player?.roundWins) &&
            player?.roundWins >= 0 &&
            player?.roundWins <= 3 &&
            positions.includes(player?.position) &&
            typeof player?.isCurrentPlayer === 'boolean',
        )
      )
    },
  },
  dealtPlayerIds: {
    type: Array,
    default: () => [],
    validator: (playerIds) =>
      playerIds.every((playerId) => typeof playerId === 'string'),
  },
  playerHandCardCounts: {
    type: Object,
    default: () => ({}),
    validator: (counts) =>
      Object.values(counts).every(
        (count) => Number.isInteger(count) && count >= 0,
      ),
  },
})

const seatElements = ref({})
const handTargetElements = ref({})
const dealtPlayerIdSet = computed(() => new Set(props.dealtPlayerIds))

const positionClasses = {
  top: 'player-seats__seat--top',
  left: 'player-seats__seat--left',
  right: 'player-seats__seat--right',
  bottom: 'player-seats__seat--bottom',
}

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
  if (!playerId) {
    return
  }

  if (element) {
    handTargetElements.value[playerId] = element
    return
  }

  delete handTargetElements.value[playerId]
}

function getHandTargetRect(playerId) {
  return handTargetElements.value[playerId]?.getBoundingClientRect() ?? null
}

function getHandCardCount(playerId) {
  if (Number.isInteger(props.playerHandCardCounts[playerId])) {
    return props.playerHandCardCounts[playerId]
  }

  return dealtPlayerIdSet.value.has(playerId) ? 1 : 0
}

function getHandCardBacks(playerId) {
  const count = getHandCardCount(playerId)
  const visibleCount = Math.min(count, 4)
  const center = (visibleCount - 1) / 2

  return Array.from({ length: visibleCount }, (_, index) => ({
    id: `${playerId}-hand-card-${index}`,
    offset: `${(index - center) * 9}px`,
    rotation: `${(index - center) * 7}deg`,
    zIndex: index + 1,
  }))
}

defineExpose({
  getSeatRect(playerId) {
    return seatElements.value[playerId]?.getBoundingClientRect() ?? null
  },
  getHandTargetRect,
})
</script>

<template>
  <div class="player-seats pointer-events-none absolute inset-0 z-10" aria-label="玩家座位">
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
        :is-current-player="player.isCurrentPlayer"
      />

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

.player-seats__seat--top {
  top: clamp(62px, 8vh, 84px);
  left: 50%;
  transform: translateX(-50%);
}

.player-seats__seat--left {
  top: 50%;
  left: clamp(10px, 2.2vw, 34px);
  transform: translateY(-50%);
}

.player-seats__seat--right {
  top: 50%;
  right: clamp(10px, 2.2vw, 34px);
  transform: translateY(-50%);
}

.player-seats__seat--right :deep(.player-avatar) {
  flex-direction: row-reverse;
}

.player-seats__seat--right :deep(.player-avatar__info) {
  border-right: 2px solid rgba(255, 255, 255, 0.72);
  border-left: 0;
  text-align: right;
}

.player-seats__seat--right :deep(.player-avatar--current .player-avatar__info) {
  border-right-color: var(--brand-hover);
}

.player-seats__seat--right :deep(.player-avatar--winner .player-avatar__info) {
  border-right-color: var(--winner-gold);
}

.player-seats__seat--right :deep(.player-avatar__winner-label) {
  right: auto;
  left: 0;
}

.player-seats__seat--right :deep(.player-avatar__info > div) {
  justify-content: flex-end;
}

.player-seats__seat--bottom {
  bottom: clamp(8px, 2vh, 22px);
  left: clamp(18px, 18vw, 260px);
}

@media (max-height: 480px) {
  .player-seat-hand-target {
    height: 54px;
  }

  .player-seats__seat--top {
    top: 28px;
  }

  .player-seats__seat--bottom {
    bottom: 10px;
    left: clamp(10px, 15vw, 130px);
  }

  .player-seats__seat--left {
    left: 8px;
  }

  .player-seats__seat--right {
    right: 8px;
  }
}
</style>
