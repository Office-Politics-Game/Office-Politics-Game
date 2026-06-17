<script setup>
import { nextTick, onUnmounted, ref } from 'vue'
import { gsap } from 'gsap'
import cardBackUrl from '@/assets/images/card-bg-back.webp'
import ceoBackgroundUrl from '@/assets/images/card-bg-ceo.webp'
import ceoFrameUrl from '@/assets/images/card-frame-ceo.webp'
import advisorBackgroundUrl from '@/assets/images/card-bg-advisor.webp'
import advisorFrameUrl from '@/assets/images/card-frame-advisor.webp'
import managerBackgroundUrl from '@/assets/images/card-bg-manager.webp'
import managerFrameUrl from '@/assets/images/card-frame-manager.webp'
import hrBackgroundUrl from '@/assets/images/card-bg-hr.webp'
import hrFrameUrl from '@/assets/images/card-frame-hr.webp'
import gameTableBackgroundUrl from '@/assets/images/bg-game-table.webp'
import playerOneUrl from '@/assets/images/player-1.png'
import playerTwoUrl from '@/assets/images/player-2.png'
import playerThreeUrl from '@/assets/images/player-3.png'
import playerFourUrl from '@/assets/images/player-4.png'
import CardDrawAnimation from '@/components/game/CardDrawAnimation.vue'
import GameCard from '@/components/game/GameCard.vue'
import PlayerSeats from '@/components/game/PlayerSeats.vue'
import TableCardPiles from '@/components/game/TableCardPiles.vue'

const cards = [
  {
    id: 'ceo-pressure',
    name: '執行長壓力',
    type: 'Boss',
    backgroundUrl: ceoBackgroundUrl,
    frameUrl: ceoFrameUrl,
    color: '#facc15',
  },
  {
    id: 'advisor-drop',
    name: '顧問空降',
    type: 'Tactic',
    backgroundUrl: advisorBackgroundUrl,
    frameUrl: advisorFrameUrl,
    color: '#38bdf8',
  },
  {
    id: 'manager-push',
    name: '主管加碼',
    type: 'Power',
    backgroundUrl: managerBackgroundUrl,
    frameUrl: managerFrameUrl,
    color: '#fb7185',
  },
  {
    id: 'hr-talk',
    name: '人資約談',
    type: 'Control',
    backgroundUrl: hrBackgroundUrl,
    frameUrl: hrFrameUrl,
    color: '#a78bfa',
  },
]

const players = [
  {
    id: 'player-top',
    name: '董事會代表',
    avatarUrl: playerTwoUrl,
    roundWins: 3,
    position: 'top',
    isCurrentPlayer: false,
  },
  {
    id: 'player-left',
    name: '資深同事',
    avatarUrl: playerThreeUrl,
    roundWins: 0,
    position: 'left',
    isCurrentPlayer: false,
  },
  {
    id: 'player-right',
    name: '部門主管',
    avatarUrl: playerFourUrl,
    roundWins: 1,
    position: 'right',
    isCurrentPlayer: false,
  },
  {
    id: 'player-bottom',
    name: '實習新手',
    avatarUrl: playerOneUrl,
    roundWins: 2,
    position: 'bottom',
    isCurrentPlayer: true,
  },
]

const opponentSources = [
  {
    playerId: 'player-top',
    position: 'top',
    label: '上方玩家出牌',
    card: cards[0],
  },
  {
    playerId: 'player-left',
    position: 'left',
    label: '左方玩家出牌',
    card: cards[1],
  },
  {
    playerId: 'player-right',
    position: 'right',
    label: '右方玩家出牌',
    card: cards[2],
  },
]

const initialHandCards = [
  { ...cards[3], id: 'hand-hr-talk' },
  { ...cards[0], id: 'hand-ceo-pressure' },
  { ...cards[1], id: 'hand-advisor-drop' },
  { ...cards[2], id: 'hand-manager-push' },
]

