<script setup>
import advisorBackgroundUrl from '@/assets/CardBGAdvisor.png'
import advisorFrameUrl from '@/assets/CardFrame_Advisor@2x.png'
import GameStage from '@/components/game/GameStage.vue'

const turnStatus = {
  roundNumber: 2,
  currentPhase: '輪到你',
  currentStep: '抽牌',
}

const cardPiles = {
  deckCount: 28,
  discardCard: {
    name: '資深顧問',
    backgroundUrl: advisorBackgroundUrl,
    frameUrl: advisorFrameUrl,
  },
}
</script>

<template>
  <GameStage
    :round-number="turnStatus.roundNumber"
    :current-phase="turnStatus.currentPhase"
    :current-step="turnStatus.currentStep"
    :deck-count="cardPiles.deckCount"
    :discard-card="cardPiles.discardCard"
  />
</template>
