<script setup>
import { computed, reactive } from 'vue'
import advisorBackgroundUrl from '@/assets/CardBGAdvisor.png'
import advisorHandBackgroundUrl from '@/assets/CardBG_Advisor@2x.png'
import advisorFrameUrl from '@/assets/CardFrame_Advisor@2x.png'
import ceoBackgroundUrl from '@/assets/CardBG_CEO@2x.png'
import ceoFrameUrl from '@/assets/CardFrame_CEO@2x.png'
import playerOneUrl from '@/assets/Player_1.png'
import playerTwoUrl from '@/assets/Player_2.png'
import playerThreeUrl from '@/assets/Player_3.png'
import playerFourUrl from '@/assets/Player_4.png'
import GameStage from '@/components/game/GameStage.vue'
import {
  createMockGameState,
  drawMockCard,
} from '@/mocks/mockGameState.js'

const turnStatus = {
  roundNumber: 2,
  currentPhase: '輪到你',
  currentStep: '抽牌',
}

const cardPiles = {
  discardCard: {
    name: '資深顧問',
    backgroundUrl: advisorBackgroundUrl,
    frameUrl: advisorFrameUrl,
  },
}

const cardAssets = {
  ceo: {
    backgroundUrl: ceoBackgroundUrl,
    frameUrl: ceoFrameUrl,
  },
  advisor: {
    backgroundUrl: advisorHandBackgroundUrl,
    frameUrl: advisorFrameUrl,
  },
}

const gameState = reactive(createMockGameState())
const deckCount = computed(() => gameState.deck.length)
const handCards = computed(() =>
  gameState.currentPlayer.hand.map(resolveCardAssets),
)
const drawCard = computed(() => {
  if (gameState.currentPlayer.hand.length >= 2) {
    return null
  }

  const nextCard = gameState.deck.at(-1)
  return nextCard ? resolveCardAssets(nextCard) : null
})

function resolveCardAssets(card) {
  const background = cardAssets[card.backgroundUrlKey]
  const frame = cardAssets[card.frameUrlKey]

  return {
    ...card,
    backgroundUrl: background.backgroundUrl,
    frameUrl: frame.frameUrl,
  }
}

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

function handleDrawComplete(card) {
  drawMockCard(gameState, card.id)
}
</script>

<template>
  <GameStage
    :round-number="turnStatus.roundNumber"
    :current-phase="turnStatus.currentPhase"
    :current-step="turnStatus.currentStep"
    :deck-count="deckCount"
    :discard-card="cardPiles.discardCard"
    :players="players"
    :hand-cards="handCards"
    :draw-card="drawCard"
    @draw-complete="handleDrawComplete"
    @return-lobby="handleReturnLobby"
    @restart-game="handleRestartGame"
  />
</template>
