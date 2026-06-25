<script setup>
import { computed, reactive } from 'vue'
import advisorBackgroundUrl from '@/assets/images/card-bg-advisor.webp'
import advisorHandBackgroundUrl from '@/assets/images/card-bg-advisor.webp'
import advisorFrameUrl from '@/assets/images/card-frame-advisor.webp'
import ceoBackgroundUrl from '@/assets/images/card-bg-ceo.webp'
import ceoFrameUrl from '@/assets/images/card-frame-ceo.webp'
import cleanerBackgroundUrl from '@/assets/images/card-bg-cleaner.webp'
import cleanerFrameUrl from '@/assets/images/card-frame-cleaner.webp'
import internBackgroundUrl from '@/assets/images/card-bg-intern.webp'
import internFrameUrl from '@/assets/images/card-frame-intern.webp'
import pmBackgroundUrl from '@/assets/images/card-bg-pm.webp'
import pmFrameUrl from '@/assets/images/card-frame-pm.webp'
import playerOneUrl from '@/assets/images/player-1.png'
import playerTwoUrl from '@/assets/images/player-2.png'
import playerThreeUrl from '@/assets/images/player-3.png'
import playerFourUrl from '@/assets/images/player-4.png'
import GameStage from '@/components/game/GameStage.vue'
import {
  createMockGameState,
  drawMockCard,
  playMockCard,
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
  intern: {
    backgroundUrl: internBackgroundUrl,
    frameUrl: internFrameUrl,
  },
  cleaner: {
    backgroundUrl: cleanerBackgroundUrl,
    frameUrl: cleanerFrameUrl,
  },
  pm: {
    backgroundUrl: pmBackgroundUrl,
    frameUrl: pmFrameUrl,
  },
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
const currentPlayerId = computed(() => gameState.currentPlayer.id)
const drawPlayerId = computed(() => currentPlayerId.value)
const deckCount = computed(() => gameState.deck.length)
const handCards = computed(() =>
  gameState.currentPlayer.hand.map(resolveCardAssets),
)
const discardCard = computed(() => {
  const latestDiscardCard = gameState.discardPile.at(-1)

  return latestDiscardCard
    ? resolveCardAssets(latestDiscardCard)
    : cardPiles.discardCard
})
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
    level: 12,
    position: 'top',
    isCurrentPlayer: false,
  },
  {
    id: 'player-left',
    name: '小菜雞',
    avatarUrl: playerThreeUrl,
    roundWins: 0,
    level: 12,
    position: 'left',
    isCurrentPlayer: false,
  },
  {
    id: 'player-right',
    name: '豬隊666',
    avatarUrl: playerFourUrl,
    roundWins: 1,
    level: 12,
    position: 'right',
    isCurrentPlayer: false,
  },
  {
    id: 'player-bottom',
    name: '薪水小偷',
    avatarUrl: playerOneUrl,
    roundWins: 2,
    level: 12,
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

function handlePlayCard(payload) {
  playMockCard(gameState, payload)
}
</script>

<template>
  <GameStage
    :round-number="turnStatus.roundNumber"
    :current-phase="turnStatus.currentPhase"
    :current-step="turnStatus.currentStep"
    :deck-count="deckCount"
    :discard-card="discardCard"
    :players="players"
    :hand-cards="handCards"
    :draw-card="drawCard"
    :draw-player-id="drawPlayerId"
    :current-player-id="currentPlayerId"
    @draw-complete="handleDrawComplete"
    @play-card="handlePlayCard"
    @return-lobby="handleReturnLobby"
    @restart-game="handleRestartGame"
  />
</template>
