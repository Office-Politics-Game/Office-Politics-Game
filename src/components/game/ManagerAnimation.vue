<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { gsap } from 'gsap'
import { useCardEffectAnimation } from '@/composables/useCardEffectAnimation'
import {
  getCardMotionTiming,
  getDiscardVars,
  getEmphasisVars,
  getFlipVars,
  getMoveVars,
  getReturnToOriginVars,
} from '@/composables/useCardMotionPresets'
import {
  createFixedCardRect,
  getEffectCardHeight,
  getRectCenter,
  getScaleForHeight,
  getTranslation,
  getViewportCenter,
  rectToFixedStyle,
} from '@/composables/useGameAnimationRects'
import EffectCardLayer from './EffectCardLayer.vue'

const props = defineProps({
  result: { type: Object, default: null },
  getPlayerHandRect: { type: Function, default: null },
  getDiscardRect: { type: Function, default: null },
})
const emit = defineEmits(['complete'])

const veilRef = ref(null)
const sourceLayerRef = ref(null)
const targetLayerRef = ref(null)
const loserGlowRef = ref(null)
const sourceStyle = ref({ display: 'none' })
const targetStyle = ref({ display: 'none' })

function getSourceElement() {
  return sourceLayerRef.value?.getCardElement?.() ?? null
}

function getSourceFlipperElement() {
  return sourceLayerRef.value?.getFlipperElement?.() ?? null
}

function getTargetElement() {
  return targetLayerRef.value?.getCardElement?.() ?? null
}

function getTargetFlipperElement() {
  return targetLayerRef.value?.getFlipperElement?.() ?? null
}

function getKillTargets() {
  return [
    veilRef.value,
    getSourceElement(),
    getSourceFlipperElement(),
    getTargetElement(),
    getTargetFlipperElement(),
    loserGlowRef.value,
  ]
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
    sourceStyle.value = { display: 'none' }
    targetStyle.value = { display: 'none' }
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
  const sourceRect = props.getPlayerHandRect?.(result.sourcePlayerId)
  const targetRect = props.getPlayerHandRect?.(result.targetPlayerId)
  const discardRect = props.getDiscardRect?.()
  if (!sourceRect || !targetRect || !discardRect || !result.sourceCard || !result.targetCard) {
    finishAnimation(result)
    return
  }

  beginAnimation(result)
  const height = getEffectCardHeight()
  const width = height * 0.75
  const sourceCenter = getRectCenter(sourceRect)
  const targetCenter = getRectCenter(targetRect)
  const viewportCenter = getViewportCenter()
  const gap = Math.min(width * 0.72, window.innerWidth * 0.17)
  const sourceStartScale = getScaleForHeight(sourceRect, height)
  const targetStartScale = getScaleForHeight(targetRect, height)
  const sourceWins = result.outcome === 'win'
  const targetWins = result.outcome === 'lose'
  const draw = !sourceWins && !targetWins
  const revealAtCenter = result.revealCards !== false
  const reduced = isReducedMotion()
  const timing = getCardMotionTiming(reduced)

  sourceStyle.value = rectToFixedStyle(createFixedCardRect(sourceRect, height))
  targetStyle.value = rectToFixedStyle(createFixedCardRect(targetRect, height))
  await nextTick()
  const sourceElement = getSourceElement()
  const targetElement = getTargetElement()
  const sourceFlipperElement = getSourceFlipperElement()
  const targetFlipperElement = getTargetFlipperElement()
  if (isStale(result) || !sourceElement || !targetElement || !sourceFlipperElement || !targetFlipperElement || !loserGlowRef.value || !veilRef.value) {
    finishAnimation(result)
    return
  }

  gsap.set(sourceElement, { x: 0, y: 0, scale: sourceStartScale, transformPerspective: 1200 })
  gsap.set(targetElement, { x: 0, y: 0, scale: targetStartScale, transformPerspective: 1200 })
  gsap.set([sourceFlipperElement, targetFlipperElement], { rotationY: 180, transformPerspective: 1200, transformStyle: 'preserve-3d' })
  gsap.set(loserGlowRef.value, { opacity: 0, scale: 0.7, x: sourceWins ? gap : -gap })

  const winner = sourceWins ? sourceElement : targetElement
  const loser = sourceWins ? targetElement : sourceElement
  const loserFlipper = sourceWins
    ? targetFlipperElement
    : sourceFlipperElement
  const winnerScale = sourceWins ? sourceStartScale : targetStartScale
  const loserRect = sourceWins ? targetRect : sourceRect
  const discardTranslation = getTranslation(loserRect, discardRect)

  setTimeline(gsap.timeline({ onComplete: () => finishAnimation(result) }))
  timeline.value
    .to(sourceElement, getMoveVars({
      x: viewportCenter.x - gap - sourceCenter.x,
      y: viewportCenter.y - sourceCenter.y,
    }, { scale: 1, duration: timing.compareTravel, reduced }))
    .to(targetElement, getMoveVars({
      x: viewportCenter.x + gap - targetCenter.x,
      y: viewportCenter.y - targetCenter.y,
    }, { scale: 1, duration: timing.compareTravel, reduced }), '<')
  if (revealAtCenter) {
    timeline.value.to(
      [sourceFlipperElement, targetFlipperElement],
      getFlipVars(0, timing.flip),
    )
  }

  timeline.value
    .to({}, { duration: 0.5 })

  if (draw) {
    timeline.value
      .to({}, { duration: 1 })
      .to(sourceElement, getReturnToOriginVars(sourceStartScale, { duration: timing.compareTravel, reduced }))
      .to(targetElement, getReturnToOriginVars(targetStartScale, { duration: timing.compareTravel, reduced }), '<')
  } else {
    timeline.value
      .to(winner, getEmphasisVars(1.18, { duration: timing.emphasis, reduced }))
      .to(loser, getEmphasisVars(0.76, { duration: timing.emphasis, reduced, ease: null }), '<')
      .set(loserGlowRef.value, { opacity: 1, scale: 1 }, '<')

    if (!revealAtCenter) {
      timeline.value.to(
        loserFlipper,
        getFlipVars(0, timing.flip),
        '<',
      )
    }

    timeline.value
      .to({}, { duration: 0.9 })
      .set(loserGlowRef.value, { opacity: 0 })
      .to(winner, getReturnToOriginVars(winnerScale, { duration: timing.compareTravel, reduced }), '<')
      .to(loser, getDiscardVars(discardTranslation, discardRect, height, { duration: timing.compareTravel, reduced }), '<')
  }
}

