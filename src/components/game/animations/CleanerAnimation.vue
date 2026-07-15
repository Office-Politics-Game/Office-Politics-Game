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
  sourcePlayerName: { type: String, default: '玩家' },
  targetPlayerName: { type: String, default: '玩家' },
  getPlayerHandRect: { type: Function, default: null },
  isSelfPlayer: { type: Function, default: null },
})
const emit = defineEmits(['complete'])

const veilRef = ref(null)
const cardLayerRef = ref(null)
const promptRef = ref(null)
const cardStyle = ref({ display: 'none' })
const CLEANER_PROMPT_HOLD_SECONDS = 1

function getCardElement() {
  return cardLayerRef.value?.getCardElement?.() ?? null
}

function getFlipperElement() {
  return cardLayerRef.value?.getFlipperElement?.() ?? null
}

function getKillTargets() {
  return [
    veilRef.value,
    getCardElement(),
    getFlipperElement(),
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
    hiddenFromViewer && result.targetCard && props.isSelfPlayer?.(result.targetPlayerId)

  if (
    !originRect ||
    (!hiddenFromViewer && !result.targetCard) ||
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
    !promptRef.value ||
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
  gsap.set(promptRef.value, { opacity: 1, scale: 1 })
  setTimeline(gsap.timeline({ onComplete: () => finishAnimation(result) }))

  timeline.value
    .to({}, { duration: CLEANER_PROMPT_HOLD_SECONDS })
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

  timeline.value
    .to({}, { duration: 2 })
    .set(promptRef.value, { opacity: 0 })

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
      <div ref="promptRef" class="cleaner-animation__prompt">
        <span class="cleaner-animation__prompt-value">{{
          sourcePlayerName
        }}</span>
        查看
        <span class="cleaner-animation__prompt-value">{{
          targetPlayerName
        }}</span>
        手牌
      </div>
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
.cleaner-animation__prompt {
  position: fixed;
  left: 50%;
  z-index: 4;
  top: 25%;
  width: min(92vw, 900px);
  padding: 0 10px;
  color: var(--gray-100);
  font-size: clamp(14.4px, 2.7vw, 32.4px);
  font-weight: 900;
  line-height: 1.3;
  letter-spacing: 0.04em;
  text-align: center;
  overflow-wrap: anywhere;
  text-shadow: 0 2px 16px rgba(0, 19, 50, 0.88);
  transform: translate(-50%, -50%);
}
.cleaner-animation__prompt-value {
  color: #facc15;
}
.cleaner-animation__card { z-index: 1; --effect-card-face-filter: drop-shadow(0 20px 28px rgba(0,0,0,.48)); }
</style>
