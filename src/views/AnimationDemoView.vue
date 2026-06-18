<script setup>
import { ref } from 'vue'
import ceoBackgroundUrl from '@/assets/images/card-bg-ceo.webp'
import ceoFrameUrl from '@/assets/images/card-frame-ceo.webp'
import gameTableBackgroundUrl from '@/assets/images/bg-game-table.webp'
import playerOneUrl from '@/assets/images/player-1.png'
import playerTwoUrl from '@/assets/images/player-2.png'
import playerThreeUrl from '@/assets/images/player-3.png'
import playerFourUrl from '@/assets/images/player-4.png'
import PlayerSeats from '@/components/game/PlayerSeats.vue'
import TableCardPiles from '@/components/game/TableCardPiles.vue'

const discardCards = ref([
  {
    id: 'discard-demo-base',
    name: 'CEO Pressure',
    backgroundUrl: ceoBackgroundUrl,
    frameUrl: ceoFrameUrl,
  },
])

const players = [
  {
    id: 'player-top',
    name: 'Top Player',
    avatarUrl: playerTwoUrl,
    roundWins: 3,
    position: 'top',
    isCurrentPlayer: false,
  },
  {
    id: 'player-left',
    name: 'Left Player',
    avatarUrl: playerThreeUrl,
    roundWins: 0,
    position: 'left',
    isCurrentPlayer: false,
  },
  {
    id: 'player-right',
    name: 'Right Player',
    avatarUrl: playerFourUrl,
    roundWins: 1,
    position: 'right',
    isCurrentPlayer: false,
  },
  {
    id: 'player-bottom',
    name: 'Bottom Player',
    avatarUrl: playerOneUrl,
    roundWins: 2,
    position: 'bottom',
    isCurrentPlayer: true,
  },
]
</script>

<template>
  <main class="relative min-h-screen overflow-hidden bg-[var(--brand-navy)]">
    <section
      class="relative h-screen w-screen overflow-hidden bg-cover bg-center bg-no-repeat"
      :style="{ backgroundImage: `url(${gameTableBackgroundUrl})` }"
      aria-label="Animation demo"
    >
      <PlayerSeats :players="players" />

      <div class="absolute left-1/2 top-[42%] -translate-x-1/2">
        <TableCardPiles
          :deck-count="28"
          :discard-cards="discardCards"
          :is-drop-target-active="false"
        />
      </div>
    </section>
  </main>
</template>
