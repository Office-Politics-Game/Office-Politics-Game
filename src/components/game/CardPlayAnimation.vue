<script setup>
import { nextTick, onUnmounted, ref } from 'vue'
import { gsap } from 'gsap'
import cardBackUrl from '@/assets/images/card-bg-back.webp'

const flyingCardRef = ref(null)
const flipperRef = ref(null)
const veilRef = ref(null)
const ringRef = ref(null)
const slashRef = ref(null)
const shockwaveRef = ref(null)
const activeCard = ref(null)
const flyingStyle = ref({ display: 'none' })
const shockwaveStyle = ref({ display: 'none' })
let timeline = null

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
    flyingCardRef.value,
    flipperRef.value,
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

  const flyingRect = createFlyingRect(originRect)
  const originScale = originRect.height / flyingRect.height
  flyingStyle.value = rectToFixedStyle(flyingRect)
  shockwaveStyle.value = {
    display: 'block',
    left: `${targetRect.left + targetRect.width / 2}px`,
    top: `${targetRect.top + targetRect.height / 2}px`,
  }

  await nextTick()

  if (!flyingCardRef.value || !flipperRef.value || !veilRef.value || !ringRef.value || !slashRef.value || !shockwaveRef.value) {
    resetLayer()
    return false
  }

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
    rotation: getSourceRotation(position),
    rotationX: position === 'bottom' ? -10 : 16,
    transformPerspective: 1200,
    transformOrigin: '50% 50%',
    opacity: 1,
    filter: 'brightness(1)',
  })
  gsap.set(flipperRef.value, {
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
        duration: faceUp ? 0.01 : 0.34,
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

    <div
      v-if="activeCard"
      ref="flyingCardRef"
      class="card-play-animation__flying-card"
      :style="flyingStyle"
      aria-hidden="true"
    >
      <div class="card-play-animation__card-glow" :style="{ '--accent': activeCard.color }"></div>
      <div ref="flipperRef" class="card-play-animation__flipper">
        <div class="card-play-animation__face card-play-animation__face--front">
          <img :src="activeCard.backgroundUrl" alt="" draggable="false" />
          <img :src="activeCard.frameUrl" alt="" draggable="false" />
        </div>
        <div class="card-play-animation__face card-play-animation__face--back">
          <img :src="cardBackUrl" alt="" draggable="false" />
        </div>
      </div>
    </div>
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
  position: fixed;
  z-index: 57;
  perspective: 1200px;
  transform-origin: 50% 50%;
  image-rendering: auto;
  will-change: transform, opacity, filter;
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

.card-play-animation__flipper {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
}

.card-play-animation__face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  filter:
    drop-shadow(0 0 16px rgba(250, 204, 21, 0.34))
    drop-shadow(0 24px 32px rgba(0, 0, 0, 0.5));
}

.card-play-animation__face img {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
}

.card-play-animation__face--back {
  transform: rotateY(180deg);
}
</style>
