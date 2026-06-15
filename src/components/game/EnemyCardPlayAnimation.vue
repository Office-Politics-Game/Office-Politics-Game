<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { gsap } from 'gsap'
import cardBackUrl from '@/assets/images/card-bg-back.webp'
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
  discardRect: {
    type: Object,
    default: null,
  },
  playTicket: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['card-landed', 'animation-finished'])

const overlayEl = ref(null)
const trailEl = ref(null)
const burstEl = ref(null)
const cardVisualEl = ref(null)
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

function getQuadraticPoint(start, control, end, progress) {
  const inv = 1 - progress
  return {
    x: inv * inv * start.x + 2 * inv * progress * control.x + progress * progress * end.x,
    y: inv * inv * start.y + 2 * inv * progress * control.y + progress * progress * end.y,
  }
}

function lerp(start, end, progress) {
  return start + (end - start) * progress
}

function resetLayer() {
  stage.value = 'idle'
  overlayStyle.value = { display: 'none' }
  trailStyle.value = { display: 'none' }
  burstStyle.value = { display: 'none' }
}

async function animateEnemyPlay() {
  if (!hasActiveCard.value || !props.originRect || !props.discardRect) {
    return
  }

  await nextTick()

  if (!overlayEl.value || !trailEl.value || !burstEl.value || !cardVisualEl.value) {
    return
  }

  stage.value = 'playing'

  const originRect = props.originRect
  const discardRect = props.discardRect
  const startX = 0
  const startY = 0
  const targetX = discardRect.left - originRect.left
  const targetY = discardRect.top - originRect.top
  const dx = targetX - startX
  const travelDirection = Math.sign(dx || 1)
  const liftHeight = Math.max(originRect.height * 0.88, 200)
  const settleTargetX = targetX
  const settleTargetY = targetY + Math.max(originRect.height * 0.18, 28)
  const hoverTargetY = targetY - Math.max(originRect.height * 0.66, 132)

  gsap.killTweensOf([overlayEl.value, trailEl.value, burstEl.value, cardVisualEl.value])

  overlayStyle.value = rectToStyle(originRect)
  trailStyle.value = rectToStyle(originRect)
  burstStyle.value = {
    display: 'block',
    left: `${discardRect.left}px`,
    top: `${discardRect.top}px`,
    width: `${discardRect.width}px`,
    height: `${discardRect.height}px`,
  }

  gsap.set(overlayEl.value, {
    x: startX,
    y: startY,
    scaleX: 1,
    scaleY: 1,
    rotation: travelDirection * 7,
    rotationX: -10,
    rotationY: 0,
    transformPerspective: 1100,
    transformOrigin: '50% 100%',
    opacity: 1,
    zIndex: 80,
  })

  gsap.set(trailEl.value, {
    x: startX,
    y: startY,
    scale: 0.98,
    opacity: 0,
    zIndex: 79,
  })

  gsap.set(cardVisualEl.value, {
    rotationY: 0,
    transformPerspective: 1100,
    transformStyle: 'preserve-3d',
  })

  gsap.set(burstEl.value, {
    opacity: 0,
    scale: 0.35,
  })

  const startPoint = { x: startX, y: startY }
  const liftPoint = {
    x: startX + dx * 0.16,
    y: startY - liftHeight,
  }
  const flyPoint = {
    x: settleTargetX,
    y: hoverTargetY - Math.max(originRect.height * 0.28, 54),
  }
  const landPoint = {
    x: settleTargetX,
    y: hoverTargetY,
  }
  const motion = { t: 0 }
  const trailMotion = { t: 0 }

  gsap.to(motion, {
    t: 1,
    duration: 1,
    ease: 'power2.inOut',
    onUpdate: () => {
      const p = motion.t
      const point = p < 0.48
        ? getQuadraticPoint(startPoint, liftPoint, flyPoint, p / 0.48)
        : getQuadraticPoint(flyPoint, flyPoint, landPoint, (p - 0.48) / 0.52)

      const flightScale = p < 0.72 ? lerp(1, 1.08, p / 0.72) : 1.08
      const flightRotation = p < 0.72 ? lerp(travelDirection * 7, 2, p / 0.72) : 2
      const flightRotationX = p < 0.72 ? lerp(-10, 38, p / 0.72) : 58

      gsap.set(overlayEl.value, {
        x: point.x,
        y: point.y,
        scaleX: flightScale,
        scaleY: flightScale,
        rotation: flightRotation,
        rotationX: flightRotationX,
      })
    },
    onComplete: () => {
      const timeline = gsap.timeline({
        defaults: { overwrite: true },
        onComplete: () => {
          emit('animation-finished')
          resetLayer()
        },
      })

      timeline.to(overlayEl.value, {
        x: settleTargetX,
        y: hoverTargetY - 26,
        scaleX: 1.34,
        scaleY: 1.34,
        rotation: 2,
        rotationX: 18,
        duration: 0.3,
        ease: 'power2.out',
      })

      timeline.to(overlayEl.value, {
        x: settleTargetX,
        y: hoverTargetY,
        scaleX: 1.22,
        scaleY: 1.04,
        rotation: 2,
        rotationX: 68,
        duration: 0.22,
        ease: 'power3.in',
      })

      timeline.to(cardVisualEl.value, {
        rotationY: 180,
        duration: 0.28,
        ease: 'power2.inOut',
      }, '-=0.04')

      timeline.to(overlayEl.value, {
        x: settleTargetX,
        y: hoverTargetY - 2,
        scaleX: 1.2,
        scaleY: 1.02,
        duration: 0.16,
        ease: 'power1.out',
      })

      timeline.to(overlayEl.value, {
        x: settleTargetX,
        y: settleTargetY,
        scaleX: 1.02,
        scaleY: 1.02,
        rotation: 2,
        rotationX: 58,
        duration: 0.16,
        ease: 'power3.inOut',
        onComplete: () => {
          emit('card-landed')
          gsap.to(burstEl.value, {
            opacity: 1,
            scale: 1.3,
            duration: 0.1,
            ease: 'power2.out',
          })
        },
      })

      timeline.to(overlayEl.value, {
        opacity: 0,
        duration: 0.12,
        delay: 0.04,
        ease: 'power1.out',
      })

      timeline.to(burstEl.value, {
        opacity: 0,
        scale: 1.45,
        duration: 0.16,
        ease: 'power2.out',
      }, '<')

      timeline.to(trailEl.value, {
        opacity: 0,
        duration: 0.1,
        ease: 'power1.out',
      }, '<')
    },
  })

  gsap.to(trailMotion, {
    t: 1,
    duration: 1,
    ease: 'power2.inOut',
    onUpdate: () => {
      const p = trailMotion.t
      const point = p < 0.48
        ? getQuadraticPoint(startPoint, liftPoint, flyPoint, p / 0.48)
        : getQuadraticPoint(flyPoint, flyPoint, landPoint, (p - 0.48) / 0.52)
      const fadeIn = p < 0.18 ? p / 0.18 : 1
      const fadeOut = p > 0.82 ? 1 - (p - 0.82) / 0.18 : 1

      gsap.set(trailEl.value, {
        x: point.x,
        y: point.y,
        scale: lerp(0.96, 1.04, Math.min(p / 0.72, 1)),
        opacity: 0.38 * Math.min(fadeIn, fadeOut),
      })
    },
  })
}

