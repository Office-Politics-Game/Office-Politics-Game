<script setup>
import { nextTick, ref } from 'vue'
import ceoBackgroundUrl from '@/assets/images/card-bg-ceo.webp'
import ceoFrameUrl from '@/assets/images/card-frame-ceo.webp'
import gameTableBackgroundUrl from '@/assets/images/bg-game-table.webp'
import playerOneUrl from '@/assets/images/player-1.png'
import playerTwoUrl from '@/assets/images/player-2.png'
import playerThreeUrl from '@/assets/images/player-3.png'
import playerFourUrl from '@/assets/images/player-4.png'
import CardDrawAnimation from '@/components/game/CardDrawAnimation.vue'
import GameCard from '@/components/game/GameCard.vue'
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

const opponentDrawTargets = players
  .filter((player) => player.position !== 'bottom')
  .map((player) => ({
    playerId: player.id,
    label: `${player.name} 抽牌`,
  }))

const selfInitialHandCard = {
  id: 'self-initial-hand',
  name: 'CEO Pressure',
  backgroundUrl: ceoBackgroundUrl,
  frameUrl: ceoFrameUrl,
}

const tableCardPilesRef = ref(null)
const playerSeatsRef = ref(null)
const cardDrawAnimationRef = ref(null)
const deckCount = ref(28)
const activeDrawCard = ref(null)
const isDrawAnimating = ref(false)
const opponentHandCardCounts = ref(
  Object.fromEntries(
    opponentDrawTargets.map((target) => [target.playerId, 1]),
  ),
)
let drawCount = 0

function createDemoDrawCard() {
  drawCount += 1

  return {
    id: `opponent-draw-demo-${drawCount}`,
    name: 'CEO Pressure',
    backgroundUrl: ceoBackgroundUrl,
    frameUrl: ceoFrameUrl,
  }
}

function addOpponentHandCard(playerId) {
  opponentHandCardCounts.value = {
    ...opponentHandCardCounts.value,
    [playerId]: (opponentHandCardCounts.value[playerId] ?? 0) + 1,
  }
}

async function playOpponentDrawAnimation(playerId = 'player-top') {
  if (isDrawAnimating.value || deckCount.value <= 0) {
    return
  }

  const startRect = tableCardPilesRef.value?.getDeckRect?.()
  const targetRect = playerSeatsRef.value?.getHandTargetRect?.(playerId)

  if (!startRect || !targetRect) {
    return
  }

  isDrawAnimating.value = true
  activeDrawCard.value = createDemoDrawCard()
  await nextTick()

  try {
    await cardDrawAnimationRef.value?.othersDraw({
      startRect,
      targetRect,
      onLanded: () => {
        deckCount.value -= 1
        addOpponentHandCard(playerId)
      },
    })
  } finally {
    activeDrawCard.value = null
    isDrawAnimating.value = false
  }
}
</script>

<template>
  <main class="relative min-h-screen overflow-hidden bg-[var(--brand-navy)]">
    <section
      class="relative h-screen w-screen overflow-hidden bg-cover bg-center bg-no-repeat"
      :style="{ backgroundImage: `url(${gameTableBackgroundUrl})` }"
      aria-label="Animation demo"
    >
      <section class="enemy-draw-demo__hud" aria-label="對手抽牌展示控制">
        <div>
          <p>enemycardplay_demo</p>
          <h1>對手抽牌動畫展示</h1>
        </div>

        <div class="enemy-draw-demo__actions">
          <button
            v-for="target in opponentDrawTargets"
            :key="target.playerId"
            type="button"
            :disabled="isDrawAnimating || deckCount <= 0"
            @click="playOpponentDrawAnimation(target.playerId)"
          >
            {{ target.label }}
          </button>
        </div>
      </section>

      <PlayerSeats
        ref="playerSeatsRef"
        :players="players"
        :player-hand-card-counts="opponentHandCardCounts"
      />

      <div class="absolute left-1/2 top-[42%] -translate-x-1/2">
        <TableCardPiles
          ref="tableCardPilesRef"
          :deck-count="deckCount"
          :discard-cards="discardCards"
          :is-draw-disabled="isDrawAnimating || deckCount <= 0"
          :is-drop-target-active="false"
          @draw="playOpponentDrawAnimation('player-top')"
        />
      </div>

      <section class="enemy-draw-demo__self-hand" aria-label="我方既有手牌">
        <GameCard
          :name="selfInitialHandCard.name"
          :background-url="selfInitialHandCard.backgroundUrl"
          :frame-url="selfInitialHandCard.frameUrl"
        />
      </section>

      <CardDrawAnimation
        ref="cardDrawAnimationRef"
        :card="activeDrawCard"
      />
    </section>
  </main>
</template>

<style scoped>
.enemy-draw-demo__hud {
  position: absolute;
  top: clamp(16px, 3vh, 28px);
  right: clamp(16px, 3vw, 36px);
  left: clamp(16px, 3vw, 36px);
  z-index: 30;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  pointer-events: none;
}

.enemy-draw-demo__hud p,
.enemy-draw-demo__hud h1 {
  margin: 0;
  color: white;
  text-shadow: 0 3px 12px rgba(0, 19, 50, 0.58);
}

.enemy-draw-demo__hud p {
  color: var(--brand-primary);
  font-size: var(--text-xs);
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.enemy-draw-demo__hud h1 {
  margin-top: 5px;
  font-size: var(--text-xl);
  font-weight: 900;
  line-height: 1;
}

.enemy-draw-demo__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  max-width: min(54vw, 560px);
  pointer-events: auto;
}

.enemy-draw-demo__actions button {
  min-height: 42px;
  min-width: 144px;
  border: 1px solid rgba(255, 255, 255, 0.54);
  border-radius: 0;
  padding: 10px 16px;
  cursor: pointer;
  background: var(--surface-glass);
  color: white;
  font-size: var(--text-sm);
  font-weight: 900;
  box-shadow: 0 16px 34px rgba(0, 19, 50, 0.28);
  backdrop-filter: blur(14px);
  transition:
    transform 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
}

.enemy-draw-demo__actions button:hover:not(:disabled) {
  border-color: var(--brand-hover);
  background: var(--brand-hover);
  transform: translateY(-1px);
}

.enemy-draw-demo__actions button:active:not(:disabled) {
  border-color: var(--brand-active);
  background: var(--brand-active);
  transform: translateY(1px);
}

.enemy-draw-demo__actions button:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 5px var(--brand-focus),
    0 16px 34px rgba(0, 19, 50, 0.28);
}

.enemy-draw-demo__actions button:disabled {
  cursor: not-allowed;
  border-color: transparent;
  background: rgba(160, 166, 179, 0.62);
  color: white;
  box-shadow: none;
}

.enemy-draw-demo__self-hand {
  position: absolute;
  bottom: clamp(10px, 2vh, 22px);
  left: 50%;
  z-index: 22;
  width: clamp(76px, 8vw, 126px);
  aspect-ratio: 3 / 4;
  transform: translateX(-50%) rotateZ(-3deg);
  filter: drop-shadow(0 12px 16px rgba(0, 19, 50, 0.42));
  pointer-events: none;
}

@media (max-width: 760px) {
  .enemy-draw-demo__hud {
    right: 10px;
    left: 10px;
    flex-direction: column;
  }

  .enemy-draw-demo__actions {
    width: 100%;
    max-width: none;
  }

  .enemy-draw-demo__actions button {
    width: 100%;
  }
}
</style>
