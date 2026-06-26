<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { gsap } from 'gsap'
import cardBackUrl from '@/assets/images/card-bg-back.webp'
import {
  createFixedCardRect,
  getEffectCardHeight,
  getRectCenter,
  getScaleForHeight,
  getTranslation,
  getViewportCenter,
  rectToFixedStyle,
} from '@/composables/useGameAnimationRects'
import GameCard from './GameCard.vue'

const props = defineProps({
  result: { type: Object, default: null },
  getPlayerHandRect: { type: Function, default: null },
  getDiscardRect: { type: Function, default: null },
})
const emit = defineEmits(['complete'])

const veilRef = ref(null)
const sourceRef = ref(null)
const sourceFlipperRef = ref(null)
const targetRef = ref(null)
const targetFlipperRef = ref(null)
const loserGlowRef = ref(null)
const activeResult = ref(null)
const sourceStyle = ref({ display: 'none' })
const targetStyle = ref({ display: 'none' })
let timeline = null
let activeId = null

function stop() {
  timeline?.kill()
  timeline = null
  gsap.killTweensOf([veilRef.value, sourceRef.value, sourceFlipperRef.value, targetRef.value, targetFlipperRef.value, loserGlowRef.value].filter(Boolean))
}

function finish(result) {
  stop()
  activeResult.value = null
  activeId = null
  sourceStyle.value = { display: 'none' }
  targetStyle.value = { display: 'none' }
  emit('complete', result)
}

async function play(result) {
  const sourceRect = props.getPlayerHandRect?.(result.sourcePlayerId)
  const targetRect = props.getPlayerHandRect?.(result.targetPlayerId)
  const discardRect = props.getDiscardRect?.()
  if (!sourceRect || !targetRect || !discardRect || !result.sourceCard || !result.targetCard) {
    finish(result)
    return
  }

  stop()
  activeResult.value = result
  activeId = result.id
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
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const travel = reduced ? 0.12 : 0.48
  const flip = reduced ? 0.12 : 0.34

  sourceStyle.value = rectToFixedStyle(createFixedCardRect(sourceRect, height))
  targetStyle.value = rectToFixedStyle(createFixedCardRect(targetRect, height))
  await nextTick()
  if (activeId !== result.id || !sourceRef.value || !targetRef.value || !sourceFlipperRef.value || !targetFlipperRef.value || !loserGlowRef.value || !veilRef.value) return

  gsap.set(sourceRef.value, { x: 0, y: 0, scale: sourceStartScale, transformPerspective: 1200 })
  gsap.set(targetRef.value, { x: 0, y: 0, scale: targetStartScale, transformPerspective: 1200 })
  gsap.set([sourceFlipperRef.value, targetFlipperRef.value], { rotationY: 180, transformPerspective: 1200, transformStyle: 'preserve-3d' })
  gsap.set(loserGlowRef.value, { opacity: 0, scale: 0.7, x: sourceWins ? gap : -gap })

  const winner = sourceWins ? sourceRef.value : targetRef.value
  const loser = sourceWins ? targetRef.value : sourceRef.value
  const loserFlipper = sourceWins
    ? targetFlipperRef.value
    : sourceFlipperRef.value
  const winnerScale = sourceWins ? sourceStartScale : targetStartScale
  const loserRect = sourceWins ? targetRect : sourceRect
  const discardTranslation = getTranslation(loserRect, discardRect)

  timeline = gsap.timeline({ onComplete: () => finish(result) })
  timeline
    .to(sourceRef.value, { x: viewportCenter.x - gap - sourceCenter.x, y: viewportCenter.y - sourceCenter.y, scale: 1, duration: travel, ease: reduced ? 'none' : 'expo.out' })
    .to(targetRef.value, { x: viewportCenter.x + gap - targetCenter.x, y: viewportCenter.y - targetCenter.y, scale: 1, duration: travel, ease: reduced ? 'none' : 'expo.out' }, '<')
  if (revealAtCenter) {
    timeline.to(
      [sourceFlipperRef.value, targetFlipperRef.value],
      { rotationY: 0, duration: flip, ease: 'power2.inOut' },
    )
  }

  timeline
    .to({}, { duration: 0.5 })

  if (draw) {
    timeline
      .to({}, { duration: 1 })
      .to(sourceRef.value, { x: 0, y: 0, scale: sourceStartScale, duration: travel, ease: reduced ? 'none' : 'power3.in' })
      .to(targetRef.value, { x: 0, y: 0, scale: targetStartScale, duration: travel, ease: reduced ? 'none' : 'power3.in' }, '<')
  } else {
    timeline
      .to(winner, { scale: 1.18, duration: reduced ? 0.08 : 0.22, ease: 'back.out(1.7)' })
      .to(loser, { scale: 0.76, duration: reduced ? 0.08 : 0.22 }, '<')
      .set(loserGlowRef.value, { opacity: 1, scale: 1 }, '<')

    if (!revealAtCenter) {
      timeline.to(
        loserFlipper,
        {
          rotationY: 0,
          duration: flip,
          ease: 'power2.inOut',
        },
        '<',
      )
    }

    timeline
      .to({}, { duration: 0.9 })
      .set(loserGlowRef.value, { opacity: 0 })
      .to(winner, { x: 0, y: 0, scale: winnerScale, duration: travel, ease: reduced ? 'none' : 'power3.in' }, '<')
      .to(loser, { x: discardTranslation.x, y: discardTranslation.y, scale: getScaleForHeight(discardRect, height), rotation: 2, rotationX: 58, duration: travel, ease: reduced ? 'none' : 'power3.in' }, '<')
  }
}

