<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { gsap } from 'gsap'
import { useCardEffectAnimation } from '@/composables/useCardEffectAnimation'
import {
  getCardMotionTiming,
  getFlipVars,
  getMoveToCenterVars,
  getMoveVars,
  getReturnToOriginVars,
} from '@/composables/useCardMotionPresets'
import {
  createFixedCardRect,
  getEffectCardHeight,
  getScaleForHeight,
  getTranslation,
  getViewportCenterTranslation,
  rectToFixedStyle,
} from '@/composables/useGameAnimationRects'
import EffectCardLayer from './EffectCardLayer.vue'

const props = defineProps({
  result: { type: Object, default: null },
  getPlayerHandRect: { type: Function, default: null },
  isSelfPlayer: { type: Function, default: null },
})
const emit = defineEmits(['complete'])

const veilRef = ref(null)
const cardLayerRef = ref(null)
const cardStyle = ref({ display: 'none' })

function getCardElement() {
  return cardLayerRef.value?.getCardElement?.() ?? null
}

function getFlipperElement() {
  return cardLayerRef.value?.getFlipperElement?.() ?? null
}

function getKillTargets() {
  return [veilRef.value, getCardElement(), getFlipperElement()]
}

const {
  activeResult,
  activeId,
  timeline,
  begin,
  setTimeline,
  isStale,
  stop: stopAnimation,
  finish,
  isReducedMotion,
} = useCardEffectAnimation({
  emitComplete: (result) => emit('complete', result),
  reset: () => {
    cardStyle.value = { display: 'none' }
  },
})

function stop() {
  stopAnimation(getKillTargets)
}

function finishAnimation(result) {
  finish(result, getKillTargets)
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
    finishAnimation(result)
    return
  }

  begin(result, getKillTargets)
  const height = getEffectCardHeight()
  const fixedRect = createFixedCardRect(originRect, height)
  const viewerTranslation = getTranslation(originRect, viewerRect)
  const centerTranslation = getViewportCenterTranslation(originRect)
  const startScale = getScaleForHeight(originRect, height)
  const reduceMotion = isReducedMotion()
  const timing = getCardMotionTiming(reduceMotion)

  cardStyle.value = rectToFixedStyle(fixedRect)
  await nextTick()
  const cardElement = getCardElement()
  const flipperElement = getFlipperElement()
  if (
    isStale(result) ||
    !cardElement ||
    !flipperElement ||
    (!hiddenFromViewer && !veilRef.value)
  ) {
    finishAnimation(result)
    return
  }

  gsap.set(cardElement, {
    x: 0,
    y: 0,
    scale: startScale,
    transformPerspective: 1200,
  })
  gsap.set(flipperElement, {
    rotationY: startsFaceUp ? 0 : 180,
    transformPerspective: 1200,
    transformStyle: 'preserve-3d',
  })
  setTimeline(gsap.timeline({ onComplete: () => finishAnimation(result) }))

  timeline.value
    .to(
      cardElement,
      hiddenFromViewer
        ? getMoveVars(viewerTranslation, {
          scale: getScaleForHeight(viewerRect, height) * 2,
          duration: timing.travel,
          reduced: reduceMotion,
        })
        : getMoveToCenterVars(centerTranslation, height, {
          duration: timing.travel,
          reduced: reduceMotion,
        }),
    )

  if (startsFaceUp) {
    timeline.value.to(
      flipperElement,
      getFlipVars(180, timing.flip),
      '<',
    )
  }

  if (!hiddenFromViewer) {
    timeline.value.to(flipperElement, getFlipVars(0, timing.flip))
  }

  timeline.value.to({}, { duration: 2 })

  if (!hiddenFromViewer) {
    timeline.value.to(flipperElement, getFlipVars(180, timing.flip))
  }

  timeline.value.to(
    cardElement,
    getReturnToOriginVars(startScale, {
      duration: timing.travel,
      reduced: reduceMotion,
    }),
  )

  if (startsFaceUp) {
    timeline.value.to(
      flipperElement,
      getFlipVars(0, timing.flip),
      '<',
    )
  }

}

watch(() => props.result?.id, (id) => {
  if (id && id !== activeId.value) play(props.result)
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
      <EffectCardLayer
        ref="cardLayerRef"
        class="cleaner-animation__card"
        :card="activeResult.targetCard"
        :style="cardStyle"
      />
    </div>
  </Teleport>
</template>

<style scoped>
.cleaner-animation { position: fixed; inset: 0; z-index: 90; pointer-events: none; }
.cleaner-animation__veil { position: fixed; inset: 0; background: radial-gradient(circle at 50% 50%, rgba(15,23,42,.08), rgba(0,0,0,.72) 68%), linear-gradient(115deg, rgba(2,6,23,.76), rgba(15,23,42,.42)); }
.cleaner-animation__card { z-index: 1; --effect-card-face-filter: drop-shadow(0 20px 28px rgba(0,0,0,.48)); }
</style>
