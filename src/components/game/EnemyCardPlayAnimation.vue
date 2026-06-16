<script setup>
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
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
const flipperEl = ref(null)
const trailEl = ref(null)
const burstEl = ref(null)
const showcaseEl = ref(null)
const stage = ref('idle')
const overlayStyle = ref({ display: 'none' })
const trailStyle = ref({ display: 'none' })
const burstStyle = ref({ display: 'none' })
const showcaseStyle = ref({ display: 'none' })
let playTimeline = null
let landingTweens = []

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

function createCardRect(originRect, discardRect) {
  const referenceHeight = discardRect?.height || originRect.height
  const height = Math.min(
    Math.max(referenceHeight * 0.92, 96),
    Math.max(window.innerHeight * 0.24, 132),
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

function resetLayer() {
  stage.value = 'idle'
  overlayStyle.value = { display: 'none' }
  trailStyle.value = { display: 'none' }
  burstStyle.value = { display: 'none' }
  showcaseStyle.value = { display: 'none' }
}

function getActiveElements() {
  return [
    overlayEl.value,
    flipperEl.value,
    trailEl.value,
    burstEl.value,
    showcaseEl.value,
  ].filter(Boolean)
}

function hasAnimationElements() {
  return Boolean(
    overlayEl.value &&
    flipperEl.value &&
    trailEl.value &&
    burstEl.value &&
    showcaseEl.value,
  )
}

function trackLandingTween(tween) {
  landingTweens.push(tween)
  return tween
}

function stopActiveAnimation() {
  playTimeline?.kill()
  playTimeline = null

  landingTweens.forEach((tween) => tween.kill())
  landingTweens = []

  const activeElements = getActiveElements()
  if (activeElements.length > 0) {
    gsap.killTweensOf(activeElements)
  }
}

async function animatePlay() {
  if (!hasActiveCard.value || !props.originRect || !props.discardRect) {
    return
  }

  stopActiveAnimation()
  stage.value = 'playing'
  await nextTick()

  if (!hasAnimationElements()) {
    resetLayer()
    return
  }

  const originRect = props.originRect
  const discardRect = props.discardRect
  const cardRect = createCardRect(originRect, discardRect)
  const centerX = window.innerWidth / 2 - cardRect.left - cardRect.width / 2
  const centerY = window.innerHeight / 2 - cardRect.top - cardRect.height / 2
  const showcaseScale = Math.min(1.9, Math.max(1.48, window.innerHeight * 0.42 / cardRect.height))*1.6
  const settleScale = (discardRect.height / cardRect.height)*1.8
  const settleTargetX = discardRect.left + discardRect.width / 2 - (cardRect.left + cardRect.width / 2)
  const settleTargetY = discardRect.top + discardRect.height / 2 - (cardRect.top + cardRect.height / 2)
  const travelDirection = Math.sign(settleTargetX - centerX || settleTargetY - centerY || 1)
  const liftHeight = Math.max(cardRect.height * 0.54, 96)
  const finalRotation = -1
  const finalRotationX = 60

  gsap.killTweensOf(getActiveElements())

  overlayStyle.value = rectToStyle(cardRect)
  trailStyle.value = rectToStyle(cardRect)
  burstStyle.value = {
    display: 'block',
    left: `${discardRect.left}px`,
    top: `${discardRect.top}px`,
    width: `${discardRect.width}px`,
    height: `${discardRect.height}px`,
  }
  showcaseStyle.value = {
    display: 'block',
    left: `${window.innerWidth / 2}px`,
    top: `${window.innerHeight / 2}px`,
  }

  gsap.set(overlayEl.value, {
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    rotation: -travelDirection * 7,
    rotationX: -8,
    rotationY: 0,
    transformPerspective: 1000,
    transformOrigin: '50% 50%',
    opacity: 1,
    zIndex: 86,
  })

  gsap.set(flipperEl.value, {
    rotationY: 180,
    transformPerspective: 1000,
    transformStyle: 'preserve-3d',
  })

  gsap.set(trailEl.value, {
    x: 0,
    y: 0,
    scale: 0.92,
    opacity: 0,
    display: 'block',
  })

  gsap.set(burstEl.value, {
    opacity: 0,
    scale: 0.35,
    display: 'block',
  })

  gsap.set(showcaseEl.value, {
    opacity: 0,
    scale: 0.45,
    display: 'block',
  })

  const motion = { t: 0 }
  const trailMotion = { t: 0 }
  const startPoint = { x: centerX, y: centerY }
  const controlPoint = {
    x: centerX + (settleTargetX - centerX) * 0.46,
    y: Math.min(centerY, settleTargetY) - liftHeight,
  }
  const endPoint = { x: settleTargetX, y: settleTargetY }

  function cleanup() {
    landingTweens = []
    playTimeline = null
    emit('animation-finished')
    resetLayer()
  }

  function runLandingAnimation() {
    if (!hasAnimationElements() || stage.value !== 'playing') {
      cleanup()
      return
    }

    motion.t = 0
    trailMotion.t = 0

    trackLandingTween(gsap.to(motion, {
      t: 1,
      duration: 0.9,
      ease: 'power2.in',
      onUpdate: () => {
        if (!overlayEl.value || stage.value !== 'playing') {
          return
        }

        const p = motion.t
        const point = getQuadraticPoint(startPoint, controlPoint, endPoint, p)
        const settleProgress = Math.max(0, Math.min((p - 0.58) / 0.42, 1))
        const liftProgress = Math.min(p / 0.44, 1)

        gsap.set(overlayEl.value, {
          x: point.x,
          y: point.y,
          scaleX: lerp(1.8, settleScale, settleProgress),
          scaleY: lerp(1.5, settleScale, settleProgress),
          rotation: lerp(travelDirection * 10, finalRotation, Math.min(p / 0.78, 1)),
          rotationX: p < 0.58 ? lerp(-10, -2, liftProgress) : finalRotationX,
        })
      },
      onComplete: () => {
        if (!hasAnimationElements() || stage.value !== 'playing') {
          cleanup()
          return
        }

        trackLandingTween(gsap.to(burstEl.value, {
          opacity: 1,
          scale: 1.25,
          duration: 0.1,
          ease: 'power2.out',
        }))

        trackLandingTween(gsap.to(overlayEl.value, {
          x: settleTargetX + travelDirection * 4,
          y: settleTargetY + 4,
          scaleX: settleScale * 1.03,
          scaleY: settleScale * 0.92,
          rotation: travelDirection * 8,
          rotationX: -30,
          duration: 0.08,
          ease: 'power2.out',
        }))

        trackLandingTween(gsap.to(overlayEl.value, {
          x: settleTargetX,
          y: settleTargetY,
          scaleX: settleScale,
          scaleY: settleScale,
          rotation: finalRotation,
          rotationX: finalRotationX,
          duration: 0.18,
          ease: 'power2.out',
          onComplete: () => {
            if (!overlayEl.value || stage.value !== 'playing') {
              cleanup()
              return
            }

            emit('card-landed')
            if (!overlayEl.value) {
              cleanup()
              return
            }

            trackLandingTween(gsap.to(overlayEl.value, {
              opacity: 0,
              duration: 0.04,
              ease: 'power1.out',
            }))
          },
        }))

        trackLandingTween(gsap.to(burstEl.value, {
          opacity: 0,
          scale: 1.45,
          duration: 0.16,
          ease: 'power2.out',
        }))

        trackLandingTween(gsap.to(trailEl.value, {
          opacity: 0,
          duration: 0.12,
          ease: 'power1.out',
          onComplete: cleanup,
        }))
      },
    }))

    trackLandingTween(gsap.to(trailMotion, {
      t: 1,
      duration: 0.9,
      ease: 'power2.in',
      onUpdate: () => {
        if (!trailEl.value || stage.value !== 'playing') {
          return
        }

        const p = trailMotion.t
        const point = getQuadraticPoint(startPoint, controlPoint, endPoint, p)
        const fadeIn = p < 0.16 ? p / 0.16 : 1
        const fadeOut = p > 0.78 ? 1 - (p - 0.78) / 0.22 : 1

        gsap.set(trailEl.value, {
          x: point.x,
          y: point.y,
          scale: lerp(1.02, 1.08, Math.min(p / 0.45, 1)),
          opacity: 0.46 * Math.min(fadeIn, fadeOut),
        })
      },
    }))
  }

  playTimeline = gsap.timeline({
    onInterrupt: () => {
      playTimeline = null
    },
  })

  playTimeline.to(overlayEl.value, {
    x: centerX,
    y: centerY,
    scaleX: showcaseScale,
    scaleY: showcaseScale,
    rotation: 0,
    rotationX: 0,
    duration: 0.42,
    ease: 'power3.out',
  })

  playTimeline.to(showcaseEl.value, {
    opacity: 1,
    scale: 1,
    duration: 0.18,
    ease: 'power2.out',
  }, '-=0.08')

  playTimeline.to(flipperEl.value, {
    rotationY: 0,
    duration: 0.34,
    ease: 'power2.inOut',
  })

  playTimeline.to(overlayEl.value, {
    scaleX: showcaseScale * 1.08,
    scaleY: showcaseScale * 1.08,
    duration: 0.16,
    ease: 'power1.inOut',
  }, '<+=0.08')

  playTimeline.to(overlayEl.value, {
    scaleX: showcaseScale,
    scaleY: showcaseScale,
    duration: 0.14,
    ease: 'power1.out',
  })

  playTimeline.to({}, {
    duration: 0.72,
  })

  playTimeline.to(showcaseEl.value, {
    opacity: 0,
    scale: 1.22,
    duration: 0.18,
    ease: 'power2.out',
  })

  playTimeline.call(runLandingAnimation, null, '<')
}

watch(
  () => props.playTicket,
  () => {
    animatePlay()
  },
)

watch(
  () => [props.activeCard, props.originRect],
  () => {
    if (!hasActiveCard.value) {
      stopActiveAnimation()
      resetLayer()
    }
  },
  { immediate: true, deep: true },
)

onUnmounted(() => {
  stopActiveAnimation()
})
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
      <GameCard
        :name="activeCard.name"
        :background-url="activeCard.backgroundUrl"
        :frame-url="activeCard.frameUrl"
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
      ref="showcaseEl"
      class="enemy-card-play-showcase fixed pointer-events-none"
      :style="showcaseStyle"
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
      <div ref="flipperEl" class="enemy-card-play-layer__flipper">
        <div class="enemy-card-play-layer__face enemy-card-play-layer__face--front">
          <GameCard
            :name="activeCard.name"
            :background-url="activeCard.backgroundUrl"
            :frame-url="activeCard.frameUrl"
          />
        </div>
        <div class="enemy-card-play-layer__face enemy-card-play-layer__face--back">
          <img
            :src="cardBackUrl"
            alt=""
            aria-hidden="true"
            class="block size-full select-none object-contain"
            draggable="false"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.enemy-card-play-layer {
  perspective: 1000px;
  transform-origin: 50% 50%;
  will-change: transform, opacity;
  filter: drop-shadow(0 18px 30px rgba(0, 19, 50, 0.44));
}

.enemy-card-play-layer__flipper {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  will-change: transform;
}

.enemy-card-play-layer__face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.enemy-card-play-layer__face--back {
  transform: rotateY(180deg);
}

.enemy-card-play-layer__glow {
  position: absolute;
  inset: -13%;
  border-radius: 18px;
  background:
    radial-gradient(circle at 50% 44%, rgba(255, 255, 255, 0.48), transparent 38%),
    radial-gradient(circle at 50% 50%, rgba(200, 168, 75, 0.5), transparent 64%);
  filter: blur(14px);
  opacity: 0.9;
  transform: scale(0.96);
}

.enemy-card-play-trail {
  z-index: 84;
  transform-origin: 50% 50%;
  will-change: transform, opacity;
  filter: blur(7px) saturate(1.08);
  opacity: 0;
}

.enemy-card-play-burst {
  z-index: 83;
  border-radius: 999px;
  background:
    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0.28) 14%, transparent 52%),
    radial-gradient(circle at 50% 50%, rgba(200, 168, 75, 0.92), rgba(200, 168, 75, 0.1) 38%, transparent 74%);
  filter: blur(12px);
  mix-blend-mode: screen;
  transform-origin: 50% 50%;
}

.enemy-card-play-showcase {
  z-index: 82;
  width: min(58vmin, 520px);
  aspect-ratio: 1;
  border-radius: 999px;
  background:
    radial-gradient(circle, rgba(255, 255, 255, 0.9) 0 5%, transparent 22%),
    radial-gradient(circle, rgba(200, 168, 75, 0.86) 0 18%, rgba(107, 184, 212, 0.22) 42%, transparent 68%);
  filter: blur(14px);
  mix-blend-mode: screen;
  transform: translate(-50%, -50%);
  transform-origin: 50% 50%;
}

@media (prefers-reduced-motion: reduce) {
  .enemy-card-play-layer,
  .enemy-card-play-layer__flipper,
  .enemy-card-play-trail {
    will-change: auto;
  }
}
</style>
