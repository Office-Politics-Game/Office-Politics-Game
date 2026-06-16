<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import gameTableBackgroundUrl from '@/assets/images/bg-game-table.webp'
import gameLogoUrl from '@/assets/images/logo-en-white.png'
import { useAudioSettings } from '@/composables/UseAudioSettings'
import CardDrawAnimation from './CardDrawAnimation.vue'
import CardPlayAnimation from './CardPlayAnimation.vue'
import GameSettingsIcon from './GameSettingsIcon.vue'
import GameSettingsModal from './GameSettingsModal.vue'
import PlayerHand from './PlayerHand.vue'
import PlayerSeats from './PlayerSeats.vue'
import RotateDeviceNotice from './RotateDeviceNotice.vue'
import TableCardPiles from './TableCardPiles.vue'
import TurnStatus from './TurnStatus.vue'

const props = defineProps({
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
  deckCount: {
    type: [Number, String],
    required: true,
  },
  discardCard: {
    type: Object,
    required: true,
  },
  players: {
    type: Array,
    required: true,
  },
  handCards: {
    type: Array,
    required: true,
    validator: (cards) =>
      cards.every(
        (card) =>
          typeof card?.id === 'string' &&
          typeof card?.name === 'string' &&
          typeof card?.backgroundUrl === 'string' &&
          typeof card?.frameUrl === 'string',
      ),
  },
  drawCard: {
    type: Object,
    default: null,
    validator: (card) =>
      card === null ||
      (typeof card?.id === 'string' &&
        typeof card?.name === 'string' &&
        typeof card?.backgroundUrl === 'string' &&
        typeof card?.frameUrl === 'string'),
  },
})

const emit = defineEmits(['return-lobby', 'restart-game', 'draw-complete'])
const isSettingsOpen = ref(false)
const isDrawAnimating = ref(false)
const activeDrawCard = ref(null)
const tableCardPilesRef = ref(null)
const playerHand = ref(null)
const cardDrawAnimation = ref(null)
const handCards = ref([])
const discardCards = ref([])
const activeCard = ref(null)
const originRect = ref(null)
const dragPoint = ref(null)
const playZoneRect = ref(null)
const discardRect = ref(null)
const hasCommittedDiscard = ref(false)
const draggingCardId = ref(null)
const isDragging = ref(false)
const isOverPlayZone = ref(false)
const playTicket = ref(0)
let pointerMoveHandler = null
let pointerUpHandler = null

const {
  musicEnabled,
  musicVolume,
  soundEnabled,
  soundVolume,
  setMusicEnabled,
  setMusicVolume,
  setSoundEnabled,
  setSoundVolume,
} = useAudioSettings()

const hasActivePlay = computed(() => Boolean(activeCard.value && originRect.value))

function openSettings() {
  isSettingsOpen.value = true
}

function closeSettings() {
  isSettingsOpen.value = false
}

function handleReturnLobby() {
  emit('return-lobby')
}

function handleRestartGame() {
  emit('restart-game')
}

async function playDrawAnimation() {
  if (isDrawAnimating.value || !props.drawCard) {
    return
  }

  isDrawAnimating.value = true
  activeDrawCard.value = { ...props.drawCard }
  playerHand.value?.prepareDrawTarget()
  await nextTick()

  const startRect = tableCardPilesRef.value?.getDeckRect()
  const targetRect = playerHand.value?.getDrawTargetRect()

  if (!startRect || !targetRect) {
    playerHand.value?.finishDraw()
    activeDrawCard.value = null
    isDrawAnimating.value = false
    return
  }

  try {
    await cardDrawAnimation.value?.play({
      startRect,
      targetRect,
      onLanded: () => emit('draw-complete', activeDrawCard.value),
    })
    await nextTick()
  } finally {
    playerHand.value?.finishDraw()
    activeDrawCard.value = null
    isDrawAnimating.value = false
  }
}

function refreshDiscardRect() {
  discardRect.value = tableCardPilesRef.value?.getDiscardRect?.() ?? null
}

function refreshPlayZoneRect() {
  playZoneRect.value = tableCardPilesRef.value?.getPlayZoneRect?.() ?? null
}

function pointInsideRect(point, rect) {
  if (!point || !rect) {
    return false
  }

  return (
    point.x >= rect.left &&
    point.x <= rect.left + rect.width &&
    point.y >= rect.top &&
    point.y <= rect.top + rect.height
  )
}

function clearPointerListeners() {
  if (pointerMoveHandler) {
    window.removeEventListener('pointermove', pointerMoveHandler)
    pointerMoveHandler = null
  }

  if (pointerUpHandler) {
    window.removeEventListener('pointerup', pointerUpHandler)
    window.removeEventListener('pointercancel', pointerUpHandler)
    pointerUpHandler = null
  }
}

function resetInteraction() {
  clearPointerListeners()
  activeCard.value = null
  originRect.value = null
  dragPoint.value = null
  playZoneRect.value = null
  discardRect.value = null
  hasCommittedDiscard.value = false
  draggingCardId.value = null
  isDragging.value = false
  isOverPlayZone.value = false
}

function handleWindowPointerMove(event) {
  if (!hasActivePlay.value) {
    return
  }

  dragPoint.value = {
    x: event.clientX,
    y: event.clientY,
  }

  refreshPlayZoneRect()
  isOverPlayZone.value = pointInsideRect(dragPoint.value, playZoneRect.value)
}

function handleWindowPointerUp(event) {
  if (!hasActivePlay.value) {
    resetInteraction()
    return
  }

  dragPoint.value = {
    x: event.clientX,
    y: event.clientY,
  }

  refreshPlayZoneRect()
  isOverPlayZone.value = pointInsideRect(dragPoint.value, playZoneRect.value)
  isDragging.value = false
  clearPointerListeners()

  if (isOverPlayZone.value) {
    playTicket.value += 1
    return
  }

  resetInteraction()
}

