<script setup>
import { nextTick, onUnmounted, ref } from 'vue'
import { gsap } from 'gsap'
import {
  createFlyingCardRect,
  getRectCenter,
  getTranslation,
  getViewportCenterTranslation,
  rectToFixedStyle,
} from '@/composables/useGameAnimationRects'
import EffectCardLayer from './EffectCardLayer.vue'

const flyingCardLayer = ref(null)
const veilRef = ref(null)
const ringRef = ref(null)
const slashRef = ref(null)
const shockwaveRef = ref(null)
const activeCard = ref(null)
const flyingStyle = ref({ display: 'none' })
const shockwaveStyle = ref({ display: 'none' })
let timeline = null

function getFlyingCardElement() {
  return flyingCardLayer.value?.getCardElement?.() ?? null
}

function getFlipperElement() {
  return flyingCardLayer.value?.getFlipperElement?.() ?? null
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

function resetLayer() {
  activeCard.value = null
  flyingStyle.value = { display: 'none' }
  shockwaveStyle.value = { display: 'none' }
}

function stop() {
  timeline?.kill()
  timeline = null
  gsap.killTweensOf([
    getFlyingCardElement(),
    getFlipperElement(),
    veilRef.value,
    ringRef.value,
    slashRef.value,
    shockwaveRef.value,
  ].filter(Boolean))
  resetLayer()
}

async function play({
  card,
  originRect,
  targetRect,
  position = 'bottom',
  faceUp = true,
  onComplete,
} = {}) {
  if (!card || !originRect || !targetRect) {
    return false
  }

  timeline?.kill()
  activeCard.value = card

  const flyingRect = createFlyingCardRect(originRect)
  const targetCenter = getRectCenter(targetRect)
  const centerTranslation = getViewportCenterTranslation(flyingRect)
  const landTranslation = getTranslation(flyingRect, targetRect)

  if (!flyingRect || !targetCenter || !centerTranslation || !landTranslation) {
    resetLayer()
    return false
  }

  const originScale = originRect.height / flyingRect.height
  flyingStyle.value = rectToFixedStyle(flyingRect)
  shockwaveStyle.value = {
    display: 'block',
    left: `${targetCenter.x}px`,
    top: `${targetCenter.y}px`,
  }

  await nextTick()

  const flyingCardElement = getFlyingCardElement()
  const flipperElement = getFlipperElement()

  if (!flyingCardElement || !flipperElement || !veilRef.value || !ringRef.value || !slashRef.value || !shockwaveRef.value) {
    resetLayer()
    return false
  }

  const centerX = centerTranslation.x
  const centerY = centerTranslation.y
  const landX = landTranslation.x
  const landY = landTranslation.y
  const showcaseScale = Math.min(1.9, Math.max(1.16, window.innerHeight * 0.48 / flyingRect.height))
  const landScale = targetRect.height / flyingRect.height
  const travelDirection = Math.sign(landX - centerX || landY - centerY || 1)

  gsap.set([veilRef.value, ringRef.value, slashRef.value, shockwaveRef.value], {
    opacity: 0,
  })
  gsap.set(flyingCardElement, {
    x: 0,
    y: 0,
    z: 0,
    scale: originScale,
    rotation: getSourceRotation(position),
    rotationX: position === 'bottom' ? -10 : 16,
    transformPerspective: 1200,
    transformOrigin: '50% 50%',
    opacity: 1,
    filter: 'brightness(1)',
  })
  gsap.set(flipperElement, {
    rotationY: faceUp ? 0 : 180,
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

  return new Promise((resolve) => {
    timeline = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: () => {
        onComplete?.(card)
        resetLayer()
        timeline = null
        resolve(true)
      },
      onInterrupt: () => {
        timeline = null
        resolve(false)
      },
    })

    timeline
      .to(veilRef.value, { opacity: 1, duration: 0.14, ease: 'power1.out' })
      .to(slashRef.value, { opacity: 0.88, scaleX: 1, duration: 0.16 }, '<')
      .to(flyingCardElement, {
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
      .to(flipperElement, {
        rotationY: 0,
        duration: faceUp ? 0.01 : 0.34,
        ease: 'power2.inOut',
      }, '-=0.05')
      .to(flyingCardElement, {
        scale: showcaseScale * 1.06,
        filter: 'brightness(1.12)',
        duration: 0.14,
        ease: 'power1.out',
      })
      .to(flyingCardElement, {
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
      .to(flyingCardElement, {
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
      .to(flyingCardElement, {
        opacity: 0,
        duration: 0.04,
        ease: 'none',
      }, '<')
      .to(veilRef.value, {
        opacity: 0,
        duration: 0.2,
        ease: 'power1.in',
      }, '<')
  })
}

onUnmounted(() => {
  stop()
})

defineExpose({
  play,
  stop,
})
</script>

<template>
  <Teleport to="body">
    <div ref="veilRef" class="card-play-animation__veil"></div>
    <div ref="slashRef" class="card-play-animation__slash"></div>
    <div ref="ringRef" class="card-play-animation__ring"></div>
    <div
      ref="shockwaveRef"
      class="card-play-animation__shockwave"
      :style="shockwaveStyle"
    ></div>

    <EffectCardLayer
      v-if="activeCard"
      ref="flyingCardLayer"
      class="card-play-animation__flying-card"
      :card="activeCard"
      :style="flyingStyle"
      use-image-front
      aria-hidden="true"
    >
      <template #overlay>
        <div class="card-play-animation__card-glow" :style="{ '--accent': activeCard.color }"></div>
      </template>
    </EffectCardLayer>
  </Teleport>
</template>

<style scoped>
.card-play-animation__veil,
.card-play-animation__slash,
.card-play-animation__ring,
.card-play-animation__shockwave {
  position: fixed;
  pointer-events: none;
}

.card-play-animation__veil {
  inset: 0;
  z-index: 50;
  opacity: 0;
  background:
    radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.06), rgba(0, 0, 0, 0.7) 68%),
    linear-gradient(115deg, rgba(2, 6, 23, 0.76), rgba(15, 23, 42, 0.42));
}

.card-play-animation__slash {
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

.card-play-animation__ring {
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

.card-play-animation__shockwave {
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

.card-play-animation__flying-card {
  z-index: 57;
  image-rendering: auto;
  --effect-card-face-filter:
    drop-shadow(0 0 16px rgba(250, 204, 21, 0.34))
    drop-shadow(0 24px 32px rgba(0, 0, 0, 0.5));
}

.card-play-animation__card-glow {
  position: absolute;
  inset: -20%;
  border-radius: 18px;
  background:
    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.42), transparent 32%),
    radial-gradient(circle at 50% 50%, var(--accent), transparent 66%);
  filter: blur(16px);
  opacity: 0.78;
}

</style>
