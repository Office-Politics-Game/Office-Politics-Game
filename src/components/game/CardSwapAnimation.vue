<script setup>
import { nextTick, onUnmounted, ref } from 'vue'
import { gsap } from 'gsap'
import cardBackUrl from '@/assets/images/card-bg-back.webp'

const selfCardRef = ref(null)
const selfFlipperRef = ref(null)
const opponentCardRef = ref(null)
const opponentFlipperRef = ref(null)
const veilRef = ref(null)
const exchangeLineRef = ref(null)
const activeSelfCard = ref(null)
const activeOpponentCard = ref(null)
const selfStyle = ref({ display: 'none' })
const opponentStyle = ref({ display: 'none' })

let timeline = null

function rectToFixedStyle(rect) {
  return {
    display: 'block',
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  }
}

function getCenter(rect) {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  }
}

function getTravel(fromRect, toRect) {
  const fromCenter = getCenter(fromRect)
  const toCenter = getCenter(toRect)

  return {
    x: toCenter.x - fromCenter.x,
    y: toCenter.y - fromCenter.y,
    scale: toRect.height / fromRect.height,
  }
}

function getShowcaseTravel(rect, offsetX) {
  const center = getCenter(rect)

  return {
    x: window.innerWidth / 2 + offsetX - center.x,
    y: window.innerHeight / 2 - center.y,
  }
}

function resetLayer() {
  activeSelfCard.value = null
  activeOpponentCard.value = null
  selfStyle.value = { display: 'none' }
  opponentStyle.value = { display: 'none' }
}

function stop() {
  timeline?.kill()
  timeline = null
  gsap.killTweensOf([
    selfCardRef.value,
    selfFlipperRef.value,
    opponentCardRef.value,
    opponentFlipperRef.value,
    veilRef.value,
    exchangeLineRef.value,
  ].filter(Boolean))
  resetLayer()
}