function handleCardPointerDown(card, event) {
  if (activeCard.value) {
    return
  }

  const cardElement = event.currentTarget
  if (!cardElement?.getBoundingClientRect) {
    return
  }

  event.preventDefault()
  event.stopPropagation()

  activeCard.value = card
  draggingCardId.value = card.id
  originRect.value = cardElement.getBoundingClientRect()
  dragPoint.value = {
    x: event.clientX,
    y: event.clientY,
  }
  refreshDiscardRect()
  refreshPlayZoneRect()
  isDragging.value = true
  isOverPlayZone.value = pointInsideRect(dragPoint.value, playZoneRect.value)

  pointerMoveHandler = handleWindowPointerMove
  pointerUpHandler = handleWindowPointerUp
  window.addEventListener('pointermove', pointerMoveHandler, { passive: true })
  window.addEventListener('pointerup', pointerUpHandler)
  window.addEventListener('pointercancel', pointerUpHandler)

  if (typeof cardElement.setPointerCapture === 'function') {
    try {
      cardElement.setPointerCapture(event.pointerId)
    } catch {
      // Pointer capture is a best-effort improvement only.
    }
  }
}

function handleAnimationFinished() {
  if (!activeCard.value) {
    resetInteraction()
    return
  }

  if (!hasCommittedDiscard.value) {
    handleCardArrived()
  }

  resetInteraction()
}

function handleCardArrived() {
  if (!activeCard.value || hasCommittedDiscard.value) {
    return
  }

  hasCommittedDiscard.value = true
  discardCards.value = [...discardCards.value, activeCard.value]
  handCards.value = handCards.value.filter((card) => card.id !== activeCard.value.id)
}

watch(
  () => props.handCards,
  (cards) => {
    if (!activeCard.value) {
      handCards.value = [...cards]
    }
  },
  { immediate: true, deep: true },
)

watch(
  () => props.discardCard,
  (card) => {
    if (!activeCard.value) {
      discardCards.value = [card]
    }
  },
  { immediate: true, deep: true },
)

onBeforeUnmount(() => {
  clearPointerListeners()
})

defineExpose({
  playDrawAnimation,
})
</script>

<template>
  <main class="relative min-h-[100dvh] w-full overflow-hidden bg-[var(--brand-navy)]">
    <section
      class="game-stage relative hidden h-[100dvh] w-[100dvw] overflow-hidden bg-cover bg-center bg-no-repeat"
      :style="{ backgroundImage: `url(${gameTableBackgroundUrl})` }"
      aria-label="Office Politics 遊戲舞台"
    >
      <PlayerSeats :players="players" />

      <div
        class="turn-controls absolute top-[clamp(20px,6vh,40px)] left-[clamp(16px,2.6vw,40px)]"
      >
        <TurnStatus
          :round-number="roundNumber"
          :current-phase="currentPhase"
          :current-step="currentStep"
        />
      </div>

      <div
        class="game-brand-tools absolute top-[clamp(16px,5vh,36px)] right-[clamp(10px,2.5vw,40px)] flex items-center gap-[clamp(8px,1.2vw,16px)]"
      >
        <img
          :src="gameLogoUrl"
          alt="Office Politics"
          class="block h-auto w-[clamp(104px,11vw,150px)] select-none object-contain drop-shadow-[0_3px_10px_rgba(0,19,50,0.48)]"
          draggable="false"
        />
        <GameSettingsIcon @open="openSettings" />
      </div>

      <div class="table-card-piles absolute top-[42%] left-1/2 -translate-x-1/2">
        <TableCardPiles
          ref="tableCardPilesRef"
          :deck-count="deckCount"
          :discard-cards="discardCards"
          :is-draw-disabled="isDrawAnimating || !drawCard"
          :is-drop-target-active="isOverPlayZone && hasActivePlay"
          @draw="playDrawAnimation"
        />
      </div>

      <div class="absolute bottom-[-34px] left-1/2 z-20 -translate-x-1/2">
        <PlayerHand
          ref="playerHand"
          :cards="handCards"
          :dragging-card-id="draggingCardId"
          @card-pointerdown="handleCardPointerDown"
        />
      </div>

      <CardDrawAnimation
        ref="cardDrawAnimation"
        :card="activeDrawCard"
      />

      <CardPlayAnimation
        :active-card="activeCard"
        :origin-rect="originRect"
        :drag-point="dragPoint"
        :discard-rect="discardRect"
        :is-dragging="isDragging"
        :is-over-play-zone="isOverPlayZone"
        :play-ticket="playTicket"
        @card-arrived="handleCardArrived"
        @animation-finished="handleAnimationFinished"
      />
    </section>

    <GameSettingsModal
      :is-open="isSettingsOpen"
      :music-enabled="musicEnabled"
      :music-volume="musicVolume"
      :sound-enabled="soundEnabled"
      :sound-volume="soundVolume"
      @close="closeSettings"
      @update:music-enabled="setMusicEnabled"
      @update:music-volume="setMusicVolume"
      @update:sound-enabled="setSoundEnabled"
      @update:sound-volume="setSoundVolume"
      @return-lobby="handleReturnLobby"
      @restart-game="handleRestartGame"
    />

    <RotateDeviceNotice />
  </main>
</template>

<style scoped>
@media (orientation: landscape), (min-width: 768px) {
  .game-stage {
    display: block;
  }
}

@media (max-height: 480px) {
  .turn-controls {
    top: 10px;
  }

  .game-brand-tools {
    top: 10px;
  }

  .table-card-piles {
    top: 35%;
  }
}
</style>
