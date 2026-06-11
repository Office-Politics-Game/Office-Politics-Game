<script setup>
import { ref } from 'vue'
import gameTableBackgroundUrl from '@/assets/BG_GameTable.jpg'
import gameLogoUrl from '@/assets/LOGO_En_W.png'
import { useAudioSettings } from '@/composables/UseAudioSettings'
import GameSettingsIcon from './GameSettingsIcon.vue'
import GameSettingsModal from './GameSettingsModal.vue'
import PlayerHand from './PlayerHand.vue'
import PlayerSeats from './PlayerSeats.vue'
import RotateDeviceNotice from './RotateDeviceNotice.vue'
import TurnStatus from './TurnStatus.vue'

defineProps({
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
  discardCard: {
    type: Object,
    required: true,
  },
  players: {
    type: Array,
    required: true,
  },
  handCards: {
    type: Array,
    required: true,
    validator: (cards) =>
      cards.every(
        (card) =>
          typeof card?.id === 'string' &&
          typeof card?.name === 'string' &&
          typeof card?.backgroundUrl === 'string' &&
          typeof card?.frameUrl === 'string',
      ),
  },
})

const emit = defineEmits(['return-lobby', 'restart-game'])
const isSettingsOpen = ref(false)
const {
  musicEnabled,
  musicVolume,
  soundEnabled,
  soundVolume,
  setMusicEnabled,
  setMusicVolume,
  setSoundEnabled,
  setSoundVolume,
} = useAudioSettings()

function openSettings() {
  isSettingsOpen.value = true
}

function closeSettings() {
  isSettingsOpen.value = false
}

function handleReturnLobby() {
  emit('return-lobby')
}

function handleRestartGame() {
  emit('restart-game')
}
</script>

<template>
  <main class="relative min-h-[100dvh] w-full overflow-hidden bg-[var(--brand-navy)]">
    <section
      class="game-stage relative hidden h-[100dvh] w-[100dvw] overflow-hidden bg-cover bg-center bg-no-repeat"
      :style="{ backgroundImage: `url(${gameTableBackgroundUrl})` }"
      aria-label="Office Politics 遊戲桌"
    >
      <PlayerSeats :players="players" />

      <div class="absolute top-[clamp(20px,6vh,40px)] left-[clamp(16px,2.6vw,40px)]">
        <TurnStatus
          :round-number="roundNumber"
          :current-phase="currentPhase"
          :current-step="currentStep"
        />
      </div>

      <div
        class="game-brand-tools absolute top-[clamp(16px,5vh,36px)] right-[clamp(10px,2.5vw,40px)] flex items-center gap-[clamp(8px,1.2vw,16px)]"
      >
        <img
          :src="gameLogoUrl"
          alt="Office Politics"
          class="block h-auto w-[clamp(104px,11vw,150px)] select-none object-contain drop-shadow-[0_3px_10px_rgba(0,19,50,0.48)]"
          draggable="false"
        />
        <GameSettingsIcon @open="openSettings" />
      </div>

      <div class="table-card-piles absolute top-[42%] left-1/2 -translate-x-1/2">
        <TableCardPiles :deck-count="deckCount" :discard-card="discardCard" />
      </div>

      <div class="absolute bottom-[-34px] left-1/2 z-20 -translate-x-1/2">
        <PlayerHand :cards="handCards" />
      </div>
    </section>

    <GameSettingsModal
      :is-open="isSettingsOpen"
      :music-enabled="musicEnabled"
      :music-volume="musicVolume"
      :sound-enabled="soundEnabled"
      :sound-volume="soundVolume"
      @close="closeSettings"
      @update:music-enabled="setMusicEnabled"
      @update:music-volume="setMusicVolume"
      @update:sound-enabled="setSoundEnabled"
      @update:sound-volume="setSoundVolume"
      @return-lobby="handleReturnLobby"
      @restart-game="handleRestartGame"
    />

    <RotateDeviceNotice />
  </main>
</template>

<style scoped>
@media (orientation: landscape), (min-width: 768px) {
  .game-stage {
    display: block;
  }
}

@media (max-height: 480px) {
  .game-brand-tools {
    top: 10px;
  }

  .table-card-piles {
    top: 35%;
  }
}
</style>
