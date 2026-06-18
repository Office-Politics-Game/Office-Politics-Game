<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { gsap } from 'gsap'
import gameTableBackgroundUrl from '@/assets/images/bg-game-table.webp'
import gameLogoUrl from '@/assets/images/logo-en-white.png'
import { useAudioSettings } from '@/composables/UseAudioSettings'
import CardDrawAnimation from './CardDrawAnimation.vue'
import GameCard from './GameCard.vue'
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
const playOverlayEl = ref(null)
const playTrailEl = ref(null)
const playBurstEl = ref(null)
const playShowcaseEl = ref(null)
const playStage = ref('idle')
const playOverlayStyle = ref({ display: 'none' })
const playTrailStyle = ref({ display: 'none' })
const playBurstStyle = ref({ display: 'none' })
const playShowcaseStyle = ref({ display: 'none' })
let pointerMoveHandler = null
let pointerUpHandler = null
let playTimeline = null
let landingTweens = []

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

function rectToFixedStyle(rect) {
  return {
    display: 'block',
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  }
}

function lerp(start, end, progress) {
  return start + (end - start) * progress
}

function getQuadraticPoint(start, control, end, progress) {
  const inv = 1 - progress

  return {
    x: inv * inv * start.x + 2 * inv * progress * control.x + progress * progress * end.x,
    y: inv * inv * start.y + 2 * inv * progress * control.y + progress * progress * end.y,
  }
}

function resetPlayLayer() {
  playStage.value = 'idle'
  playOverlayStyle.value = { display: 'none' }
  playTrailStyle.value = { display: 'none' }
  playBurstStyle.value = { display: 'none' }
  playShowcaseStyle.value = { display: 'none' }
}

function getPlayAnimationElements() {
  return [
    playOverlayEl.value,
    playTrailEl.value,
    playBurstEl.value,
    playShowcaseEl.value,
  ].filter(Boolean)
}

function stopPlayAnimation() {
  playTimeline?.kill()
  playTimeline = null
  landingTweens.forEach((tween) => tween.kill())
  landingTweens = []

  const activeElements = getPlayAnimationElements()
  if (activeElements.length > 0) {
    gsap.killTweensOf(activeElements)
  }
}

function trackLandingTween(tween) {
  landingTweens.push(tween)
  return tween
}