const drawDeck = [
  { ...cards[0], id: 'draw-ceo-pressure' },
  { ...cards[2], id: 'draw-manager-push' },
  { ...cards[1], id: 'draw-advisor-drop' },
  { ...cards[3], id: 'draw-hr-talk' },
]

const sourceElements = ref({})
const playerHandCards = ref([...initialHandCards])
const tableCardPilesRef = ref(null)
const drawTargetRef = ref(null)
const cardDrawAnimationRef = ref(null)
const flyingCardRef = ref(null)
const flipperRef = ref(null)
const veilRef = ref(null)
const ringRef = ref(null)
const slashRef = ref(null)
const shockwaveRef = ref(null)

const activeCard = ref(null)
const activeSourceId = ref(null)
const pendingCard = ref(null)
const activeDrawCard = ref(null)
const isPlaying = ref(false)
const isDrawAnimating = ref(false)
const draggingCard = ref(null)
const dragOriginRect = ref(null)
const dragPoint = ref(null)
const dragPreviewStyle = ref({ display: 'none' })
const isOverPlayZone = ref(false)
const drawIndex = ref(0)
const flyingStyle = ref({ display: 'none' })
const shockwaveStyle = ref({ display: 'none' })
const discardCards = ref([
  {
    ...cards[1],
    id: 'discard-start',
  },
])

let timeline = null
let pointerMoveHandler = null
let pointerUpHandler = null

function setSourceElement(sourceId, element) {
  if (element) {
    sourceElements.value[sourceId] = element
    return
  }

  delete sourceElements.value[sourceId]
}

