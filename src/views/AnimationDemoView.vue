<script setup>
import { nextTick, ref } from 'vue'
import advisorBackgroundUrl from '@/assets/images/card-bg-advisor.webp'
import advisorFrameUrl from '@/assets/images/card-frame-advisor.webp'
import ceoBackgroundUrl from '@/assets/images/card-bg-ceo.webp'
import ceoFrameUrl from '@/assets/images/card-frame-ceo.webp'
import gameTableBackgroundUrl from '@/assets/images/bg-game-table.webp'
import playerOneUrl from '@/assets/images/player-1.png'
import playerTwoUrl from '@/assets/images/player-2.png'
import playerThreeUrl from '@/assets/images/player-3.png'
import playerFourUrl from '@/assets/images/player-4.png'
import EnemyCardPlayAnimation from '@/components/game/EnemyCardPlayAnimation.vue'
import PlayerSeats from '@/components/game/PlayerSeats.vue'
import TableCardPiles from '@/components/game/TableCardPiles.vue'

const tableCardPilesRef = ref(null)
const playerSeatsRef = ref(null)
const discardCards = ref([
  {
    id: 'discard-demo-base',
    name: '執行長',
    backgroundUrl: ceoBackgroundUrl,
    frameUrl: ceoFrameUrl,
  },
])

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
    name: '左方對手',
    avatarUrl: playerThreeUrl,
    roundWins: 0,
    position: 'left',
    isCurrentPlayer: false,
  },
  {
    id: 'player-right',
    name: '右方對手',
    avatarUrl: playerFourUrl,
    roundWins: 1,
    position: 'right',
    isCurrentPlayer: false,
  },
  {
    id: 'player-bottom',
    name: '目前玩家',
    avatarUrl: playerOneUrl,
    roundWins: 2,
    position: 'bottom',
    isCurrentPlayer: true,
  },
]

const previewCards = {
  'player-top': {
    id: 'enemy-demo-top-ceo',
    name: '執行長',
    backgroundUrl: ceoBackgroundUrl,
    frameUrl: ceoFrameUrl,
  },
  'player-left': {
    id: 'enemy-demo-left-advisor',
    name: '資深顧問',
    backgroundUrl: advisorBackgroundUrl,
    frameUrl: advisorFrameUrl,
  },
  'player-right': {
    id: 'enemy-demo-right-ceo',
    name: '執行長',
    backgroundUrl: ceoBackgroundUrl,
    frameUrl: ceoFrameUrl,
  },
}

const activeCard = ref(null)
const originRect = ref(null)
const discardRect = ref(null)
const playTicket = ref(0)
const pendingCard = ref(null)

function createEnemyOriginRect(playerId) {
  const seatRect = playerSeatsRef.value?.getSeatRect?.(playerId)
  const currentDiscardRect = tableCardPilesRef.value?.getDiscardRect?.()
  if (!seatRect || !currentDiscardRect) {
    return null
  }

  return {
    left: seatRect.left + seatRect.width / 2 - currentDiscardRect.width / 2,
    top: seatRect.top + seatRect.height / 2 - currentDiscardRect.height / 2,
    width: currentDiscardRect.width,
    height: currentDiscardRect.height,
  }
}

async function triggerEnemyPlay(playerId) {
  if (activeCard.value) {
    return
  }

  await nextTick()

  const nextOriginRect = createEnemyOriginRect(playerId)
  const nextDiscardRect = tableCardPilesRef.value?.getDiscardRect?.()
  const card = previewCards[playerId]

  if (!nextOriginRect || !nextDiscardRect || !card) {
    return
  }

  activeCard.value = card
  pendingCard.value = card
  originRect.value = nextOriginRect
  discardRect.value = nextDiscardRect
  playTicket.value += 1
}

function handleCardLanded() {
  if (!pendingCard.value) {
    return
  }

  discardCards.value = [
    ...discardCards.value,
    {
      ...pendingCard.value,
      id: `${pendingCard.value.id}-${playTicket.value}`,
    },
  ]
}

function handleAnimationFinished() {
  activeCard.value = null
  originRect.value = null
  discardRect.value = null
  pendingCard.value = null
}
</script>

<template>
  <main class="relative min-h-screen overflow-hidden bg-[var(--brand-navy)]">
    <section
      class="relative h-screen w-screen overflow-hidden bg-cover bg-center bg-no-repeat"
      :style="{ backgroundImage: `url(${gameTableBackgroundUrl})` }"
      aria-label="Enemy play animation demo"
    >
      <div class="absolute left-4 top-4 z-30 flex gap-2">
        <button
          type="button"
          class="rounded bg-white/92 px-3 py-2 text-sm font-semibold text-slate-900 shadow"
          @click="triggerEnemyPlay('player-top')"
        >
          上方敵方出牌
        </button>
        <button
          type="button"
          class="rounded bg-white/92 px-3 py-2 text-sm font-semibold text-slate-900 shadow"
          @click="triggerEnemyPlay('player-left')"
        >
          左方敵方出牌
        </button>
        <button
          type="button"
          class="rounded bg-white/92 px-3 py-2 text-sm font-semibold text-slate-900 shadow"
          @click="triggerEnemyPlay('player-right')"
        >
          右方敵方出牌
        </button>
      </div>

      <PlayerSeats ref="playerSeatsRef" :players="players" />

      <div class="absolute left-1/2 top-[42%] -translate-x-1/2">
        <TableCardPiles
          ref="tableCardPilesRef"
          :deck-count="28"
          :discard-cards="discardCards"
          :is-drop-target-active="false"
        />
      </div>

      <EnemyCardPlayAnimation
        :active-card="activeCard"
        :origin-rect="originRect"
        :discard-rect="discardRect"
        :play-ticket="playTicket"
        @card-landed="handleCardLanded"
        @animation-finished="handleAnimationFinished"
      />
    </section>
  </main>
</template>
