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
  getDiscardRect: { type: Function, default: null },
})
const emit = defineEmits(['complete'])

const veilRef = ref(null)
const cardRef = ref(null)
const flipperRef = ref(null)
const glowRef = ref(null)
const textRef = ref(null)
const activeResult = ref(null)
const cardStyle = ref({ display: 'none' })
let timeline = null
let activeId = null

function stop() {
  timeline?.kill()
  timeline = null
  gsap.killTweensOf([veilRef.value, cardRef.value, flipperRef.value, glowRef.value, textRef.value].filter(Boolean))
}

function finish(result) {
  stop()
  activeResult.value = null
  activeId = null
  cardStyle.value = { display: 'none' }
  emit('complete', result)
}

async function playIncorrect(result) {
  await nextTick()
  if (activeId !== result.id || !veilRef.value || !glowRef.value || !textRef.value) return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const flash = reduced ? 0.08 : 0.16
  gsap.set(glowRef.value, { opacity: 0, scale: 0.72 })
  gsap.set(textRef.value, { opacity: 0, scale: 0.82 })
  timeline = gsap.timeline({ onComplete: () => finish(result) })
  timeline
    .to(glowRef.value, { opacity: 1, scale: 1, duration: flash })
    .to(glowRef.value, { opacity: 0.12, scale: 0.86, duration: flash })
    .to(glowRef.value, { opacity: 1, scale: 1.06, duration: flash })
    .set(textRef.value, { opacity: 1, scale: 1 }, '<')
    .to({}, { duration: 0.85 })
    .set([glowRef.value, textRef.value], { opacity: 0 })
}

async function playCorrect(result) {
  const originRect = props.getPlayerHandRect?.(result.targetPlayerId)
  const discardRect = props.getDiscardRect?.()
  if (!originRect || !discardRect || !result.targetCard) {
    finish(result)
    return
  }
  const height = getEffectCardHeight()
  const fixedRect = createFixedCardRect(originRect, height)
  const discardTranslation = getTranslation(originRect, discardRect)
  const centerTranslation = getViewportCenterTranslation(originRect)
  const startScale = getScaleForHeight(originRect, height)
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const travel = reduced ? 0.12 : 0.46
  const flip = reduced ? 0.12 : 0.34
  cardStyle.value = rectToFixedStyle(fixedRect)
  await nextTick()
  if (activeId !== result.id || !cardRef.value || !flipperRef.value || !veilRef.value || !glowRef.value || !textRef.value) return

  gsap.set(cardRef.value, { x: 0, y: 0, scale: startScale, transformPerspective: 1200 })
  gsap.set(flipperRef.value, { rotationY: 180, transformPerspective: 1200, transformStyle: 'preserve-3d' })
  gsap.set([glowRef.value, textRef.value], { opacity: 0, scale: 0.72 })
  timeline = gsap.timeline({ onComplete: () => finish(result) })
  timeline
    .to(cardRef.value, { x: centerTranslation.x, y: centerTranslation.y, scale: Math.min(1.2, Math.max(1, window.innerHeight * 0.52 / height)), duration: travel, ease: reduced ? 'none' : 'expo.out' })
    .to(flipperRef.value, { rotationY: 0, duration: flip, ease: 'power2.inOut' })
    .set([glowRef.value, textRef.value], { opacity: 1, scale: 1 }, '<+=0.04')
    .to({}, { duration: 1 })
    .set([glowRef.value, textRef.value], { opacity: 0 })
    .to(cardRef.value, { x: discardTranslation.x, y: discardTranslation.y, scale: getScaleForHeight(discardRect, height), rotation: 2, rotationX: 58, duration: travel, ease: reduced ? 'none' : 'power3.in' }, '<+=0.02')
}

async function play(result) {
  stop()
  activeResult.value = result
  activeId = result.id
  if (result.outcome === 'correct') await playCorrect(result)
  else await playIncorrect(result)
}

watch(() => props.result?.id, (id) => {
  if (id && id !== activeId) play(props.result)
}, { immediate: true })
onBeforeUnmount(stop)
</script>

<template>
  <Teleport to="body">
    <div v-if="activeResult" class="intern-animation" :class="`intern-animation--${activeResult.outcome}`" aria-hidden="true">
      <div ref="veilRef" class="intern-animation__veil"></div>
      <div ref="glowRef" class="intern-animation__glow"></div>
      <div ref="textRef" class="intern-animation__text">{{ activeResult.outcome === 'correct' ? '猜對啦' : '猜錯啦' }}</div>
      <div v-if="activeResult.outcome === 'correct'" ref="cardRef" class="intern-animation__card" :style="cardStyle">
        <div ref="flipperRef" class="intern-animation__flipper">
          <div class="intern-animation__face">
            <GameCard :name="activeResult.targetCard.name" :background-url="activeResult.targetCard.backgroundUrl" :frame-url="activeResult.targetCard.frameUrl" />
          </div>
          <div class="intern-animation__face intern-animation__face--back"><img :src="cardBackUrl" alt="" draggable="false" /></div>
        </div>
      </div>
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
.intern-animation__card { position: fixed; z-index: 2; perspective: 1200px; transform-origin: 50% 50%; will-change: transform; }
.intern-animation__flipper { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; }
.intern-animation__face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; filter: drop-shadow(0 20px 28px rgba(0,0,0,.48)); }
.intern-animation__face--back { transform: rotateY(180deg); }
.intern-animation__face--back img { display: block; width: 100%; height: 100%; object-fit: contain; }
</style>
