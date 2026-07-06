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
import EffectCardLayer from './EffectCardLayer.vue'

const props = defineProps({
  result: { type: Object, default: null },
  getPlayerHandRect: { type: Function, default: null },
  getDiscardRect: { type: Function, default: null },
})
const emit = defineEmits(['complete'])

const veilRef = ref(null)
const cardLayerRef = ref(null)
const glowRef = ref(null)
const textRef = ref(null)
const cardStyle = ref({ display: 'none' })

function getCardElement() {
  return cardLayerRef.value?.getCardElement?.() ?? null
}

function getFlipperElement() {
  return cardLayerRef.value?.getFlipperElement?.() ?? null
}

function getKillTargets() {
  return [veilRef.value, getCardElement(), getFlipperElement(), glowRef.value, textRef.value]
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

function beginAnimation(result) {
  begin(result, getKillTargets)
}

async function playIncorrect(result) {
  await nextTick()
  if (isStale(result) || !veilRef.value || !glowRef.value || !textRef.value) {
    finishAnimation(result)
    return
  }
  const reduced = isReducedMotion()
  const timing = getCardMotionTiming(reduced)
  gsap.set(glowRef.value, { opacity: 0, scale: 0.72 })
  gsap.set(textRef.value, { opacity: 0, scale: 0.82 })
  setTimeline(gsap.timeline({ onComplete: () => finishAnimation(result) }))
  timeline.value
    .to(glowRef.value, { opacity: 1, scale: 1, duration: timing.flash })
    .to(glowRef.value, { opacity: 0.12, scale: 0.86, duration: timing.flash })
    .to(glowRef.value, { opacity: 1, scale: 1.06, duration: timing.flash })
    .set(textRef.value, { opacity: 1, scale: 1 }, '<')
    .to({}, { duration: 0.85 })
    .set([glowRef.value, textRef.value], { opacity: 0 })
}

async function playCorrect(result) {
  const originRect = props.getPlayerHandRect?.(result.targetPlayerId)
  const discardRect = props.getDiscardRect?.()
  if (!originRect || !discardRect || !result.targetCard) {
    finishAnimation(result)
    return
  }
  const height = getEffectCardHeight()
  const fixedRect = createFixedCardRect(originRect, height)
  const discardTranslation = getTranslation(originRect, discardRect)
  const centerTranslation = getViewportCenterTranslation(originRect)
  const startScale = getScaleForHeight(originRect, height)
  const reduced = isReducedMotion()
  const timing = getCardMotionTiming(reduced)
  cardStyle.value = rectToFixedStyle(fixedRect)
  await nextTick()
  const cardElement = getCardElement()
  const flipperElement = getFlipperElement()
  if (isStale(result) || !cardElement || !flipperElement || !veilRef.value || !glowRef.value || !textRef.value) {
    finishAnimation(result)
    return
  }

  gsap.set(cardElement, { x: 0, y: 0, scale: startScale, transformPerspective: 1200 })
  gsap.set(flipperElement, { rotationY: 180, transformPerspective: 1200, transformStyle: 'preserve-3d' })
  gsap.set([glowRef.value, textRef.value], { opacity: 0, scale: 0.72 })
  setTimeline(gsap.timeline({ onComplete: () => finishAnimation(result) }))
  timeline.value
    .to(cardElement, getMoveToCenterVars(centerTranslation, height, { duration: timing.travel, reduced }))
    .to(flipperElement, getFlipVars(0, timing.flip))
    .set([glowRef.value, textRef.value], { opacity: 1, scale: 1 }, '<+=0.04')
    .to({}, { duration: 1 })
    .set([glowRef.value, textRef.value], { opacity: 0 })
    .to(cardElement, getDiscardVars(discardTranslation, discardRect, height, { duration: timing.travel, reduced }), '<+=0.02')
}

async function play(result) {
  beginAnimation(result)
  if (result.outcome === 'correct') await playCorrect(result)
  else await playIncorrect(result)
}

watch(() => props.result?.id, (id) => {
  if (id && id !== activeId.value) play(props.result)
}, { immediate: true })
onBeforeUnmount(stop)
</script>

<template>
  <Teleport to="body">
    <div v-if="activeResult" class="intern-animation" :class="`intern-animation--${activeResult.outcome}`" aria-hidden="true">
      <div ref="veilRef" class="intern-animation__veil"></div>
      <div ref="glowRef" class="intern-animation__glow"></div>
      <div ref="textRef" class="intern-animation__text">{{ activeResult.outcome === 'correct' ? '猜對啦' : '猜錯啦' }}</div>
      <EffectCardLayer
        v-if="activeResult.outcome === 'correct'"
        ref="cardLayerRef"
        class="intern-animation__card"
        :card="activeResult.targetCard"
        :style="cardStyle"
      />
    </div>
  </Teleport>
</template>

<style scoped>
.intern-animation { position: fixed; inset: 0; z-index: 90; pointer-events: none; }
.intern-animation__veil { position: fixed; inset: 0; background: radial-gradient(circle at 50% 50%, rgba(15,23,42,.08), rgba(0,0,0,.72) 68%), linear-gradient(115deg, rgba(2,6,23,.76), rgba(15,23,42,.42)); }
.intern-animation__glow,.intern-animation__text { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); }
.intern-animation__glow { width: min(52vmin,440px); aspect-ratio: 1; border-radius: 50%; background: radial-gradient(circle,rgba(74,222,128,.68),rgba(34,197,94,.22) 42%,transparent 72%); filter: blur(18px); mix-blend-mode: screen; }
.intern-animation--incorrect .intern-animation__glow { background: radial-gradient(circle,rgba(251,113,133,.76),rgba(225,29,72,.26) 42%,transparent 72%); }
.intern-animation__text { z-index: 3; margin-top: min(33vmin,250px); color: #86efac; font-size: clamp(34px,7vw,72px); font-weight: 1000; letter-spacing: .08em; text-shadow: 0 0 10px rgba(74,222,128,.9),0 0 28px rgba(34,197,94,.72); white-space: nowrap; }
.intern-animation--incorrect .intern-animation__text { margin-top: 0; color: #fb7185; text-shadow: 0 0 10px rgba(251,113,133,.92),0 0 30px rgba(225,29,72,.76); }
.intern-animation__card { z-index: 2; --effect-card-face-filter: drop-shadow(0 20px 28px rgba(0,0,0,.48)); }
</style>
