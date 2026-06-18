<script setup>
import { nextTick, onUnmounted, ref } from 'vue'
import { gsap } from 'gsap'
import cardBackUrl from '@/assets/images/card-bg-back.webp'

const shuffleCardElements = ref([])
const shuffleDeckStyle = ref({ display: 'none' })
const visibleCardCount = ref(0)
let timeline = null

function deckPoseToFixedStyle(deckPose) {
  const rect = deckPose.rect
  const width = deckPose.width || rect.width
  const height = deckPose.height || rect.height

  return {
    display: 'block',
    left: `${rect.left + rect.width / 2 - width / 2}px`,
    top: `${rect.bottom - height}px`,
    width: `${width}px`,
    height: `${height}px`,
    transform: `perspective(${deckPose.transformPerspective || 900}px) rotateX(${deckPose.rotationX || 0}deg) rotateY(${deckPose.rotationY || 0}deg) rotateZ(${deckPose.rotationZ || 0}deg)`,
    transformOrigin: '50% 100%',
  }
}

function setShuffleCardElement(index, element) {
  if (element) {
    shuffleCardElements.value[index] = element
    return
  }

  delete shuffleCardElements.value[index]
}

function waitForTimeline(buildTimeline) {
  return new Promise((resolve) => {
    timeline?.kill()
    timeline = buildTimeline(resolve)
  })
}

async function play({ deckPose, deckRect, deckCount }) {
  const resolvedDeckPose = deckPose ?? (deckRect
    ? {
        rect: deckRect,
        width: deckRect.width,
        height: deckRect.height,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        transformPerspective: 900,
      }
    : null)

  if (!resolvedDeckPose?.rect || deckCount <= 0) {
    return
  }

  visibleCardCount.value = Math.min(deckCount, 6)
  shuffleDeckStyle.value = deckPoseToFixedStyle(resolvedDeckPose)
  await nextTick()

  const shuffleCards = shuffleCardElements.value.filter(Boolean)
  const motionWidth = resolvedDeckPose.width || resolvedDeckPose.rect.width
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  gsap.set(shuffleCards, {
    x: 0,
    y: 0,
    rotationX: 0,
    rotationY: 0,
    rotationZ: (index) => -1 + (index - 2) * 0.45,
    zIndex: (index) => index + 1,
    opacity: 1,
    scale: 1,
    transformPerspective: 0,
    transformOrigin: '50% 50%',
  })

  await waitForTimeline((resolve) => {
    const nextTimeline = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onComplete: resolve,
    })

    if (reduceMotion) {
      nextTimeline
        .to(shuffleCards, { filter: 'brightness(1.18)', duration: 0.14 })
        .to(shuffleCards, { filter: 'brightness(1)', duration: 0.14 })

      return nextTimeline
    }

    nextTimeline
      .to(shuffleCards, {
        x: (index) => (index % 2 === 0 ? -motionWidth * 0.42 : motionWidth * 0.42),
        y: (index) => -10 + (index % 3) * 7,
        rotationZ: (index) => (index % 2 === 0 ? -16 : 14) + index,
        duration: 0.18,
        stagger: 0.025,
      })
      .to(shuffleCards, {
        x: (index) => (index % 2 === 0 ? motionWidth * 0.38 : -motionWidth * 0.38),
        y: (index) => 8 - (index % 3) * 6,
        rotationZ: (index) => (index % 2 === 0 ? 13 : -15) - index,
        duration: 0.2,
        stagger: 0.02,
      })
      .to(shuffleCards, {
        x: (index) => (index % 2 === 0 ? -motionWidth * 0.24 : motionWidth * 0.24),
        y: (index) => (index % 2 === 0 ? -6 : 6),
        rotationZ: (index) => (index % 2 === 0 ? -9 : 8),
        duration: 0.15,
        stagger: 0.018,
      })
      .to(shuffleCards, {
        x: 0,
        y: 0,
        rotationZ: (index) => -1 + (index - 2) * 0.45,
        duration: 0.24,
        stagger: {
          each: 0.018,
          from: 'edges',
        },
        ease: 'back.out(1.8)',
      })

    return nextTimeline
  })

  gsap.set(shuffleCards, {
    x: 0,
    y: 0,
    rotationX: 0,
    rotationY: 0,
    rotationZ: -1,
    scale: 1,
    opacity: 1,
  })
  shuffleDeckStyle.value = { display: 'none' }
  visibleCardCount.value = 0
  timeline = null
}

onUnmounted(() => {
  timeline?.kill()
})

defineExpose({
  play,
})
</script>

<template>
  <div
    v-if="visibleCardCount > 0"
    class="card-shuffle"
    :style="shuffleDeckStyle"
    aria-hidden="true"
  >
    <img
      v-for="index in visibleCardCount"
      :key="`shuffle-card-${index}`"
      :ref="(element) => setShuffleCardElement(index - 1, element)"
      :src="cardBackUrl"
      alt=""
      class="card-shuffle__card"
      draggable="false"
    />
  </div>
</template>

<style scoped>
.card-shuffle {
  position: fixed;
  z-index: 42;
  pointer-events: none;
}

.card-shuffle__card {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
  filter:
    drop-shadow(0 3px 3px rgba(0, 19, 50, 0.34))
    drop-shadow(0 9px 10px rgba(0, 19, 50, 0.24));
  transform-origin: 50% 50%;
  will-change: transform;
}

@media (prefers-reduced-motion: reduce) {
  .card-shuffle__card {
    will-change: auto;
  }
}
</style>
