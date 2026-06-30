<script setup>
import { onUnmounted, ref } from 'vue'
import { gsap } from 'gsap'
import { getRectCenteredOffset } from '@/composables/useGameAnimationRects'
import EffectCardLayer from './EffectCardLayer.vue'

defineProps({
  card: {
    type: Object,
    default: null,
  },
})

const drawCardLayer = ref(null)
const revealFront = ref(true)
let timeline

function getCardElement() {
  return drawCardLayer.value?.getCardElement?.() ?? null
}

function getFlipperElement() {
  return drawCardLayer.value?.getFlipperElement?.() ?? null
}

function waitForTimeline(buildTimeline) {
  return new Promise((resolve) => {
    timeline?.kill()
    timeline = buildTimeline(resolve)
  })
}

function playReducedMotion({ targetRect, onLanded, revealFront }) {
  return waitForTimeline((resolve) => {
    const cardElement = getCardElement()
    const flipperElement = getFlipperElement()
    const nextTimeline = gsap.timeline({
      onComplete: resolve,
    })

    gsap.set(cardElement, {
      width: targetRect.width,
      height: targetRect.height,
      x: targetRect.left,
      y: targetRect.top,
      scale: 0.96,
      autoAlpha: 0,
    })
    gsap.set(flipperElement, { rotationY: 0 })

    nextTimeline
      .to(cardElement, {
        autoAlpha: 1,
        scale: 1,
        duration: 0.18,
        ease: 'power1.out',
      })

    if (revealFront) {
      nextTimeline.to(flipperElement, {
        rotationY: 180,
        duration: 0.18,
        ease: 'power1.inOut',
      })
    }

    nextTimeline
      .call(onLanded)
      .to(cardElement, { autoAlpha: 0, duration: 0.12 }, '+=0.18')

    return nextTimeline
  })
}

function playFullMotion({ startRect, targetRect, onLanded, revealFront }) {
  return waitForTimeline((resolve) => {
    const cardElement = getCardElement()
    const flipperElement = getFlipperElement()
    const startOffset = getRectCenteredOffset(startRect, targetRect)
    if (!cardElement || !flipperElement || !startOffset) {
      resolve()
      return gsap.timeline()
    }

    const startScale = startRect.width / targetRect.width
    const startX = startOffset.x
    const startY = startOffset.y
    const endX = targetRect.left
    const endY = targetRect.top
    const arcX = startX + (endX - startX) * 0.45
    const arcY =
      Math.min(startY, endY) -
      Math.max(56, Math.abs(endY - startY) * 0.18)
    const nextTimeline = gsap.timeline({
      defaults: { ease: 'power2.out' },
      onComplete: resolve,
    })

    gsap.set(cardElement, {
      width: targetRect.width,
      height: targetRect.height,
      x: startX,
      y: startY,
      scale: startScale,
      rotation: -2,
      autoAlpha: 1,
      transformOrigin: '50% 50%',
    })
    gsap.set(flipperElement, {
      rotationY: 0,
      transformPerspective: 1000,
      transformOrigin: '50% 50%',
    })

    nextTimeline
      .to(cardElement, {
        y: startY - 18,
        scale: startScale * 1.04,
        duration: 0.18,
        ease: 'power2.out',
      })
      .to(cardElement, {
        x: arcX,
        y: arcY,
        scale: startScale + (1 - startScale) * 0.55,
        rotation: 2,
        duration: 0.3,
        ease: 'power2.inOut',
      })
      .to(cardElement, {
        x: endX,
        y: endY,
        scale: 1,
        rotation: 5,
        duration: 0.45,
        ease: 'back.out(1.35)',
      })

    if (revealFront) {
      nextTimeline.to(flipperElement, {
        rotationY: 180,
        duration: 0.42,
        ease: 'power2.inOut',
      })
    }

    nextTimeline
      .call(onLanded)
      .to(cardElement, { autoAlpha: 0, duration: 0.12 })

    return nextTimeline
  })
}

function play(options) {
  if (!getCardElement() || !getFlipperElement()) {
    return Promise.resolve()
  }

  const drawOptions = {
    ...options,
    revealFront: options.revealFront ?? true,
  }

  revealFront.value = drawOptions.revealFront
  const reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches

  return reduceMotion ? playReducedMotion(drawOptions) : playFullMotion(drawOptions)
}

function selfDraw(options) {
  return play({
    ...options,
    revealFront: true,
  })
}

function othersDraw(options) {
  return play({
    ...options,
    revealFront: false,
  })
}

function stop() {
  timeline?.kill()
  timeline = null
}

onUnmounted(() => {
  stop()
})

defineExpose({
  selfDraw,
  othersDraw,
  play,
  stop,
})
</script>

<template>
  <EffectCardLayer
    ref="drawCardLayer"
    class="card-draw pointer-events-none fixed top-0 left-0 z-40 invisible"
    :card="card"
    :show-front="revealFront"
    front-flipped
    aria-hidden="true"
  />
</template>

<style scoped>
.card-draw {
  filter: drop-shadow(0 16px 20px rgba(0, 19, 50, 0.4));
  will-change: transform, opacity;
}

@media (prefers-reduced-motion: reduce) {
  .card-draw {
    will-change: auto;
  }
}
</style>