watch(
  () => props.playTicket,
  () => {
    animateEnemyPlay()
  },
)

watch(
  () => [props.activeCard, props.originRect],
  () => {
    if (!hasActiveCard.value && stage.value !== 'playing') {
      resetLayer()
    }
  },
  { immediate: true, deep: true },
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="hasActiveCard"
      ref="trailEl"
      class="enemy-card-play-trail fixed pointer-events-none"
      :style="trailStyle"
      aria-hidden="true"
    >
      <img
        :src="cardBackUrl"
        alt=""
        class="block size-full select-none object-contain"
        draggable="false"
      />
    </div>

    <div
      v-if="hasActiveCard"
      ref="burstEl"
      class="enemy-card-play-burst fixed pointer-events-none"
      :style="burstStyle"
      aria-hidden="true"
    ></div>

    <div
      v-if="hasActiveCard"
      ref="overlayEl"
      class="enemy-card-play-layer fixed pointer-events-none"
      :style="overlayStyle"
      aria-hidden="true"
    >
      <div class="enemy-card-play-layer__glow"></div>
      <div ref="cardVisualEl" class="enemy-card-play-visual">
        <div class="enemy-card-play-face enemy-card-play-face--back">
          <img
            :src="cardBackUrl"
            alt=""
            class="block size-full select-none object-contain"
            draggable="false"
          />
        </div>

        <div class="enemy-card-play-face enemy-card-play-face--front">
          <GameCard
            :name="activeCard.name"
            :background-url="activeCard.backgroundUrl"
            :frame-url="activeCard.frameUrl"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.enemy-card-play-layer {
  will-change: transform, opacity;
  transform-origin: 50% 100%;
  perspective: 1100px;
  filter: drop-shadow(0 18px 28px rgba(0, 19, 50, 0.42));
}

.enemy-card-play-trail {
  z-index: 79;
  will-change: transform, opacity;
  transform-origin: 50% 100%;
  filter: blur(7px) saturate(1.06);
  opacity: 0;
}

.enemy-card-play-visual {
  position: relative;
  height: 100%;
  width: 100%;
  transform-style: preserve-3d;
  will-change: transform;
}

.enemy-card-play-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
}

.enemy-card-play-face--front {
  transform: rotateY(180deg);
}

.enemy-card-play-layer__glow {
  position: absolute;
  inset: -12%;
  border-radius: 18px;
  background:
    radial-gradient(circle at 50% 44%, rgba(255, 255, 255, 0.42), transparent 38%),
    radial-gradient(circle at 50% 50%, rgba(107, 184, 212, 0.5), transparent 64%);
  filter: blur(14px);
  opacity: 1;
  transform: scale(1);
}

.enemy-card-play-burst {
  z-index: 78;
  border-radius: 999px;
  background:
    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0.28) 14%, transparent 52%),
    radial-gradient(circle at 50% 50%, rgba(107, 184, 212, 1), rgba(107, 184, 212, 0.1) 38%, transparent 74%);
  filter: blur(12px);
  mix-blend-mode: screen;
  transform-origin: 50% 50%;
}
</style>
