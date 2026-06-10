<script setup>
import GameStage from '@/components/game/GameStage.vue'

const turnStatus = {
  roundNumber: 2,
  currentPhase: '輪到你',
  currentStep: '抽牌',
}
</script>

<template>
  <GameStage
    :round-number="turnStatus.roundNumber"
    :current-phase="turnStatus.currentPhase"
    :current-step="turnStatus.currentStep"
  />
</template>