watch(() => props.result?.id, (id) => {
  if (id && id !== activeId) play(props.result)
}, { immediate: true })
onBeforeUnmount(stop)
</script>

<template>
  <Teleport to="body">
    <div v-if="activeResult" class="manager-animation" aria-hidden="true">
      <div ref="veilRef" class="manager-animation__veil"></div>
      <div ref="loserGlowRef" class="manager-animation__loser-glow"></div>
      <div ref="sourceRef" class="manager-animation__card" :style="sourceStyle">
        <div ref="sourceFlipperRef" class="manager-animation__flipper">
          <div class="manager-animation__face"><GameCard :name="activeResult.sourceCard.name" :background-url="activeResult.sourceCard.backgroundUrl" :frame-url="activeResult.sourceCard.frameUrl" /></div>
          <div class="manager-animation__face manager-animation__face--back"><img :src="cardBackUrl" alt="" draggable="false" /></div>
        </div>
      </div>
      <div ref="targetRef" class="manager-animation__card" :style="targetStyle">
        <div ref="targetFlipperRef" class="manager-animation__flipper">
          <div class="manager-animation__face"><GameCard :name="activeResult.targetCard.name" :background-url="activeResult.targetCard.backgroundUrl" :frame-url="activeResult.targetCard.frameUrl" /></div>
          <div class="manager-animation__face manager-animation__face--back"><img :src="cardBackUrl" alt="" draggable="false" /></div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.manager-animation { position: fixed; inset: 0; z-index: 90; pointer-events: none; }
.manager-animation__veil { position: fixed; inset: 0; background: radial-gradient(circle at 50% 50%,rgba(15,23,42,.08),rgba(0,0,0,.72) 68%),linear-gradient(115deg,rgba(2,6,23,.76),rgba(15,23,42,.42)); }
.manager-animation__card { position: fixed; z-index: 2; perspective: 1200px; transform-origin: 50% 50%; will-change: transform; }
.manager-animation__flipper { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; }
.manager-animation__face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; filter: drop-shadow(0 20px 28px rgba(0,0,0,.48)); }
.manager-animation__face--back { transform: rotateY(180deg); }
.manager-animation__face--back img { width: 100%; height: 100%; object-fit: contain; }
.manager-animation__loser-glow { position: fixed; top: 50%; left: 50%; z-index: 1; width: min(32vmin,280px); aspect-ratio: 1; border-radius: 50%; background: radial-gradient(circle,rgba(251,113,133,.76),rgba(225,29,72,.26) 42%,transparent 72%); filter: blur(18px); mix-blend-mode: screen; transform: translate(-50%,-50%); }
</style>
