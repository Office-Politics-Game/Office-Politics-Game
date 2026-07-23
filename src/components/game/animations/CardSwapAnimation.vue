<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { gsap } from 'gsap'
import { useCardEffectAnimation } from '@/composables/useCardEffectAnimation'
import { getCardMotionTiming, getFlipVars, getMoveVars } from '@/composables/useCardMotionPresets'
import { getRectCenter, getScaleForHeight, getTranslation, getViewportCenter, rectToFixedStyle } from '@/composables/useGameAnimationRects'
import EffectCardLayer from './EffectCardLayer.vue'

const props = defineProps({
  result: { type: Object, default: null },
  targetPlayerName: { type: String, default: '玩家' },
  getPlayerHandRect: { type: Function, default: null },
})
const emit = defineEmits(['complete', 'swap-motion-start'])

const sourceLayerRef = ref(null)
const targetLayerRef = ref(null)
const exchangeLineRef = ref(null)
const promptRef = ref(null)
const sourceStyle = ref({ display: 'none' })
const targetStyle = ref({ display: 'none' })
const SWAP_PROMPT_HOLD_SECONDS = 1

function getSourceElement() { return sourceLayerRef.value?.getCardElement?.() ?? null }
function getSourceFlipperElement() { return sourceLayerRef.value?.getFlipperElement?.() ?? null }
function getTargetElement() { return targetLayerRef.value?.getCardElement?.() ?? null }
function getTargetFlipperElement() { return targetLayerRef.value?.getFlipperElement?.() ?? null }

