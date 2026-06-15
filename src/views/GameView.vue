<script setup>
import advisorBackgroundUrl from '@/assets/images/card-bg-advisor.webp'
import advisorHandBackgroundUrl from '@/assets/images/card-bg-advisor.webp'
import advisorFrameUrl from '@/assets/images/card-frame-advisor.webp'
import ceoBackgroundUrl from '@/assets/images/card-bg-ceo.webp'
import ceoFrameUrl from '@/assets/images/card-frame-ceo.webp'
import playerOneUrl from '@/assets/images/player-1.png'
import playerTwoUrl from '@/assets/images/player-2.png'
import playerThreeUrl from '@/assets/images/player-3.png'
import playerFourUrl from '@/assets/images/player-4.png'
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

const handCards = [
  {
    id: 'hand-ceo',
    name: 'CEO',
    backgroundUrl: ceoBackgroundUrl,
    frameUrl: ceoFrameUrl,
  },
  {
    id: 'hand-advisor',
    name: '資深顧問',
    backgroundUrl: advisorHandBackgroundUrl,
    frameUrl: advisorFrameUrl,
  },
]

const players = [
  {
    id: 'player-top',
    name: '摸魚大師',
    avatarUrl: playerTwoUrl,
    roundWins: 3,
    position: 'top',
    isCurrentPlayer: false,
  },
  {
    id: 'player-left',
    name: '小菜雞',
    avatarUrl: playerThreeUrl,
    roundWins: 0,
    position: 'left',
    isCurrentPlayer: false,
  },
  {
    id: 'player-right',
    name: '豬隊666',
    avatarUrl: playerFourUrl,
    roundWins: 1,
    position: 'right',
    isCurrentPlayer: false,
  },
  {
    id: 'player-bottom',
    name: '薪水小偷',
    avatarUrl: playerOneUrl,
    roundWins: 2,
    position: 'bottom',
    isCurrentPlayer: true,
  },
]

function handleReturnLobby() {
  // Reserved for the future multiplayer-aware lobby transition.
}

function handleRestartGame() {
  // Reserved for the future multiplayer-aware restart flow.
}
</script>

<template>
  <GameStage
    :round-number="turnStatus.roundNumber"
    :current-phase="turnStatus.currentPhase"
    :current-step="turnStatus.currentStep"
    :deck-count="cardPiles.deckCount"
    :discard-card="cardPiles.discardCard"
    :players="players"
    :hand-cards="handCards"
    @return-lobby="handleReturnLobby"
    @restart-game="handleRestartGame"
  />
</template>
