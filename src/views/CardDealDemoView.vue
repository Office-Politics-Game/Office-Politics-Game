<script setup>
import { nextTick, onBeforeUnmount, ref } from 'vue'
import advisorBackgroundUrl from '@/assets/images/card-bg-advisor.webp'
import advisorFrameUrl from '@/assets/images/card-frame-advisor.webp'
import ceoBackgroundUrl from '@/assets/images/card-bg-ceo.webp'
import ceoFrameUrl from '@/assets/images/card-frame-ceo.webp'
import gameLogoUrl from '@/assets/images/logo-en-white.png'
import gameTableBackgroundUrl from '@/assets/images/bg-game-table.webp'
import playerOneUrl from '@/assets/images/player-1.png'
import playerTwoUrl from '@/assets/images/player-2.png'
import playerThreeUrl from '@/assets/images/player-3.png'
import playerFourUrl from '@/assets/images/player-4.png'
import CardDealAnimation from '@/components/game/animations/CardDealAnimation.vue'
import PlayerHand from '@/components/game/ui/PlayerHand.vue'
import PlayerSeats from '@/components/game/ui/PlayerSeats.vue'
import RotateDeviceNotice from '@/components/game/ui/RotateDeviceNotice.vue'
import TableCardPiles from '@/components/game/ui/TableCardPiles.vue'

const INITIAL_DECK_COUNT = 28
const DEAL_ORDER = ['bottom', 'left', 'top', 'right']
const DEAL_ROTATIONS = {
  bottom: 0,
  left: 90,
  top: 180,
  right: -90,
}

const tableCardPiles = ref(null)
const playerSeats = ref(null)
const playerHand = ref(null)
const dealAnimation = ref(null)
const deckCount = ref(INITIAL_DECK_COUNT)
const dealtPlayerIds = ref([])
const handCards = ref([])
const isDealing = ref(false)
const hasCompletedDeal = ref(false)
const statusMessage = ref('按下按鈕開始發牌')