watch(() => props.result?.id, (id) => {
  if (id && id !== activeId.value) play(props.result)
}, { immediate: true })
onBeforeUnmount(stop)
</script>

<template>
  <Teleport to="body">
    <div v-if="activeResult" class="manager-animation" aria-hidden="true">
      <div ref="veilRef" class="manager-animation__veil"></div>
      <div ref="loserGlowRef" class="manager-animation__loser-glow"></div>
      <EffectCardLayer
        ref="sourceLayerRef"
        class="manager-animation__card"
        :card="activeResult.sourceCard"
        :style="sourceStyle"
      />
      <EffectCardLayer
        ref="targetLayerRef"
        class="manager-animation__card"
        :card="activeResult.targetCard"
        :style="targetStyle"
      />
    </div>
  </Teleport>
</template>

<style scoped>
.manager-animation { position: fixed; inset: 0; z-index: 90; pointer-events: none; }
.manager-animation__veil { position: fixed; inset: 0; background: radial-gradient(circle at 50% 50%,rgba(15,23,42,.08),rgba(0,0,0,.72) 68%),linear-gradient(115deg,rgba(2,6,23,.76),rgba(15,23,42,.42)); }
.manager-animation__card { z-index: 2; --effect-card-face-filter: drop-shadow(0 20px 28px rgba(0,0,0,.48)); }
.manager-animation__loser-glow { position: fixed; top: 50%; left: 50%; z-index: 1; width: min(32vmin,280px); aspect-ratio: 1; border-radius: 50%; background: radial-gradient(circle,rgba(251,113,133,.76),rgba(225,29,72,.26) 42%,transparent 72%); filter: blur(18px); mix-blend-mode: screen; transform: translate(-50%,-50%); }
</style>