function createFlyingRect(originRect) {
  const height = Math.min(
    Math.max(originRect.height * 2.4, 220),
    Math.min(window.innerHeight * 0.62, 420),
  )
  const width = height * 0.75
  const centerX = originRect.left + originRect.width / 2
  const centerY = originRect.top + originRect.height / 2

  return {
    left: centerX - width / 2,
    top: centerY - height / 2,
    width,
    height,
  }
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

function updateDragPreview(point) {
  if (!dragOriginRect.value) {
    return
  }

  dragPoint.value = point
  const rect = dragOriginRect.value
  const translateX = point.x - (rect.left + rect.width / 2)
  const translateY = point.y - (rect.top + rect.height / 2)
  const playZoneRect = tableCardPilesRef.value?.getPlayZoneRect?.()

  isOverPlayZone.value = pointInsideRect(point, playZoneRect)
  dragPreviewStyle.value = {
    ...rectToFixedStyle(rect),
    transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${isOverPlayZone.value ? 1.06 : 1})`,
  }
}

function resetDragState() {
  clearPointerListeners()
  draggingCard.value = null
  dragOriginRect.value = null
  dragPoint.value = null
  dragPreviewStyle.value = { display: 'none' }
  isOverPlayZone.value = false
}

function getDragReleaseRect() {
  if (!dragOriginRect.value || !dragPoint.value) {
    return null
  }

  return {
    left: dragPoint.value.x - dragOriginRect.value.width / 2,
    top: dragPoint.value.y - dragOriginRect.value.height / 2,
    width: dragOriginRect.value.width,
    height: dragOriginRect.value.height,
  }
}

function getSourceRotation(position) {
  const rotations = {
    top: -10,
    left: 8,
    right: -8,
    bottom: 5,
  }

  return rotations[position] ?? -8
}

function getNextDrawCard() {
  const template = drawDeck[drawIndex.value % drawDeck.length]
  drawIndex.value += 1

  return {
    ...template,
    id: `${template.id}-${drawIndex.value}`,
  }
}

async function playDrawAnimation() {
  if (isPlaying.value || isDrawAnimating.value || draggingCard.value) {
    return
  }

  const startRect = tableCardPilesRef.value?.getDeckRect?.()
  const targetRect = drawTargetRef.value?.getBoundingClientRect?.()

  if (!startRect || !targetRect) {
    return
  }

  isDrawAnimating.value = true
  activeDrawCard.value = getNextDrawCard()
  await nextTick()

  try {
    await cardDrawAnimationRef.value?.play({
      startRect,
      targetRect,
      onLanded: () => {
        playerHandCards.value = [...playerHandCards.value, activeDrawCard.value]
      },
    })
  } finally {
    activeDrawCard.value = null
    isDrawAnimating.value = false
  }
}

function handleHandPointerDown(card, event) {
  if (isPlaying.value || isDrawAnimating.value || draggingCard.value) {
    return
  }

  const cardElement = event.currentTarget
  if (!cardElement?.getBoundingClientRect) {
    return
  }

  event.preventDefault()
  event.stopPropagation()

  draggingCard.value = card
  activeSourceId.value = card.id
  dragOriginRect.value = cardElement.getBoundingClientRect()
  updateDragPreview({
    x: event.clientX,
    y: event.clientY,
  })

  pointerMoveHandler = (moveEvent) => {
    updateDragPreview({
      x: moveEvent.clientX,
      y: moveEvent.clientY,
    })
  }

  pointerUpHandler = (upEvent) => {
    updateDragPreview({
      x: upEvent.clientX,
      y: upEvent.clientY,
    })

    const shouldPlay = isOverPlayZone.value
    const releaseRect = getDragReleaseRect()
    resetDragState()

    if (shouldPlay && releaseRect) {
      playCard({
        sourceId: card.id,
        position: 'bottom',
        label: `Play ${card.name}`,
        card,
        faceUp: true,
        removeFromHand: true,
        originRect: releaseRect,
      })
      return
    }

    activeSourceId.value = null
  }

  window.addEventListener('pointermove', pointerMoveHandler, { passive: true })
  window.addEventListener('pointerup', pointerUpHandler)
  window.addEventListener('pointercancel', pointerUpHandler)

  if (typeof cardElement.setPointerCapture === 'function') {
    try {
      cardElement.setPointerCapture(event.pointerId)
    } catch {
      // Pointer capture is a best-effort improvement for drag continuity.
    }
  }
}

async function playCard(source) {
  if (isPlaying.value || isDrawAnimating.value) {
    return
  }

  await nextTick()

  const originEl = sourceElements.value[source.sourceId]
  const targetRect = tableCardPilesRef.value?.getDiscardRect?.()

  if ((!originEl && !source.originRect) || !targetRect) {
    return
  }

  const originRect = source.originRect ?? originEl.getBoundingClientRect()
  const flyingRect = createFlyingRect(originRect)
  const originScale = originRect.height / flyingRect.height

  timeline?.kill()
  isPlaying.value = true
  activeCard.value = source.card
  activeSourceId.value = source.sourceId
  pendingCard.value = source.card
  flyingStyle.value = rectToFixedStyle(flyingRect)
  shockwaveStyle.value = {
    display: 'block',
    left: `${targetRect.left + targetRect.width / 2}px`,
    top: `${targetRect.top + targetRect.height / 2}px`,
  }

  await nextTick()

  const flyingCenter = {
    x: flyingRect.left + flyingRect.width / 2,
    y: flyingRect.top + flyingRect.height / 2,
  }
  const targetCenter = {
    x: targetRect.left + targetRect.width / 2,
    y: targetRect.top + targetRect.height / 2,
  }
  const centerX = window.innerWidth / 2 - flyingCenter.x
  const centerY = window.innerHeight / 2 - flyingCenter.y
  const landX = targetCenter.x - flyingCenter.x
  const landY = targetCenter.y - flyingCenter.y
  const showcaseScale = Math.min(1.9, Math.max(1.16, window.innerHeight * 0.48 / flyingRect.height))
  const landScale = targetRect.height / flyingRect.height
  const travelDirection = Math.sign(landX - centerX || landY - centerY || 1)

  gsap.set([veilRef.value, ringRef.value, slashRef.value, shockwaveRef.value], {
    opacity: 0,
  })
  gsap.set(flyingCardRef.value, {
    x: 0,
    y: 0,
    z: 0,
    scale: originScale,
    rotation: getSourceRotation(source.position),
    rotationX: source.position === 'bottom' ? -10 : 16,
    transformPerspective: 1200,
    transformOrigin: '50% 50%',
    opacity: 1,
    filter: 'brightness(1)',
  })
  gsap.set(flipperRef.value, {
    rotationY: source.faceUp ? 0 : 180,
    transformPerspective: 1200,
    transformStyle: 'preserve-3d',
  })
  gsap.set(ringRef.value, {
    xPercent: -50,
    yPercent: -50,
    scale: 0.35,
    rotation: -24,
  })
  gsap.set(slashRef.value, {
    xPercent: -50,
    yPercent: -50,
    scaleX: 0.35,
    scaleY: 0.78,
    rotation: -18,
  })
  gsap.set(shockwaveRef.value, {
    xPercent: -50,
    yPercent: -50,
    scale: 0.22,
  })

  timeline = gsap.timeline({
    defaults: { ease: 'power3.out' },
    onComplete: () => {
      discardCards.value = [
        ...discardCards.value.slice(-2),
        {
          ...pendingCard.value,
          id: `${pendingCard.value.id}-discard-${Date.now()}`,
        },
      ]

      if (source.removeFromHand) {
        playerHandCards.value = playerHandCards.value.filter((card) => card.id !== source.card.id)
      }

      activeCard.value = null
      activeSourceId.value = null
      pendingCard.value = null
      flyingStyle.value = { display: 'none' }
      shockwaveStyle.value = { display: 'none' }
      isPlaying.value = false
      timeline = null
    },
  })

  timeline
    .to(veilRef.value, { opacity: 1, duration: 0.14, ease: 'power1.out' })
    .to(slashRef.value, { opacity: 0.88, scaleX: 1, duration: 0.16 }, '<')
    .to(flyingCardRef.value, {
      x: centerX,
      y: centerY,
      scale: showcaseScale,
      rotation: 0,
      rotationX: 0,
      duration: 0.46,
      ease: 'expo.out',
    }, '<')
    .to(ringRef.value, {
      opacity: 0.92,
      scale: 1,
      rotation: 0,
      duration: 0.22,
      ease: 'back.out(1.9)',
    }, '-=0.18')
    .to(flipperRef.value, {
      rotationY: 0,
      duration: source.faceUp ? 0.01 : 0.34,
      ease: 'power2.inOut',
    }, '-=0.05')
    .to(flyingCardRef.value, {
      scale: showcaseScale * 1.06,
      filter: 'brightness(1.12)',
      duration: 0.14,
      ease: 'power1.out',
    })
    .to(flyingCardRef.value, {
      scale: showcaseScale,
      filter: 'brightness(1)',
      duration: 0.18,
      ease: 'power1.inOut',
    })
    .to({}, { duration: 0.42 })
    .to(slashRef.value, {
      opacity: 0,
      scaleX: 1.22,
      duration: 0.18,
      ease: 'power2.in',
    }, '<')
    .to(ringRef.value, {
      opacity: 0,
      scale: 1.18,
      rotation: 24,
      duration: 0.2,
      ease: 'power2.in',
    }, '<')
    .to(flyingCardRef.value, {
      x: landX,
      y: landY,
      scale: landScale,
      rotation: 2 + travelDirection * 1.5,
      rotationX: 58,
      duration: 0.42,
      ease: 'power3.in',
    }, '<+=0.06')
    .to(shockwaveRef.value, {
      opacity: 0.62,
      scale: 1,
      duration: 0.08,
      ease: 'power2.out',
    }, '-=0.03')
    .to(shockwaveRef.value, {
      opacity: 0,
      scale: 1.55,
      duration: 0.24,
      ease: 'power2.out',
    })
    .to(flyingCardRef.value, {
      opacity: 0,
      duration: 0.04,
      ease: 'none',
    }, '<')
    .to(veilRef.value, {
      opacity: 0,
      duration: 0.2,
      ease: 'power1.in',
    }, '<')
}

function playOpponentCard(source) {
  playCard({
    sourceId: source.playerId,
    position: source.position,
    label: source.label,
    card: source.card,
    faceUp: false,
    removeFromHand: false,
  })
}

function playHandCard(card) {
  playCard({
    sourceId: card.id,
    position: 'bottom',
    label: `我方出牌：${card.name}`,
    card,
    faceUp: true,
    removeFromHand: true,
  })
}

onUnmounted(() => {
  timeline?.kill()
  clearPointerListeners()
})
</script>

<template>
  <main class="cardplay-test" :style="{ backgroundImage: `url(${gameTableBackgroundUrl})` }">
    <div class="cardplay-test__shade"></div>

    <section class="cardplay-test__hud">
      <div>
        <p>cardplay_test</p>
        <h1>手牌出牌與抽牌測試</h1>
      </div>
      <div class="cardplay-test__hud-actions">
        <button
          v-for="source in opponentSources"
          :key="`hud-${source.playerId}`"
          type="button"
          :disabled="isPlaying || isDrawAnimating || Boolean(draggingCard)"
          @click="playOpponentCard(source)"
        >
          {{ source.label }}
        </button>
        <button
          type="button"
          :disabled="isPlaying || isDrawAnimating || Boolean(draggingCard)"
          @click="playDrawAnimation"
        >
          {{ isDrawAnimating ? '抽牌中' : '抽牌' }}
        </button>
      </div>
    </section>

    <PlayerSeats :players="players" />

    <button
      v-for="source in opponentSources"
      :key="source.playerId"
      :ref="(element) => setSourceElement(source.playerId, element)"
      type="button"
      class="cardplay-test__source-card"
      :class="[
        `cardplay-test__source-card--${source.position}`,
        { 'cardplay-test__source-card--playing': activeSourceId === source.playerId },
      ]"
      :disabled="isPlaying || isDrawAnimating || Boolean(draggingCard)"
      :style="{ '--accent': source.card.color }"
      :aria-label="source.label"
      @click="playOpponentCard(source)"
    >
      <span class="cardplay-test__source-card-label">{{ source.card.type }}</span>
      <img :src="cardBackUrl" alt="" draggable="false" />
    </button>

    <section class="cardplay-test__table-piles">
      <TableCardPiles
        ref="tableCardPilesRef"
        :deck-count="28"
        :discard-cards="discardCards"
        :is-draw-disabled="isPlaying || isDrawAnimating || Boolean(draggingCard)"
        :is-drop-target-active="isPlaying || isOverPlayZone"
        @draw="playDrawAnimation"
      />
    </section>

    <section class="cardplay-test__player-hand" aria-label="我方手牌">
      <button
        v-for="(card, index) in playerHandCards"
        :key="card.id"
        :ref="(element) => setSourceElement(card.id, element)"
        type="button"
        class="cardplay-test__hand-card"
        :class="{
          'cardplay-test__hand-card--playing': activeSourceId === card.id,
          'cardplay-test__hand-card--dragging': draggingCard?.id === card.id,
        }"
        :disabled="isPlaying || isDrawAnimating"
        :style="{
          '--accent': card.color,
          '--fan-index': index - (playerHandCards.length - 1) / 2,
          '--fan-lift': Math.abs(index - (playerHandCards.length - 1) / 2),
        }"
        :aria-label="`我方出牌：${card.name}`"
        @pointerdown="handleHandPointerDown(card, $event)"
      >
        <GameCard
          :name="card.name"
          :background-url="card.backgroundUrl"
          :frame-url="card.frameUrl"
        />
      </button>

      <div ref="drawTargetRef" class="cardplay-test__draw-target" aria-hidden="true"></div>
    </section>

    <div
      v-if="draggingCard"
      class="cardplay-test__drag-preview"
      :class="{ 'cardplay-test__drag-preview--over': isOverPlayZone }"
      :style="dragPreviewStyle"
      aria-hidden="true"
    >
      <div class="cardplay-test__drag-preview-glow" :style="{ '--accent': draggingCard.color }"></div>
      <GameCard
        :name="draggingCard.name"
        :background-url="draggingCard.backgroundUrl"
        :frame-url="draggingCard.frameUrl"
      />
    </div>

    <CardDrawAnimation
      ref="cardDrawAnimationRef"
      :card="activeDrawCard"
    />

    <div ref="veilRef" class="cardplay-test__veil"></div>
    <div ref="slashRef" class="cardplay-test__slash"></div>
    <div ref="ringRef" class="cardplay-test__ring"></div>
    <div ref="shockwaveRef" class="cardplay-test__shockwave" :style="shockwaveStyle"></div>

    <div
      v-if="activeCard"
      ref="flyingCardRef"
      class="cardplay-test__flying-card"
      :style="flyingStyle"
      aria-hidden="true"
    >
      <div class="cardplay-test__card-glow" :style="{ '--accent': activeCard.color }"></div>
      <div ref="flipperRef" class="cardplay-test__flipper">
        <div class="cardplay-test__face cardplay-test__face--front">
          <img :src="activeCard.backgroundUrl" alt="" draggable="false" />
          <img :src="activeCard.frameUrl" alt="" draggable="false" />
        </div>
        <div class="cardplay-test__face cardplay-test__face--back">
          <img :src="cardBackUrl" alt="" draggable="false" />
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.cardplay-test {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background-color: #07111d;
  background-position: center;
  background-size: cover;
  color: #f8fafc;
  isolation: isolate;
}

.cardplay-test__shade {
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(circle at 50% 42%, rgba(56, 189, 248, 0.14), transparent 28%),
    radial-gradient(circle at 50% 62%, rgba(250, 204, 21, 0.1), transparent 34%),
    linear-gradient(180deg, rgba(7, 17, 29, 0.72), rgba(7, 17, 29, 0.2) 48%, rgba(7, 17, 29, 0.74));
}

.cardplay-test__hud {
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

.cardplay-test__hud p,
.cardplay-test__hud h1 {
  margin: 0;
  text-shadow: 0 3px 12px rgba(0, 0, 0, 0.56);
}

.cardplay-test__hud p {
  color: #facc15;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.cardplay-test__hud h1 {
  margin-top: 5px;
  font-size: clamp(24px, 3vw, 40px);
  line-height: 1;
}

.cardplay-test__hud-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  max-width: min(56vw, 620px);
  pointer-events: auto;
}

.cardplay-test__hud button {
  min-height: 38px;
  border: 1px solid rgba(250, 204, 21, 0.64);
  border-radius: 8px;
  padding: 0 12px;
  cursor: pointer;
  background: rgba(7, 17, 29, 0.78);
  color: #f8fafc;
  font-size: 13px;
  font-weight: 900;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.32);
}

.cardplay-test__hud button:disabled {
  cursor: wait;
  opacity: 0.55;
}

.cardplay-test__source-card {
  position: absolute;
  z-index: 24;
  width: clamp(56px, 5.5vw, 78px);
  aspect-ratio: 3 / 4;
  border: 0;
  padding: 0;
  cursor: pointer;
  background: transparent;
  filter: drop-shadow(0 10px 12px rgba(0, 0, 0, 0.48));
  transform-origin: 50% 50%;
  transition:
    filter 0.16s ease,
    transform 0.16s ease,
    opacity 0.16s ease;
}

.cardplay-test__source-card:disabled {
  cursor: wait;
  opacity: 0.58;
}

.cardplay-test__source-card:hover:not(:disabled),
.cardplay-test__source-card--playing {
  filter:
    drop-shadow(0 0 13px var(--accent))
    drop-shadow(0 12px 14px rgba(0, 0, 0, 0.5));
}

.cardplay-test__source-card--top {
  top: clamp(126px, 19vh, 168px);
  left: 50%;
  transform: translateX(-50%) rotateX(26deg) rotateZ(-8deg);
}

.cardplay-test__source-card--top:hover:not(:disabled),
.cardplay-test__source-card--top.cardplay-test__source-card--playing {
  transform: translate(-50%, -10px) rotateX(20deg) rotateZ(-8deg);
}

.cardplay-test__source-card--left {
  top: 50%;
  left: clamp(118px, 14vw, 206px);
  transform: translateY(-50%) rotateX(20deg) rotateZ(8deg);
}

.cardplay-test__source-card--left:hover:not(:disabled),
.cardplay-test__source-card--left.cardplay-test__source-card--playing {
  transform: translate(10px, -50%) rotateX(16deg) rotateZ(8deg);
}

.cardplay-test__source-card--right {
  top: 50%;
  right: clamp(118px, 14vw, 206px);
  transform: translateY(-50%) rotateX(20deg) rotateZ(-8deg);
}

.cardplay-test__source-card--right:hover:not(:disabled),
.cardplay-test__source-card--right.cardplay-test__source-card--playing {
  transform: translate(-10px, -50%) rotateX(16deg) rotateZ(-8deg);
}

.cardplay-test__source-card img,
.cardplay-test__face img {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
}

.cardplay-test__source-card-label {
  position: absolute;
  left: 50%;
  bottom: -20px;
  z-index: 1;
  width: max-content;
  max-width: 120px;
  transform: translateX(-50%);
  color: #e2e8f0;
  font-size: 11px;
  font-weight: 900;
  line-height: 1;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.72);
  pointer-events: none;
}

.cardplay-test__table-piles {
  position: absolute;
  top: 42%;
  left: 50%;
  z-index: 12;
  transform: translateX(-50%);
}

.cardplay-test__player-hand {
  position: absolute;
  right: clamp(20px, 7vw, 120px);
  bottom: clamp(-34px, -3vh, -18px);
  left: clamp(20px, 7vw, 120px);
  z-index: 24;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  min-height: clamp(128px, 23vh, 220px);
  padding-bottom: 12px;
  pointer-events: none;
  perspective: 1100px;
}

.cardplay-test__hand-card {
  position: relative;
  width: clamp(76px, 8vw, 126px);
  aspect-ratio: 3 / 4;
  margin-left: clamp(-26px, -2.3vw, -12px);
  border: 0;
  padding: 0;
  cursor: pointer;
  background: transparent;
  filter: drop-shadow(0 12px 16px rgba(0, 0, 0, 0.44));
  transform:
    translateY(calc(var(--fan-lift) * 5px))
    rotateZ(calc(var(--fan-index) * 5deg));
  transform-origin: 50% 100%;
  transition:
    filter 0.16s ease,
    transform 0.16s ease,
    opacity 0.16s ease;
  pointer-events: auto;
}

.cardplay-test__hand-card:first-child {
  margin-left: 0;
}

.cardplay-test__hand-card:hover:not(:disabled),
.cardplay-test__hand-card--playing {
  filter:
    drop-shadow(0 0 15px var(--accent))
    drop-shadow(0 16px 18px rgba(0, 0, 0, 0.5));
  transform: translateY(-18px) rotateZ(calc(var(--fan-index) * 3deg));
}

.cardplay-test__hand-card--dragging {
  opacity: 0.18;
}

.cardplay-test__hand-card:disabled {
  cursor: wait;
  opacity: 0.58;
}

.cardplay-test__draw-target {
  width: clamp(76px, 8vw, 126px);
  aspect-ratio: 3 / 4;
  margin-left: clamp(-26px, -2.3vw, -12px);
  opacity: 0;
  pointer-events: none;
}

.cardplay-test__drag-preview {
  position: fixed;
  z-index: 49;
  cursor: grabbing;
  filter: drop-shadow(0 18px 24px rgba(0, 0, 0, 0.42));
  pointer-events: none;
  transform-origin: 50% 50%;
  will-change: transform;
}

.cardplay-test__drag-preview-glow {
  position: absolute;
  inset: -14%;
  border-radius: 18px;
  background:
    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.34), transparent 36%),
    radial-gradient(circle at 50% 50%, var(--accent), transparent 68%);
  filter: blur(13px);
  opacity: 0;
  transform: scale(0.82);
  transition:
    opacity 0.14s ease,
    transform 0.14s ease;
}

.cardplay-test__drag-preview--over .cardplay-test__drag-preview-glow {
  opacity: 0.82;
  transform: scale(1);
}

.cardplay-test__veil,
.cardplay-test__slash,
.cardplay-test__ring,
.cardplay-test__shockwave {
  position: fixed;
  pointer-events: none;
}

.cardplay-test__veil {
  inset: 0;
  z-index: 50;
  opacity: 0;
  background:
    radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.06), rgba(0, 0, 0, 0.7) 68%),
    linear-gradient(115deg, rgba(2, 6, 23, 0.76), rgba(15, 23, 42, 0.42));
}

.cardplay-test__slash {
  top: 50%;
  left: 50%;
  z-index: 54;
  width: min(92vw, 980px);
  height: min(46vh, 330px);
  opacity: 0;
  background:
    linear-gradient(105deg, transparent 0 18%, rgba(125, 211, 252, 0.14) 22%, transparent 27%),
    linear-gradient(105deg, transparent 18%, rgba(255, 255, 255, 0.58) 44%, rgba(250, 204, 21, 0.52) 49%, transparent 57%),
    linear-gradient(105deg, transparent 58%, rgba(56, 189, 248, 0.24) 64%, transparent 72%);
  filter: blur(0.3px) drop-shadow(0 0 16px rgba(125, 211, 252, 0.5));
  mix-blend-mode: screen;
}

.cardplay-test__ring {
  top: 50%;
  left: 50%;
  z-index: 53;
  width: min(62vmin, 560px);
  aspect-ratio: 1;
  border: 3px solid rgba(250, 204, 21, 0.72);
  border-radius: 50%;
  opacity: 0;
  background:
    conic-gradient(from 20deg, transparent 0 7%, rgba(125, 211, 252, 0.58) 8% 12%, transparent 13% 24%, rgba(250, 204, 21, 0.72) 25% 29%, transparent 30% 100%),
    radial-gradient(circle, transparent 46%, rgba(56, 189, 248, 0.12) 47% 58%, transparent 60%);
  box-shadow:
    inset 0 0 30px rgba(125, 211, 252, 0.26),
    0 0 40px rgba(250, 204, 21, 0.34);
  mix-blend-mode: screen;
}

.cardplay-test__shockwave {
  z-index: 55;
  width: min(34vmin, 280px);
  aspect-ratio: 1;
  border-radius: 50%;
  opacity: 0;
  background:
    radial-gradient(circle, rgba(255, 255, 255, 0.38) 0 6%, transparent 8%),
    radial-gradient(circle, transparent 42%, rgba(250, 204, 21, 0.52) 43% 47%, transparent 49%),
    radial-gradient(circle, rgba(125, 211, 252, 0.24), transparent 66%);
  filter: blur(1px);
  mix-blend-mode: screen;
}

.cardplay-test__flying-card {
  position: fixed;
  z-index: 57;
  perspective: 1200px;
  transform-origin: 50% 50%;
  image-rendering: auto;
  will-change: transform, opacity, filter;
}

.cardplay-test__card-glow {
  position: absolute;
  inset: -20%;
  border-radius: 18px;
  background:
    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.42), transparent 32%),
    radial-gradient(circle at 50% 50%, var(--accent), transparent 66%);
  filter: blur(16px);
  opacity: 0.78;
}

.cardplay-test__flipper {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
}

.cardplay-test__face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  filter:
    drop-shadow(0 0 16px rgba(250, 204, 21, 0.34))
    drop-shadow(0 24px 32px rgba(0, 0, 0, 0.5));
}

.cardplay-test__face--back {
  transform: rotateY(180deg);
}

@media (max-width: 860px) {
  .cardplay-test__hud {
    align-items: stretch;
  }

  .cardplay-test__hud h1 {
    font-size: 26px;
  }

  .cardplay-test__hud-actions {
    max-width: 48vw;
  }

  .cardplay-test__source-card--left {
    left: 88px;
  }

  .cardplay-test__source-card--right {
    right: 88px;
  }

  .cardplay-test__player-hand {
    right: 12px;
    left: 12px;
  }

  .cardplay-test__table-piles {
    top: 44%;
  }
}
</style>
