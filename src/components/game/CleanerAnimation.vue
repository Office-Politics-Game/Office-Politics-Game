<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { gsap } from 'gsap'
import cardBackUrl from '@/assets/images/card-bg-back.webp'
import {
  createFixedCardRect,
  getEffectCardHeight,
  getScaleForHeight,
  getTranslation,
  getViewportCenterTranslation,
  rectToFixedStyle,
} from '@/composables/useGameAnimationRects'
import GameCard from './GameCard.vue'

const props = defineProps({
  result: { type: Object, default: null },
  getPlayerHandRect: { type: Function, default: null },
  isSelfPlayer: { type: Function, default: null },
})
const emit = defineEmits(['complete'])

const veilRef = ref(null)
const cardRef = ref(null)
const flipperRef = ref(null)
const activeResult = ref(null)
const cardStyle = ref({ display: 'none' })
let timeline = null
let activeId = null

function stop() {
  timeline?.kill()
  timeline = null
  gsap.killTweensOf([veilRef.value, cardRef.value, flipperRef.value].filter(Boolean))
}

function finish(result) {
  stop()
  activeResult.value = null
  activeId = null
  cardStyle.value = { display: 'none' }
  emit('complete', result)
}

async function play(result) {
  const originRect = props.getPlayerHandRect?.(result.targetPlayerId)
  const viewerRect = result.viewerPlayerId
    ? props.getPlayerHandRect?.(result.viewerPlayerId)
    : null
  const hiddenFromViewer = result.revealCard === false
  const startsFaceUp =
    hiddenFromViewer && props.isSelfPlayer?.(result.targetPlayerId)

  if (
    !originRect ||
    !result.targetCard ||
    (hiddenFromViewer && !viewerRect)
  ) {
    finish(result)
    return
  }

  stop()
  activeResult.value = result
  activeId = result.id
  const height = getEffectCardHeight()
  const fixedRect = createFixedCardRect(originRect, height)
  const viewerTranslation = getTranslation(originRect, viewerRect)
  const centerTranslation = getViewportCenterTranslation(originRect)
  const startScale = getScaleForHeight(originRect, height)
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const travelDuration = reduceMotion ? 0.12 : 0.46
  const flipDuration = reduceMotion ? 0.12 : 0.34

  cardStyle.value = rectToFixedStyle(fixedRect)
  await nextTick()
  if (
    activeId !== result.id ||
    !cardRef.value ||
    !flipperRef.value ||
    (!hiddenFromViewer && !veilRef.value)
  ) return

  gsap.set(cardRef.value, {
    x: 0,
    y: 0,
    scale: startScale,
    transformPerspective: 1200,
  })
  gsap.set(flipperRef.value, {
    rotationY: startsFaceUp ? 0 : 180,
    transformPerspective: 1200,
    transformStyle: 'preserve-3d',
  })
  timeline = gsap.timeline({ onComplete: () => finish(result) })

  timeline
    .to(cardRef.value, {
      x: hiddenFromViewer
        ? viewerTranslation.x
        : centerTranslation.x,
      y: hiddenFromViewer
        ? viewerTranslation.y
        : centerTranslation.y,
      scale: hiddenFromViewer
        ? getScaleForHeight(viewerRect, height) * 2
        : Math.min(1.2, Math.max(1, window.innerHeight * 0.52 / height)),
      duration: travelDuration,
      ease: reduceMotion ? 'none' : 'expo.out',
    })

  if (startsFaceUp) {
    timeline.to(
      flipperRef.value,
      {
        rotationY: 180,
        duration: flipDuration,
        ease: 'power2.inOut',
      },
      '<',
    )
  }

  if (!hiddenFromViewer) {
    timeline.to(flipperRef.value, {
      rotationY: 0,
      duration: flipDuration,
      ease: 'power2.inOut',
    })
  }

  timeline.to({}, { duration: 2 })

  if (!hiddenFromViewer) {
    timeline.to(flipperRef.value, {
      rotationY: 180,
      duration: flipDuration,
      ease: 'power2.inOut',
    })
  }

  timeline.to(
    cardRef.value,
    {
      x: 0,
      y: 0,
      scale: startScale,
      duration: travelDuration,
      ease: reduceMotion ? 'none' : 'power3.in',
    },
  )

  if (startsFaceUp) {
    timeline.to(
      flipperRef.value,
      {
        rotationY: 0,
        duration: flipDuration,
        ease: 'power2.inOut',
      },
      '<',
    )
  }

}

watch(() => props.result?.id, (id) => {
  if (id && id !== activeId) play(props.result)
}, { immediate: true })

onBeforeUnmount(stop)
</script>

<template>
  <Teleport to="body">
    <div v-if="activeResult" class="cleaner-animation" aria-hidden="true">
      <div
        v-if="activeResult.revealCard !== false"
        ref="veilRef"
        class="cleaner-animation__veil"
      ></div>
      <div ref="cardRef" class="cleaner-animation__card" :style="cardStyle">
        <div ref="flipperRef" class="cleaner-animation__flipper">
          <div class="cleaner-animation__face">
            <GameCard
              :name="activeResult.targetCard.name"
              :background-url="activeResult.targetCard.backgroundUrl"
              :frame-url="activeResult.targetCard.frameUrl"
            />
          </div>
          <div class="cleaner-animation__face cleaner-animation__face--back">
            <img :src="cardBackUrl" alt="" draggable="false" />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.cleaner-animation { position: fixed; inset: 0; z-index: 90; pointer-events: none; }
.cleaner-animation__veil { position: fixed; inset: 0; background: radial-gradient(circle at 50% 50%, rgba(15,23,42,.08), rgba(0,0,0,.72) 68%), linear-gradient(115deg, rgba(2,6,23,.76), rgba(15,23,42,.42)); }
.cleaner-animation__card { position: fixed; z-index: 1; perspective: 1200px; transform-origin: 50% 50%; will-change: transform; }
.cleaner-animation__flipper { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; will-change: transform; }
.cleaner-animation__face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; filter: drop-shadow(0 20px 28px rgba(0,0,0,.48)); }
.cleaner-animation__face--back { transform: rotateY(180deg); }
.cleaner-animation__face--back img { display: block; width: 100%; height: 100%; object-fit: contain; user-select: none; }
</style>