function updatePlayDragLayer() {
  if (!hasActivePlay.value || !originRect.value || !dragPoint.value || playStage.value !== 'dragging') {
    return
  }

  const translateX = dragPoint.value.x - (originRect.value.left + originRect.value.width / 2)
  const translateY = dragPoint.value.y - (originRect.value.top + originRect.value.height / 2)
  const dragScale = isOverPlayZone.value ? 1.06 : 1

  playOverlayStyle.value = {
    ...rectToFixedStyle(originRect.value),
    transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${dragScale}) rotate(0deg)`,
  }
}

async function animatePlayCard() {
  if (!hasActivePlay.value || !originRect.value || !discardRect.value) {
    return
  }

  stopPlayAnimation()
  playStage.value = 'playing'
  await nextTick()

  if (!playOverlayEl.value || !playTrailEl.value || !playBurstEl.value || !playShowcaseEl.value) {
    resetPlayLayer()
    return
  }

  const origin = originRect.value
  const discard = discardRect.value
  const startX = dragPoint.value ? dragPoint.value.x - (origin.left + origin.width / 2) : 0
  const startY = dragPoint.value ? dragPoint.value.y - (origin.top + origin.height / 2) : 0
  const targetX = discard.left - origin.left
  const targetY = discard.top - origin.top
  const dx = targetX - startX
  const dy = targetY - startY
  const travelDirection = Math.sign(dx || dy || 1)
  const liftHeight = Math.max(origin.height * 0.32, 72)
  const finalRotation = 2
  const finalRotationX = 58
  const showcaseScale = Math.min(1.88, Math.max(1.52, window.innerHeight * 0.42 / origin.height))
  const showcaseX = window.innerWidth / 2 - origin.left - origin.width / 2
  const showcaseY = window.innerHeight / 2 - origin.top - origin.height / 2

  playOverlayStyle.value = rectToFixedStyle(origin)
  playTrailStyle.value = rectToFixedStyle(origin)
  playBurstStyle.value = {
    display: 'block',
    left: `${discard.left}px`,
    top: `${discard.top}px`,
    width: `${discard.width}px`,
    height: `${discard.height}px`,
  }
  playShowcaseStyle.value = {
    display: 'block',
    left: `${window.innerWidth / 2}px`,
    top: `${window.innerHeight / 2}px`,
  }

  gsap.set(playOverlayEl.value, {
    x: targetX,
    y: targetY,
    scaleX: 1,
    scaleY: 1,
    rotation: finalRotation,
    rotationX: finalRotationX,
    rotationY: 0,
    transformPerspective: 900,
    transformOrigin: '50% 100%',
    opacity: 1,
    zIndex: 76,
  })
  const baseFinalRect = playOverlayEl.value.getBoundingClientRect()
  const settleScale = discard.height / baseFinalRect.height

  gsap.set(playOverlayEl.value, {
    x: targetX,
    y: targetY,
    scaleX: settleScale,
    scaleY: settleScale,
    rotation: finalRotation,
    rotationX: finalRotationX,
    rotationY: 0,
  })
  const scaledFinalRect = playOverlayEl.value.getBoundingClientRect()
  const settleTargetX = targetX + discard.left - scaledFinalRect.left
  const settleTargetY = targetY + discard.top - scaledFinalRect.top

  gsap.set(playOverlayEl.value, {
    x: startX,
    y: startY,
    scaleX: 1.02,
    scaleY: 1.02,
    rotation: -2,
    rotationX: -4,
    rotationY: 0,
    transformOrigin: '50% 100%',
  })
  gsap.set(playTrailEl.value, {
    x: 0,
    y: 0,
    opacity: 0,
    display: 'block',
  })
  gsap.set(playBurstEl.value, {
    opacity: 0,
    scale: 0.35,
    display: 'block',
  })
  gsap.set(playShowcaseEl.value, {
    opacity: 0,
    scale: 0.45,
    rotation: 0,
    display: 'block',
  })

  const startPoint = { x: showcaseX, y: showcaseY }
  const liftPoint = {
    x: showcaseX + (settleTargetX - showcaseX) * 0.42,
    y: Math.min(showcaseY, settleTargetY) - liftHeight,
  }
  const flyPoint = {
    x: settleTargetX,
    y: settleTargetY - Math.max(origin.height * 0.42, 92),
  }
  const landPoint = {
    x: settleTargetX,
    y: settleTargetY + 2,
  }
  const motion = { t: 0 }
  const trailMotion = { t: 0 }

  function cleanup() {
    landingTweens = []
    playTimeline = null
    handleAnimationFinished()
    resetPlayLayer()
  }

  function runLandingAnimation() {
    if (!playOverlayEl.value || !playTrailEl.value || !playBurstEl.value || playStage.value !== 'playing') {
      cleanup()
      return
    }

    motion.t = 0
    trailMotion.t = 0

    trackLandingTween(gsap.to(motion, {
      t: 1,
      duration: 0.92,
      ease: 'power2.in',
      onUpdate: () => {
        if (!playOverlayEl.value || playStage.value !== 'playing') {
          return
        }

        const p = motion.t
        const point = p < 0.38
          ? getQuadraticPoint(startPoint, liftPoint, flyPoint, p / 0.38)
          : getQuadraticPoint(flyPoint, flyPoint, landPoint, (p - 0.38) / 0.62)
        const liftBoost = p < 0.38 ? p / 0.38 : 1
        const dropBoost = p > 0.82 ? (p - 0.82) / 0.18 : 0
        const settleBoost = Math.max(0, Math.min((p - 0.62) / 0.38, 1))
        const scaleX = p < 0.62
          ? lerp(1.16, 1.02, liftBoost)
          : lerp(1.02, settleScale, settleBoost)
        const scaleY = p < 0.62
          ? (p < 0.38 ? lerp(1.3, 1.12, liftBoost) : lerp(1.12, 1, dropBoost))
          : lerp(1, settleScale, settleBoost)
        const rotation = p < 0.62
          ? (p < 0.5
              ? lerp(travelDirection * 12, travelDirection * 4, Math.min(p / 0.5, 1))
              : lerp(travelDirection * 4, 2, (p - 0.5) / 0.2))
          : 2

        gsap.set(playOverlayEl.value, {
          x: point.x,
          y: point.y,
          scaleX,
          scaleY,
          rotation,
          rotationX: p < 0.62 ? -12 * (1 - Math.min(p / 0.5, 1)) : 58,
        })
      },
      onComplete: () => {
        if (!playOverlayEl.value || !playTrailEl.value || !playBurstEl.value || playStage.value !== 'playing') {
          cleanup()
          return
        }

        trackLandingTween(gsap.to(playBurstEl.value, {
          opacity: 1,
          scale: 1.3,
          duration: 0.1,
          ease: 'power2.out',
        }))
        trackLandingTween(gsap.to(playOverlayEl.value, {
          x: settleTargetX + travelDirection * 4,
          y: settleTargetY + 4,
          scaleX: settleScale * 1.02,
          scaleY: settleScale * 0.92,
          rotation: travelDirection * 10,
          rotationX: -34,
          rotationY: 0,
          duration: 0.08,
          ease: 'power2.out',
        }))
        trackLandingTween(gsap.to(playOverlayEl.value, {
          x: settleTargetX,
          y: settleTargetY,
          scaleX: settleScale,
          scaleY: settleScale,
          rotation: finalRotation,
          rotationX: finalRotationX,
          rotationY: 0,
          duration: 0.18,
          ease: 'power2.out',
          onComplete: () => {
            handleCardArrived()
            trackLandingTween(gsap.to(playOverlayEl.value, {
              opacity: 0,
              duration: 0.04,
              ease: 'power1.out',
            }))
          },
        }))
        trackLandingTween(gsap.to(playBurstEl.value, {
          opacity: 0,
          scale: 1.45,
          duration: 0.16,
          ease: 'power2.out',
        }))
        trackLandingTween(gsap.to(playTrailEl.value, {
          opacity: 0,
          duration: 0.12,
          ease: 'power1.out',
          onComplete: cleanup,
        }))
      },
    }))

    trackLandingTween(gsap.to(trailMotion, {
      t: 1,
      duration: 0.92,
      ease: 'power2.in',
      onUpdate: () => {
        if (!playTrailEl.value || playStage.value !== 'playing') {
          return
        }

        const p = trailMotion.t
        const point = p < 0.38
          ? getQuadraticPoint(startPoint, liftPoint, flyPoint, p / 0.38)
          : getQuadraticPoint(flyPoint, flyPoint, landPoint, (p - 0.38) / 0.62)
        const fadeIn = p < 0.18 ? p / 0.18 : 1
        const fadeOut = p > 0.8 ? 1 - (p - 0.8) / 0.2 : 1

        gsap.set(playTrailEl.value, {
          x: point.x,
          y: point.y,
          scale: lerp(1.02, 1.08, Math.min(p / 0.45, 1)),
          opacity: 0.58 * Math.min(fadeIn, fadeOut),
        })
      },
    }))
  }

  playTimeline = gsap.timeline({
    onInterrupt: () => {
      playTimeline = null
    },
  })

  playTimeline
    .to(playOverlayEl.value, {
      x: showcaseX,
      y: showcaseY,
      scaleX: showcaseScale,
      scaleY: showcaseScale,
      rotation: 0,
      rotationX: 0,
      transformOrigin: '50% 50%',
      duration: 0.28,
      ease: 'power3.out',
    })
    .to(playShowcaseEl.value, {
      opacity: 1,
      scale: 1,
      duration: 0.16,
      ease: 'power2.out',
    }, '<')
    .to(playOverlayEl.value, {
      scaleX: showcaseScale * 1.08,
      scaleY: showcaseScale * 1.08,
      duration: 0.18,
      ease: 'power1.inOut',
    })
    .to(playOverlayEl.value, {
      scaleX: showcaseScale,
      scaleY: showcaseScale,
      duration: 0.16,
      ease: 'power1.out',
    })
    .to({}, { duration: 2 })
    .to(playShowcaseEl.value, {
      opacity: 0,
      scale: 1.22,
      duration: 0.18,
      ease: 'power2.out',
    }, '<')
    .set(playOverlayEl.value, {
      transformOrigin: '50% 100%',
    }, '<')
    .call(runLandingAnimation, null, '<')
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
  () => [activeCard.value, originRect.value, dragPoint.value, isDragging.value],
  () => {
    if (!hasActivePlay.value) {
      stopPlayAnimation()
      resetPlayLayer()
      return
    }

    if (playStage.value === 'playing') {
      return
    }

    if (isDragging.value) {
      playStage.value = 'dragging'
      updatePlayDragLayer()
      return
    }

    if (playStage.value === 'dragging') {
      updatePlayDragLayer()
    }
  },
  { immediate: true, deep: true },
)

watch(
  () => isOverPlayZone.value,
  () => {
    if (playStage.value === 'dragging') {
      updatePlayDragLayer()
    }
  },
)

watch(
  () => playTicket.value,
  () => {
    animatePlayCard()
  },
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
  stopPlayAnimation()
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

      <Teleport to="body">
        <div
          v-if="hasActivePlay"
          ref="playTrailEl"
          class="card-play-trail fixed pointer-events-none"
          :style="playTrailStyle"
          aria-hidden="true"
        >
          <GameCard
            :name="activeCard.name"
            :background-url="activeCard.backgroundUrl"
            :frame-url="activeCard.frameUrl"
          />
        </div>

        <div
          v-if="hasActivePlay"
          ref="playBurstEl"
          class="card-play-burst fixed pointer-events-none"
          :style="playBurstStyle"
          aria-hidden="true"
        ></div>

        <div
          v-if="hasActivePlay"
          ref="playShowcaseEl"
          class="card-play-showcase fixed pointer-events-none"
          :style="playShowcaseStyle"
          aria-hidden="true"
        ></div>

        <div
          v-if="hasActivePlay"
          ref="playOverlayEl"
          class="card-play-layer fixed pointer-events-none"
          :class="{ 'card-play-layer--active': isOverPlayZone || playStage === 'playing' }"
          :style="playOverlayStyle"
          aria-hidden="true"
        >
          <div class="card-play-layer__glow"></div>
          <GameCard
            :name="activeCard.name"
            :background-url="activeCard.backgroundUrl"
            :frame-url="activeCard.frameUrl"
          />
        </div>
      </Teleport>
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
.card-play-layer {
  will-change: transform, opacity;
  transform-origin: 50% 50%;
  perspective: 900px;
  filter: drop-shadow(0 18px 28px rgba(0, 19, 50, 0.42));
}

.card-play-trail {
  z-index: 75;
  will-change: transform, opacity;
  transform-origin: 50% 50%;
  filter: blur(7px) saturate(1.12);
  opacity: 0;
}

.card-play-layer__glow {
  position: absolute;
  inset: -12%;
  border-radius: 18px;
  background:
    radial-gradient(circle at 50% 44%, rgba(255, 255, 255, 0.5), transparent 38%),
    radial-gradient(circle at 50% 50%, rgba(107, 184, 212, 0.55), transparent 64%);
  filter: blur(14px);
  opacity: 0;
  transform: scale(0.82);
  transition:
    opacity 0.14s ease,
    transform 0.14s ease;
}

.card-play-layer--active .card-play-layer__glow {
  opacity: 1;
  transform: scale(1);
}

.card-play-burst {
  z-index: 74;
  border-radius: 999px;
  background:
    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0.28) 14%, transparent 52%),
    radial-gradient(circle at 50% 50%, rgba(107, 184, 212, 1), rgba(107, 184, 212, 0.1) 38%, transparent 74%);
  filter: blur(12px);
  mix-blend-mode: screen;
  transform-origin: 50% 50%;
}

.card-play-showcase {
  z-index: 73;
  width: min(58vmin, 520px);
  aspect-ratio: 1;
  border-radius: 999px;
  background:
    radial-gradient(circle, rgba(255, 255, 255, 0.9) 0 5%, transparent 22%),
    radial-gradient(circle, rgba(107, 184, 212, 0.92) 0 18%, rgba(107, 184, 212, 0.24) 42%, transparent 68%);
  filter: blur(14px);
  mix-blend-mode: screen;
  transform: translate(-50%, -50%);
  transform-origin: 50% 50%;
}

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