function playReducedMotion({
  selfCardElement,
  selfFlipperElement,
  opponentCardElement,
  opponentFlipperElement,
  veilElement,
  exchangeLineElement,
  selfTravel,
  opponentTravel,
  onSwap,
  resolve,
}) {
  timeline = gsap.timeline({
    defaults: { ease: 'power1.out' },
    onComplete: () => {
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
    .set([selfCardElement, opponentCardElement], {
      autoAlpha: 0,
      scale: 1,
      rotation: 0,
    })
    .set(selfFlipperElement, { rotationY: 0 })
    .set(opponentFlipperElement, { rotationY: 180 })
    .to(veilElement, { autoAlpha: 1, duration: 0.08 })
    .to([selfCardElement, opponentCardElement], { autoAlpha: 1, duration: 0.12 }, '<')
    .to(exchangeLineElement, { autoAlpha: 0.72, scaleX: 1, duration: 0.1 }, '<')
    .call(() => onSwap?.())
    .set(selfCardElement, {
      x: selfTravel.x,
      y: selfTravel.y,
      scale: selfTravel.scale,
    })
    .set(opponentCardElement, {
      x: opponentTravel.x,
      y: opponentTravel.y,
      scale: opponentTravel.scale,
    })
    .set(selfFlipperElement, { rotationY: 180 })
    .set(opponentFlipperElement, { rotationY: 0 })
    .to(exchangeLineElement, { autoAlpha: 0, duration: 0.12 })
    .to([selfCardElement, opponentCardElement, veilElement], { autoAlpha: 0, duration: 0.12 }, '<')
}

function playFullMotion({
  selfCardElement,
  selfFlipperElement,
  opponentCardElement,
  opponentFlipperElement,
  veilElement,
  exchangeLineElement,
  selfTravel,
  opponentTravel,
  selfShowcase,
  opponentShowcase,
  onSwap,
  resolve,
}) {
  timeline = gsap.timeline({
    defaults: { ease: 'power3.out' },
    onComplete: () => {
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
    .to(veilElement, { autoAlpha: 1, duration: 0.16, ease: 'power1.out' })
    .to(selfFlipperElement, {
      rotationY: 180,
      duration: 0.24,
      ease: 'power2.inOut',
    }, '<')
    .to(selfCardElement, {
      x: selfShowcase.x,
      y: selfShowcase.y,
      scale: 1.24,
      rotation: -7,
      duration: 0.48,
      ease: 'expo.out',
    }, '-=0.04')
    .to(opponentCardElement, {
      x: opponentShowcase.x,
      y: opponentShowcase.y,
      scale: 1.24,
      rotation: 7,
      duration: 0.48,
      ease: 'expo.out',
    }, '<')
    .to(exchangeLineElement, {
      autoAlpha: 0.8,
      scaleX: 1,
      duration: 0.18,
      ease: 'power2.out',
    }, '-=0.16')
    .to(selfCardElement, {
      x: opponentShowcase.x,
      y: opponentShowcase.y,
      rotation: 7,
      duration: 0.34,
      ease: 'power2.inOut',
    })
    .to(opponentCardElement, {
      x: selfShowcase.x,
      y: selfShowcase.y,
      rotation: -7,
      duration: 0.34,
      ease: 'power2.inOut',
    }, '<')
    .call(() => onSwap?.())
    .to(exchangeLineElement, {
      autoAlpha: 0,
      scaleX: 1.16,
      duration: 0.16,
      ease: 'power2.in',
    })
    .to(selfCardElement, {
      x: selfTravel.x,
      y: selfTravel.y,
      scale: selfTravel.scale,
      rotation: -8,
      duration: 0.42,
      ease: 'power3.inOut',
    }, '<')
    .to(opponentCardElement, {
      x: opponentTravel.x,
      y: opponentTravel.y,
      scale: opponentTravel.scale,
      rotation: 3,
      duration: 0.42,
      ease: 'power3.inOut',
    }, '<')
    .to(opponentFlipperElement, {
      rotationY: 0,
      duration: 0.24,
      ease: 'power2.inOut',
    }, '-=0.18')
    .to([selfCardElement, opponentCardElement, veilElement], {
      autoAlpha: 0,
      duration: 0.14,
      ease: 'power1.in',
    })
}

async function play({
  selfCard,
  opponentCard,
  selfRect,
  opponentRect,
  onSwap,
} = {}) {
  if (!selfCard || !opponentCard || !selfRect || !opponentRect) {
    return false
  }

  timeline?.kill()
  activeSelfCard.value = selfCard
  activeOpponentCard.value = opponentCard
  selfStyle.value = rectToFixedStyle(selfRect)
  opponentStyle.value = rectToFixedStyle(opponentRect)

  await nextTick()

  const elements = {
    selfCardElement: selfCardRef.value,
    selfFlipperElement: selfFlipperRef.value,
    opponentCardElement: opponentCardRef.value,
    opponentFlipperElement: opponentFlipperRef.value,
    veilElement: veilRef.value,
    exchangeLineElement: exchangeLineRef.value,
  }

  if (Object.values(elements).some((element) => !element)) {
    resetLayer()
    return false
  }

  const selfTravel = getTravel(selfRect, opponentRect)
  const opponentTravel = getTravel(opponentRect, selfRect)
  const selfShowcase = getShowcaseTravel(selfRect, -window.innerWidth * 0.09)
  const opponentShowcase = getShowcaseTravel(opponentRect, window.innerWidth * 0.09)
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  gsap.set(elements.veilElement, { autoAlpha: 0 })
  gsap.set(elements.exchangeLineElement, {
    autoAlpha: 0,
    xPercent: -50,
    yPercent: -50,
    scaleX: 0.42,
    transformOrigin: '50% 50%',
  })
  gsap.set([elements.selfCardElement, elements.opponentCardElement], {
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    autoAlpha: 1,
    transformOrigin: '50% 50%',
    transformPerspective: 1200,
  })
  gsap.set(elements.selfFlipperElement, {
    rotationY: 0,
    transformStyle: 'preserve-3d',
  })
  gsap.set(elements.opponentFlipperElement, {
    rotationY: 180,
    transformStyle: 'preserve-3d',
  })

  return new Promise((resolve) => {
    const options = {
      ...elements,
      selfTravel,
      opponentTravel,
      selfShowcase,
      opponentShowcase,
      onSwap,
      resolve,
    }

    if (reduceMotion) {
      playReducedMotion(options)
      return
    }

    playFullMotion(options)
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
    <div ref="veilRef" class="card-swap-animation__veil"></div>
    <div ref="exchangeLineRef" class="card-swap-animation__line"></div>

    <div
      v-if="activeSelfCard"
      ref="selfCardRef"
      class="card-swap-animation__card"
      :style="selfStyle"
      aria-hidden="true"
    >
      <div class="card-swap-animation__glow" :style="{ '--accent': activeSelfCard.color }"></div>
      <div ref="selfFlipperRef" class="card-swap-animation__flipper">
        <div class="card-swap-animation__face card-swap-animation__face--front">
          <img :src="activeSelfCard.backgroundUrl" alt="" draggable="false" />
          <img :src="activeSelfCard.frameUrl" alt="" draggable="false" />
        </div>
        <div class="card-swap-animation__face card-swap-animation__face--back">
          <img :src="cardBackUrl" alt="" draggable="false" />
        </div>
      </div>
    </div>

    <div
      v-if="activeOpponentCard"
      ref="opponentCardRef"
      class="card-swap-animation__card"
      :style="opponentStyle"
      aria-hidden="true"
    >
      <div class="card-swap-animation__glow" :style="{ '--accent': activeOpponentCard.color }"></div>
      <div ref="opponentFlipperRef" class="card-swap-animation__flipper">
        <div class="card-swap-animation__face card-swap-animation__face--front">
          <img :src="activeOpponentCard.backgroundUrl" alt="" draggable="false" />
          <img :src="activeOpponentCard.frameUrl" alt="" draggable="false" />
        </div>
        <div class="card-swap-animation__face card-swap-animation__face--back">
          <img :src="cardBackUrl" alt="" draggable="false" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.card-swap-animation__veil,
.card-swap-animation__line {
  position: fixed;
  pointer-events: none;
}

.card-swap-animation__veil {
  inset: 0;
  z-index: 60;
  background:
    radial-gradient(circle at 50% 50%, rgba(134, 179, 224, 0.24), transparent 30%),
    linear-gradient(120deg, rgba(0, 19, 50, 0.78), rgba(70, 85, 99, 0.44));
}

.card-swap-animation__line {
  top: 50%;
  left: 50%;
  z-index: 61;
  width: min(72vw, 660px);
  height: 3px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--brand-primary) 18%,
    var(--surface-glass-hover) 50%,
    var(--brand-primary) 82%,
    transparent
  );
  box-shadow: 0 0 24px rgba(134, 179, 224, 0.82);
}

.card-swap-animation__card {
  position: fixed;
  z-index: 62;
  perspective: 1200px;
  pointer-events: none;
  transform-origin: 50% 50%;
  will-change: transform, opacity;
}

.card-swap-animation__glow {
  position: absolute;
  inset: -18%;
  border-radius: 0;
  background:
    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.42), transparent 34%),
    radial-gradient(circle at 50% 50%, var(--accent), transparent 66%);
  filter: blur(16px);
  opacity: 0.72;
}

.card-swap-animation__flipper {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  will-change: transform;
}

.card-swap-animation__face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  filter:
    drop-shadow(0 0 16px rgba(134, 179, 224, 0.36))
    drop-shadow(0 22px 30px rgba(0, 19, 50, 0.52));
}

.card-swap-animation__face img {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
}

.card-swap-animation__face--back {
  transform: rotateY(180deg);
}

@media (prefers-reduced-motion: reduce) {
  .card-swap-animation__card,
  .card-swap-animation__flipper {
    will-change: auto;
  }
}
</style>
