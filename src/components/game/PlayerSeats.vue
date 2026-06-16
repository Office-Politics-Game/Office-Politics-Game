<script setup>
import { ref } from 'vue'
import PlayerAvatar from './PlayerAvatar.vue'

defineProps({
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
})

const seatElements = ref({})

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

defineExpose({
  getSeatRect(playerId) {
    return seatElements.value[playerId]?.getBoundingClientRect() ?? null
  },
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
    </div>
  </div>
</template>

<style scoped>
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
