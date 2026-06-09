<script setup>
import gameTableBackgroundUrl from '@/assets/BG_GameTable.jpg'
import GameSettingsIcon from './GameSettingsIcon.vue'
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
})
</script>

<template>
  <main class="relative min-h-[100dvh] w-full overflow-hidden bg-[var(--brand-navy)]">
    <section
      class="game-stage relative hidden h-[100dvh] w-[100dvw] overflow-hidden bg-cover bg-center bg-no-repeat"
      :style="{ backgroundImage: `url(${gameTableBackgroundUrl})` }"
      aria-label="Office Politics 遊戲桌"
    >
      <div class="absolute top-[clamp(20px,6vh,40px)] left-[clamp(16px,2.6vw,40px)]">
        <TurnStatus
          :round-number="roundNumber"
          :current-phase="currentPhase"
          :current-step="currentStep"
        />
      </div>

      <div class="absolute top-[clamp(20px,6vh,40px)] right-[clamp(18px,2.5vw,40px)]">
        <GameSettingsIcon />
      </div>
    </section>

    <RotateDeviceNotice />
  </main>
</template>

<style scoped>
@media (orientation: landscape), (min-width: 768px) {
  .game-stage {
    display: block;
  }
}
</style>
