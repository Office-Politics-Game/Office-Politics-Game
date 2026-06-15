<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { gsap } from 'gsap'
import GameCard from './GameCard.vue'

const props = defineProps({
  activeCard: {
    type: Object,
    default: null,
  },
  originRect: {
    type: Object,
    default: null,
  },
  dragPoint: {
    type: Object,
    default: null,
  },
  discardRect: {
    type: Object,
    default: null,
  },
  isDragging: {
    type: Boolean,
    default: false,
  },
  isOverPlayZone: {
    type: Boolean,
    default: false,
  },
  playTicket: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['card-arrived', 'animation-finished'])

const overlayEl = ref(null)
const trailEl = ref(null)
const burstEl = ref(null)
const stage = ref('idle')
const overlayStyle = ref({ display: 'none' })
const trailStyle = ref({ display: 'none' })
const burstStyle = ref({ display: 'none' })

const hasActiveCard = computed(() => Boolean(props.activeCard && props.originRect))

function rectToStyle(rect) {
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

function resetLayer() {
  stage.value = 'idle'
  overlayStyle.value = { display: 'none' }
  trailStyle.value = { display: 'none' }
  burstStyle.value = { display: 'none' }
}

function updateDragLayer() {
  if (!hasActiveCard.value || !props.originRect || !props.dragPoint || stage.value !== 'dragging') {
    return
  }

  const { originRect, dragPoint } = props
  const translateX = dragPoint.x - (originRect.left + originRect.width / 2)
  const translateY = dragPoint.y - (originRect.top + originRect.height / 2)
  const dragScale = props.isOverPlayZone ? 1.06 : 1

  overlayStyle.value = {
    ...rectToStyle(originRect),
    transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${dragScale}) rotate(0deg)`,
  }
}

async function animatePlay() {
  if (!hasActiveCard.value || !overlayEl.value || !props.originRect || !props.discardRect) {
    return
  }

  stage.value = 'playing'
  await nextTick()

  const originRect = props.originRect
  const discardRect = props.discardRect

  const startX = props.dragPoint
    ? props.dragPoint.x - (originRect.left + originRect.width / 2)
    : 0
  const startY = props.dragPoint
    ? props.dragPoint.y - (originRect.top + originRect.height / 2)
    : 0

  const targetX = discardRect.left - originRect.left
  const targetY = discardRect.top - originRect.top
  const dx = targetX - startX
  const dy = targetY - startY
  const travelDirection = Math.sign(dx || dy || 1)
  const liftHeight = Math.max(originRect.height * 1.02, 250)

  gsap.killTweensOf([overlayEl.value, burstEl.value])
  gsap.killTweensOf(trailEl.value)

  gsap.set(overlayEl.value, {
    x: startX,
    y: startY,
    scaleX: 1.02,
    scaleY: 1.02,
    rotation: -2,
    rotationX: -4,
    transformPerspective: 900,
    opacity: 1,
    zIndex: 76,
    transformOrigin: '50% 100%',
  })

  gsap.set(trailEl.value, {
    left: `${originRect.left}px`,
    top: `${originRect.top}px`,
    width: `${originRect.width}px`,
    height: `${originRect.height}px`,
    opacity: 0,
    display: 'block',
  })

  gsap.set(burstEl.value, {
    left: `${discardRect.left}px`,
    top: `${discardRect.top}px`,
    width: `${discardRect.width}px`,
    height: `${discardRect.height}px`,
    opacity: 0,
    scale: 0.35,
    display: 'block',
  })

  const startPoint = { x: startX, y: startY }
  const liftPoint = {
    x: startX + dx * 0.08,
    y: startY - liftHeight,
  }
  const settleOffsetX = 0
  const settleOffsetY = -142
  const settleTargetX = targetX + settleOffsetX
  const settleTargetY = targetY + settleOffsetY
  const flyPoint = {
    x: settleTargetX,
    y: settleTargetY - Math.max(originRect.height * 0.42, 92),
  }
  const landPoint = {
    x: settleTargetX,
    y: settleTargetY + 2,
  }
  const motion = { t: 0 }
  const curve = { x: startX, y: startY }
  const trailMotion = { t: 0 }
  const trailPoint = { x: startX, y: startY }
  const cleanup = () => {
    emit('animation-finished')
    resetLayer()
  }

  const leadTween = gsap.to(motion, {
    t: 1,
    duration: 1.12,
    ease: 'power2.inOut',
    onUpdate: () => {
      const p = motion.t
      let point

      if (p < 0.38) {
        point = getQuadraticPoint(startPoint, liftPoint, flyPoint, p / 0.38)
      } else {
        point = getQuadraticPoint(flyPoint, flyPoint, landPoint, (p - 0.38) / 0.62)
      }

      curve.x = point.x
      curve.y = point.y

      const liftBoost = p < 0.38 ? p / 0.38 : 1
      const dropBoost = p > 0.82 ? (p - 0.82) / 0.18 : 0
      const settleBoost = Math.max(0, Math.min((p - 0.62) / 0.38, 1))
      const scaleX = p < 0.62
        ? lerp(1.16, 1.02, liftBoost)
        : lerp(1.02, 1, settleBoost)
      const scaleY = p < 0.62
        ? (p < 0.38 ? lerp(1.3, 1.12, liftBoost) : lerp(1.12, 1, dropBoost))
        : lerp(1, 1, settleBoost)
      const rotation = p < 0.62
        ? (p < 0.5
            ? lerp(travelDirection * 12, travelDirection * 4, Math.min(p / 0.5, 1))
            : lerp(travelDirection * 4, 2, (p - 0.5) / 0.2))
        : 2

      gsap.set(overlayEl.value, {
        x: curve.x,
        y: curve.y,
        scaleX,
        scaleY,
        rotation,
        rotationX: p < 0.62 ? -12 * (1 - Math.min(p / 0.5, 1)) : 58,
      })

    },
    onComplete: () => {
      emit('card-arrived')
      gsap.to(burstEl.value, {
        opacity: 1,
        scale: 1.3,
        duration: 0.1,
        ease: 'power2.out',
      })

      gsap.to(overlayEl.value, {
        x: settleTargetX + travelDirection * 4,
        y: settleTargetY + 4,
        scaleX: 1.02,
        scaleY: 0.92,
        rotation: travelDirection * 10,
        rotationX: -34,
        rotationY: 0,
        duration: 0.08,
        ease: 'power2.out',
      })

      gsap.to(overlayEl.value, {
        x: settleTargetX,
        y: settleTargetY,
        scaleX: 1,
        scaleY: 1,
        rotation: 2,
        rotationX: 58,
        rotationY: 0,
        duration: 0.18,
        ease: 'power2.out',
      })

      gsap.to(overlayEl.value, {
        opacity: 0,
        duration: 0.12,
        delay: 0.08,
        ease: 'power1.out',
      })

      gsap.to(burstEl.value, {
        opacity: 0,
        scale: 1.45,
        duration: 0.16,
        ease: 'power2.out',
      })

      gsap.to(trailEl.value, {
        opacity: 0,
        duration: 0.12,
        ease: 'power1.out',
        onComplete: cleanup,
      })
    },
  })

  gsap.to(trailMotion, {
    t: 1,
    duration: 1.12,
    ease: 'power2.inOut',
    onUpdate: () => {
      const p = trailMotion.t
      let point

      if (p < 0.38) {
        point = getQuadraticPoint(startPoint, liftPoint, flyPoint, p / 0.38)
      } else {
        point = getQuadraticPoint(flyPoint, flyPoint, landPoint, (p - 0.38) / 0.62)
      }

      trailPoint.x = point.x
      trailPoint.y = point.y

      const fadeIn = p < 0.18 ? p / 0.18 : 1
      const fadeOut = p > 0.8 ? 1 - (p - 0.8) / 0.2 : 1
      gsap.set(trailEl.value, {
        x: trailPoint.x,
        y: trailPoint.y,
        scale: lerp(1.02, 1.08, Math.min(p / 0.45, 1)),
        opacity: 0.58 * Math.min(fadeIn, fadeOut),
      })
    },
  })
}

watch(
  () => [props.activeCard, props.originRect, props.dragPoint, props.isDragging],
  () => {
    if (!hasActiveCard.value) {
      resetLayer()
      return
    }

    if (stage.value === 'playing') {
      return
    }

    if (props.isDragging) {
      stage.value = 'dragging'
      updateDragLayer()
      return
    }

    if (stage.value === 'dragging') {
      updateDragLayer()
    }
  },
  { immediate: true, deep: true },
)

watch(
  () => props.isOverPlayZone,
  () => {
    if (stage.value === 'dragging') {
      updateDragLayer()
    }
  },
)

watch(
  () => props.playTicket,
  () => {
    animatePlay()
  },
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="hasActiveCard"
      ref="trailEl"
      class="card-play-trail fixed pointer-events-none"
      :style="trailStyle"
      aria-hidden="true"
    >
      <GameCard
        :name="activeCard.name"
        :background-url="activeCard.backgroundUrl"
        :frame-url="activeCard.frameUrl"
      />
    </div>

    <div
      v-if="hasActiveCard"
      ref="burstEl"
      class="card-play-burst fixed pointer-events-none"
      :style="burstStyle"
      aria-hidden="true"
    ></div>

    <div
      v-if="hasActiveCard"
      ref="overlayEl"
      class="card-play-layer fixed pointer-events-none"
      :class="{ 'card-play-layer--active': isOverPlayZone || stage === 'playing' }"
      :style="overlayStyle"
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
</style>