const discardCard = {
  name: '資深顧問',
  backgroundUrl: advisorBackgroundUrl,
  frameUrl: advisorFrameUrl,
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

const cardsByPosition = {
  bottom: {
    id: 'deal-bottom-ceo',
    name: 'CEO',
    backgroundUrl: ceoBackgroundUrl,
    frameUrl: ceoFrameUrl,
  },
  left: {
    id: 'deal-left-advisor',
    name: '顧問',
    backgroundUrl: advisorBackgroundUrl,
    frameUrl: advisorFrameUrl,
  },
  top: {
    id: 'deal-top-ceo',
    name: 'CEO',
    backgroundUrl: ceoBackgroundUrl,
    frameUrl: ceoFrameUrl,
  },
  right: {
    id: 'deal-right-advisor',
    name: '顧問',
    backgroundUrl: advisorBackgroundUrl,
    frameUrl: advisorFrameUrl,
  },
}

function resetDealState() {
  dealAnimation.value?.cancel()
  deckCount.value = INITIAL_DECK_COUNT
  dealtPlayerIds.value = []
  handCards.value = []
  hasCompletedDeal.value = false
  statusMessage.value = '準備發牌'
}

function getTargetRect(player) {
  if (player.position === 'bottom') {
    return playerHand.value?.getDealTargetRect() ?? null
  }

  return playerSeats.value?.getHandTargetRect(player.id) ?? null
}

function createDeals() {
  return DEAL_ORDER.map((position) => {
    const player = players.find((candidate) => candidate.position === position)
    const targetRect = player ? getTargetRect(player) : null

    if (!player || !targetRect) {
      return null
    }

    return {
      playerId: player.id,
      position,
      card: cardsByPosition[position],
      targetRect,
      rotation: DEAL_ROTATIONS[position],
    }
  })
}

async function playDeal() {
  if (isDealing.value) {
    return
  }

  resetDealState()
  await nextTick()

  const startRect = tableCardPiles.value?.getDeckRect() ?? null
  const deals = createDeals()

  if (!startRect || deals.some((deal) => !deal)) {
    statusMessage.value = '無法取得完整的發牌位置，請調整視窗後重試'
    return
  }

  isDealing.value = true
  statusMessage.value = '發牌中'

  try {
    await dealAnimation.value?.play({
      startRect,
      deals,
      onCardStart: () => {
        deckCount.value -= 1
      },
      onCardLanded: (deal) => {
        dealtPlayerIds.value = [
          ...dealtPlayerIds.value,
          deal.playerId,
        ]

        if (deal.position === 'bottom') {
          handCards.value = [{ ...deal.card }]
        }
      },
    })

    hasCompletedDeal.value = dealtPlayerIds.value.length === deals.length
    statusMessage.value = hasCompletedDeal.value
      ? '發牌完成：每位玩家各一張'
      : '發牌已中止'
  } finally {
    isDealing.value = false
  }
}

onBeforeUnmount(() => {
  dealAnimation.value?.cancel()
})
</script>

<template>
  <main class="relative min-h-[100dvh] w-full overflow-hidden bg-[var(--brand-navy)]">
    <section
      class="game-stage relative hidden h-[100dvh] w-[100dvw] overflow-hidden bg-cover bg-center bg-no-repeat"
      :style="{ backgroundImage: `url(${gameTableBackgroundUrl})` }"
      aria-label="發牌動畫展示桌"
    >
      <div
        class="deal-controls absolute top-[clamp(10px,2.5vh,24px)] left-[clamp(10px,2vw,28px)] z-30 border border-white/60 bg-[rgba(0,19,50,0.78)] p-3 shadow-[0_12px_28px_rgba(0,19,50,0.32)] backdrop-blur-[8px]"
      >
        <button
          type="button"
          class="deal-button min-h-12 min-w-36 border border-white/80 bg-[var(--surface-glass)] px-[22px] py-3 text-[var(--text-sm)] font-bold tracking-[0.04em] text-[var(--brand-navy)] shadow-[var(--shadow)] transition-[transform,background,color,box-shadow,border-color] duration-[180ms] ease-out hover:-translate-y-px hover:border-[var(--brand-hover)] hover:bg-[var(--brand-hover)] hover:text-white active:translate-y-px active:border-[var(--brand-active)] active:bg-[var(--brand-active)] active:text-white focus-visible:outline-none focus-visible:ring-[5px] focus-visible:ring-[var(--brand-focus)] disabled:cursor-not-allowed disabled:border-transparent disabled:bg-[rgba(160,166,179,0.62)] disabled:text-white disabled:shadow-none"
          :disabled="isDealing"
          @click="playDeal"
        >
          {{ hasCompletedDeal ? '重新發牌' : '開始發牌' }}
        </button>
        <p
          class="m-0 mt-2 max-w-56 text-[var(--text-xs)] font-semibold leading-[1.65] text-white"
          aria-live="polite"
        >
          {{ statusMessage }}
        </p>
      </div>

      <img
        :src="gameLogoUrl"
        alt="Office Politics"
        class="absolute top-[clamp(14px,3vh,28px)] right-[clamp(10px,2.5vw,40px)] z-20 block h-auto w-[clamp(104px,11vw,150px)] select-none object-contain drop-shadow-[0_3px_10px_rgba(0,19,50,0.48)]"
        draggable="false"
      />

      <PlayerSeats
        ref="playerSeats"
        :players="players"
        :dealt-player-ids="dealtPlayerIds"
      />

      <div class="absolute top-[42%] left-1/2 -translate-x-1/2">
        <TableCardPiles
          ref="tableCardPiles"
          :deck-count="deckCount"
          :discard-card="discardCard"
          :is-draw-disabled="true"
        />
      </div>

      <div class="absolute bottom-[-34px] left-1/2 z-20 -translate-x-1/2">
        <PlayerHand
          ref="playerHand"
          :cards="handCards"
        />
      </div>

      <CardDealAnimation ref="dealAnimation" />
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

@media (max-width: 767px) {
  .deal-controls {
    right: 10px;
  }

  .deal-button {
    width: 100%;
  }
}

@media (max-height: 480px) {
  .deal-controls {
    top: 8px;
    padding: 8px;
  }

  .deal-button {
    min-height: 40px;
    padding: 8px 14px;
  }
}
</style>
