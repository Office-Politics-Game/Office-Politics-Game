<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { gsap } from 'gsap'
import { useCardEffectAnimation } from '@/composables/useCardEffectAnimation'
import {
  getCardMotionTiming,
  getDiscardVars,
  getFlipVars,
  getMoveToCenterVars,
} from '@/composables/useCardMotionPresets'
import {
  createFixedCardRect,
  getEffectCardHeight,
  getScaleForHeight,
  getTranslation,
  getViewportCenterTranslation,
  rectToFixedStyle,
} from '@/composables/useGameAnimationRects'
import CardDrawAnimation from './CardDrawAnimation.vue'
import EffectCardLayer from './EffectCardLayer.vue'

const props = defineProps({
  result: { type: Object, default: null },
  getPlayerHandRect: { type: Function, default: null },
  getDiscardRect: { type: Function, default: null },
  getDeckRect: { type: Function, default: null },
  isSelfPlayer: { type: Function, default: null },
})
const emit = defineEmits(['complete'])

const cardLayerRef = ref(null)
const drawRef = ref(null)
const drawCard = ref(null)
const showDiscardCard = ref(false)
const cardStyle = ref({ display: 'none' })

function getCardElement() {
  return cardLayerRef.value?.getCardElement?.() ?? null
}

function getFlipperElement() {
  return cardLayerRef.value?.getFlipperElement?.() ?? null
}

function getKillTargets() {
  return [getCardElement(), getFlipperElement()]
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
    drawCard.value = null
    showDiscardCard.value = false
    cardStyle.value = { display: 'none' }
  },
  onStop: () => {
    drawRef.value?.stop?.()
  },
})

function stop() {
  stopAnimation(getKillTargets)
}

function finishAnimation(result) {
  finish(result, getKillTargets)
}

function beginAnimation(result) {
  begin(result, getKillTargets)
}

async function play(result) {
  const originRect = props.getPlayerHandRect?.(result.targetPlayerId)
  const discardRect = props.getDiscardRect?.()
  const deckRect = props.getDeckRect?.()
  if (!originRect || !discardRect || !result.discardedCard || (result.newCard && !deckRect)) {
    finishAnimation(result)
    return
  }

  beginAnimation(result)
  drawCard.value = result.newCard ?? null
  showDiscardCard.value = true
  const height = getEffectCardHeight()
  const centerTranslation = getViewportCenterTranslation(originRect)
  const discardTranslation = getTranslation(originRect, discardRect)
  const reduced = isReducedMotion()
  const timing = getCardMotionTiming(reduced)
  cardStyle.value = rectToFixedStyle(createFixedCardRect(originRect, height))
  await nextTick()
  const cardElement = getCardElement()
  const flipperElement = getFlipperElement()
  if (isStale(result) || !cardElement || !flipperElement) {
    finishAnimation(result)
    return
  }

  gsap.set(cardElement, { x: 0, y: 0, scale: getScaleForHeight(originRect, height), transformPerspective: 1200 })
  gsap.set(flipperElement, { rotationY: 180, transformPerspective: 1200, transformStyle: 'preserve-3d' })

  await new Promise((resolve) => {
    const nextTimeline = setTimeline(gsap.timeline({ onComplete: () => { setTimeline(null); resolve() } }))
    nextTimeline
      .to(cardElement, getMoveToCenterVars(centerTranslation, height, { duration: timing.travel, reduced }))
      .to(flipperElement, getFlipVars(0, timing.flip))
      .to({}, { duration: 0.35 })
      .to(cardElement, getDiscardVars(discardTranslation, discardRect, height, { duration: timing.travel, reduced }))
  })

  if (isStale(result)) return
  showDiscardCard.value = false
  await nextTick()
  if (isStale(result)) return

  await new Promise((resolve) => {
    const nextTimeline = setTimeline(gsap.timeline({ onComplete: () => { setTimeline(null); resolve() } }))
    nextTimeline.to({}, { duration: 0.5 })
  })
  if (isStale(result)) return

  if (result.newCard) {
    const options = { startRect: deckRect, targetRect: originRect, onLanded: () => {} }
    if (props.isSelfPlayer?.(result.targetPlayerId)) await drawRef.value?.selfDraw(options)
    else await drawRef.value?.othersDraw(options)
  }
  if (isStale(result)) return
  finishAnimation(result)
}

watch(() => props.result?.id, (id) => {
  if (id && id !== activeId.value) play(props.result)
}, { immediate: true })
onBeforeUnmount(stop)
</script>

<template>
  <Teleport to="body">
    <div v-if="activeResult" class="pm-animation" aria-hidden="true">
      <EffectCardLayer
        v-if="showDiscardCard"
        ref="cardLayerRef"
        class="pm-animation__card"
        :card="activeResult.discardedCard"
        :style="cardStyle"
      />
      <CardDrawAnimation ref="drawRef" :card="drawCard" />
    </div>
  </Teleport>
</template>

<style scoped>
.pm-animation { position: fixed; inset: 0; z-index: 90; pointer-events: none; }
.pm-animation__card { z-index: 2; --effect-card-face-filter: drop-shadow(0 20px 28px rgba(0,0,0,.48)); }
</style>
