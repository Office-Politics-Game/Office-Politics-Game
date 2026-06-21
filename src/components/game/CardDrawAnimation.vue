<script setup>
import { onUnmounted, ref } from 'vue'
import { gsap } from 'gsap'
import cardBackUrl from '@/assets/images/card-bg-back.webp'
import GameCard from './GameCard.vue'

defineProps({
  card: {
    type: Object,
    default: null,
  },
})

const drawCardElement = ref(null)
const cardFlipper = ref(null)
const revealFront = ref(true)
let timeline

function waitForTimeline(buildTimeline) {
  return new Promise((resolve) => {
    timeline?.kill()
    timeline = buildTimeline(resolve)
  })
}

function playReducedMotion({ targetRect, onLanded, revealFront }) {
  return waitForTimeline((resolve) => {
    const nextTimeline = gsap.timeline({
      onComplete: resolve,
    })

    gsap.set(drawCardElement.value, {
      width: targetRect.width,
      height: targetRect.height,
      x: targetRect.left,
      y: targetRect.top,
      scale: 0.96,
      autoAlpha: 0,
    })
    gsap.set(cardFlipper.value, { rotationY: 0 })

    nextTimeline
      .to(drawCardElement.value, {
        autoAlpha: 1,
        scale: 1,
        duration: 0.18,
        ease: 'power1.out',
      })

    if (revealFront) {
      nextTimeline.to(cardFlipper.value, {
        rotationY: 180,
        duration: 0.18,
        ease: 'power1.inOut',
      })
    }

    nextTimeline
      .call(onLanded)
      .to(drawCardElement.value, { autoAlpha: 0, duration: 0.12 }, '+=0.18')

    return nextTimeline
  })
}

function playFullMotion({ startRect, targetRect, onLanded, revealFront }) {
  return waitForTimeline((resolve) => {
    const startScale = startRect.width / targetRect.width
    const startX = startRect.left + (startRect.width - targetRect.width) / 2
    const startY = startRect.top + (startRect.height - targetRect.height) / 2
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

    gsap.set(drawCardElement.value, {
      width: targetRect.width,
      height: targetRect.height,
      x: startX,
      y: startY,
      scale: startScale,
      rotation: -2,
      autoAlpha: 1,
      transformOrigin: '50% 50%',
    })
    gsap.set(cardFlipper.value, {
      rotationY: 0,
      transformPerspective: 1000,
      transformOrigin: '50% 50%',
    })

    nextTimeline
      .to(drawCardElement.value, {
        y: startY - 18,
        scale: startScale * 1.04,
        duration: 0.18,
        ease: 'power2.out',
      })
      .to(drawCardElement.value, {
        x: arcX,
        y: arcY,
        scale: startScale + (1 - startScale) * 0.55,
        rotation: 2,
        duration: 0.3,
        ease: 'power2.inOut',
      })
      .to(drawCardElement.value, {
        x: endX,
        y: endY,
        scale: 1,
        rotation: 5,
        duration: 0.45,
        ease: 'back.out(1.35)',
      })

    if (revealFront) {
      nextTimeline.to(cardFlipper.value, {
        rotationY: 180,
        duration: 0.42,
        ease: 'power2.inOut',
      })
    }

    nextTimeline
      .call(onLanded)
      .to(drawCardElement.value, { autoAlpha: 0, duration: 0.12 })

    return nextTimeline
  })
}

function play(options) {
  if (!drawCardElement.value || !cardFlipper.value) {
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

onUnmounted(() => {
  timeline?.kill()
})

defineExpose({
  selfDraw,
  othersDraw,
  play,
})
</script>

<template>
  <div
    ref="drawCardElement"
    class="card-draw pointer-events-none fixed top-0 left-0 z-40 invisible"
    aria-hidden="true"
  >
    <div ref="cardFlipper" class="card-draw__flipper relative size-full">
      <img
        :src="cardBackUrl"
        alt=""
        class="card-draw__face card-draw__face--back absolute inset-0 block size-full object-contain"
        draggable="false"
      />
      <div
        v-show="revealFront"
        class="card-draw__face card-draw__face--front absolute inset-0 size-full"
      >
        <GameCard
          v-if="card"
          :name="card.name"
          :background-url="card.backgroundUrl"
          :frame-url="card.frameUrl"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-draw {
  filter: drop-shadow(0 16px 20px rgba(0, 19, 50, 0.4));
  will-change: transform, opacity;
}

.card-draw__flipper {
  transform-style: preserve-3d;
  will-change: transform;
}

.card-draw__face {
  backface-visibility: hidden;
}

.card-draw__face--front {
  transform: rotateY(180deg);
}

@media (prefers-reduced-motion: reduce) {
  .card-draw,
  .card-draw__flipper {
    will-change: auto;
  }
}
</style>