function getKillTargets() {
  return [
    getSourceElement(),
    getSourceFlipperElement(),
    getTargetElement(),
    getTargetFlipperElement(),
    exchangeLineRef.value,
    promptRef.value,
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

function getShowcaseTranslation(rect, offsetX) {
  const center = getRectCenter(rect)
  const viewportCenter = getViewportCenter()

  return center
    ? { x: viewportCenter.x + offsetX - center.x, y: viewportCenter.y - center.y }
    : null
}

async function play(result) {
  const sourceRect = props.getPlayerHandRect?.(result.sourcePlayerId)
  const targetRect = props.getPlayerHandRect?.(result.targetPlayerId)
  if (!sourceRect || !targetRect) {
    finishAnimation(result)
    return
  }

  begin(result, getKillTargets)
  sourceStyle.value = rectToFixedStyle(sourceRect)
  targetStyle.value = rectToFixedStyle(targetRect)
  await nextTick()

  const sourceElement = getSourceElement()
  const sourceFlipperElement = getSourceFlipperElement()
  const targetElement = getTargetElement()
  const targetFlipperElement = getTargetFlipperElement()
  if (
    isStale(result) ||
    !sourceElement || !sourceFlipperElement ||
    !targetElement || !targetFlipperElement ||
    !exchangeLineRef.value ||
    !promptRef.value
  ) {
    finishAnimation(result)
    return
  }

  const sourceTravel = getTranslation(sourceRect, targetRect)
  const targetTravel = getTranslation(targetRect, sourceRect)
  const sourceShowcase = getShowcaseTranslation(sourceRect, -window.innerWidth * 0.09)
  const targetShowcase = getShowcaseTranslation(targetRect, window.innerWidth * 0.09)
  const sourceEndScale = getScaleForHeight(targetRect, sourceRect.height)
  const targetEndScale = getScaleForHeight(sourceRect, targetRect.height)
  if (!sourceTravel || !targetTravel || !sourceShowcase || !targetShowcase || sourceEndScale === null || targetEndScale === null) {
    finishAnimation(result)
    return
  }

  const reduced = isReducedMotion()
  const timing = getCardMotionTiming(reduced, { showcase: 0.48, exchange: 0.34, settle: 0.42 })
  const sourceInitialRotation = result.sourceCardReveal === 'before-swap' ? 0 : 180
  const targetInitialRotation = result.targetCardReveal === 'before-swap' ? 0 : 180
  const sourceFinalRotation = result.sourceCardReveal === 'after-swap' ? 0 : 180
  const targetFinalRotation = result.targetCardReveal === 'after-swap' ? 0 : 180

  gsap.set(exchangeLineRef.value, { autoAlpha: 0, xPercent: -50, yPercent: -50, scaleX: 0.42, transformOrigin: '50% 50%' })
  gsap.set(promptRef.value, { opacity: 1 })
  gsap.set([sourceElement, targetElement], { x: 0, y: 0, scale: 1, rotation: 0, autoAlpha: 1, transformOrigin: '50% 50%', transformPerspective: 1200 })
  gsap.set(sourceFlipperElement, { rotationY: sourceInitialRotation, transformStyle: 'preserve-3d' })
  gsap.set(targetFlipperElement, { rotationY: targetInitialRotation, transformStyle: 'preserve-3d' })

  setTimeline(gsap.timeline({ onComplete: () => finishAnimation(result) }))

  if (reduced) {
    timeline.value
      .to({}, { duration: SWAP_PROMPT_HOLD_SECONDS })
      .call(() => emit('swap-motion-start'))
      .set([sourceFlipperElement, targetFlipperElement], { rotationY: 180 })
      .to(exchangeLineRef.value, { autoAlpha: 0.72, scaleX: 1, duration: timing.flash })
      .set(promptRef.value, { opacity: 0 })
      .set(sourceElement, getMoveVars(sourceTravel, { scale: sourceEndScale, duration: 0, reduced }))
      .set(targetElement, getMoveVars(targetTravel, { scale: targetEndScale, duration: 0, reduced }))
      .set(sourceFlipperElement, { rotationY: sourceFinalRotation })
      .set(targetFlipperElement, { rotationY: targetFinalRotation })
      .to(exchangeLineRef.value, { autoAlpha: 0, duration: timing.flash })
      .to([sourceElement, targetElement], { autoAlpha: 0, duration: timing.travel }, '<')
    return
  }

  timeline.value
    .to({}, { duration: SWAP_PROMPT_HOLD_SECONDS })
    .call(() => emit('swap-motion-start'))
    .to(sourceFlipperElement, getFlipVars(180, timing.flip))
    .to(targetFlipperElement, getFlipVars(180, timing.flip), '<')
    .to(sourceElement, getMoveVars(sourceShowcase, { scale: 1.24, duration: timing.showcase, ease: 'expo.out', extra: { rotation: -7 } }), '-=0.04')
    .to(targetElement, getMoveVars(targetShowcase, { scale: 1.24, duration: timing.showcase, ease: 'expo.out', extra: { rotation: 7 } }), '<')
    .to(exchangeLineRef.value, { autoAlpha: 0.8, scaleX: 1, duration: timing.flash, ease: 'power2.out' }, '-=0.16')
    .set(promptRef.value, { opacity: 0 })
    .to(sourceElement, getMoveVars(targetShowcase, { scale: 1.24, duration: timing.exchange, ease: 'power2.inOut', extra: { rotation: 7 } }))
    .to(targetElement, getMoveVars(sourceShowcase, { scale: 1.24, duration: timing.exchange, ease: 'power2.inOut', extra: { rotation: -7 } }), '<')
    .to(exchangeLineRef.value, { autoAlpha: 0, scaleX: 1.16, duration: timing.flash, ease: 'power2.in' })
    .to(sourceElement, getMoveVars(sourceTravel, { scale: sourceEndScale, duration: timing.settle, ease: 'power3.inOut', extra: { rotation: -8 } }), '<')
    .to(targetElement, getMoveVars(targetTravel, { scale: targetEndScale, duration: timing.settle, ease: 'power3.inOut', extra: { rotation: 3 } }), '<')
    .to(sourceFlipperElement, getFlipVars(sourceFinalRotation, timing.flip))
    .to(targetFlipperElement, getFlipVars(targetFinalRotation, timing.flip), '<')
    .to([sourceElement, targetElement], { autoAlpha: 0, duration: timing.travel, ease: 'power1.in' })
}

watch(() => props.result?.id, (id) => {
  if (id && id !== activeId.value) play(props.result)
}, { immediate: true })

onBeforeUnmount(stop)
defineExpose({ stop })
</script>

<template>
  <Teleport to="body">
    <div v-if="activeResult" class="card-swap-animation" aria-hidden="true">
      <div ref="exchangeLineRef" class="card-swap-animation__line"></div>
      <div ref="promptRef" class="card-swap-animation__prompt">與<span class="card-swap-animation__prompt-value">{{ targetPlayerName }}</span>交換手牌</div>
      <EffectCardLayer ref="sourceLayerRef" class="card-swap-animation__card" :card="activeResult.sourceCard" :style="sourceStyle" use-image-front overlay-behind-card>
        <template #overlay><div class="card-swap-animation__glow" :style="{ '--accent': activeResult.sourceCard?.color ?? 'var(--brand-primary)' }"></div></template>
      </EffectCardLayer>
      <EffectCardLayer ref="targetLayerRef" class="card-swap-animation__card" :card="activeResult.targetCard" :style="targetStyle" use-image-front overlay-behind-card>
        <template #overlay><div class="card-swap-animation__glow" :style="{ '--accent': activeResult.targetCard?.color ?? 'var(--brand-primary)' }"></div></template>
      </EffectCardLayer>
    </div>
  </Teleport>
</template>

<style scoped>
.card-swap-animation { position: fixed; inset: 0; z-index: 90; pointer-events: none; }
.card-swap-animation__line { position: fixed; top: 50%; left: 50%; z-index: 1; width: min(72vw, 660px); height: 3px; background: linear-gradient(90deg, transparent, var(--brand-primary) 18%, var(--surface-glass-hover) 50%, var(--brand-primary) 82%, transparent); box-shadow: 0 0 24px rgba(134, 179, 224, 0.82); }
.card-swap-animation__card { z-index: 2; --effect-card-face-filter: drop-shadow(0 0 16px rgba(134, 179, 224, 0.36)) drop-shadow(0 22px 30px rgba(0, 19, 50, 0.52)); }
.card-swap-animation__glow { position: absolute; inset: -18%; border-radius: 0; background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.42), transparent 34%), radial-gradient(circle at 50% 50%, var(--accent), transparent 66%); filter: blur(16px); opacity: 0.72; }
.card-swap-animation__prompt {
  position: fixed;
  top: 135px;
  left: 50%;
  z-index: 4;
  width: 920px;
  color: var(--gray-100);
  font-size: var(--text-xl);
  font-weight: 900;
  line-height: 1.3;
  letter-spacing: 0.04em;
  text-align: center;
  overflow-wrap: anywhere;
  text-shadow: 0 2px 16px rgba(0, 19, 50, 0.88);
  transform: translateX(-50%);
}
.card-swap-animation__prompt-value { color: #facc15; }

@media (min-width: 1024px) {
  .card-swap-animation__prompt {
    top: 180px;
    width: 1180px;
  }
}
@media (prefers-reduced-motion: reduce) { .card-swap-animation__card { will-change: auto; } }
</style>
