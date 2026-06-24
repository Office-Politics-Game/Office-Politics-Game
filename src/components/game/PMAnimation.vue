<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { gsap } from 'gsap'
import cardBackUrl from '@/assets/images/card-bg-back.webp'
import CardDrawAnimation from './CardDrawAnimation.vue'
import GameCard from './GameCard.vue'

const props = defineProps({
  result: { type: Object, default: null },
  getPlayerHandRect: { type: Function, default: null },
  getDiscardRect: { type: Function, default: null },
  getDeckRect: { type: Function, default: null },
  isSelfPlayer: { type: Function, default: null },
})
const emit = defineEmits(['complete'])

const veilRef = ref(null)
const cardRef = ref(null)
const flipperRef = ref(null)
const drawRef = ref(null)
const activeResult = ref(null)
const drawCard = ref(null)
const cardStyle = ref({ display: 'none' })
let timeline = null
let activeId = null

function stop() {
  timeline?.kill()
  timeline = null
  drawRef.value?.stop?.()
  gsap.killTweensOf([veilRef.value, cardRef.value, flipperRef.value].filter(Boolean))
}
function finish(result) {
  stop()
  activeResult.value = null
  drawCard.value = null
  activeId = null
  cardStyle.value = { display: 'none' }
  emit('complete', result)
}

async function play(result) {
  const originRect = props.getPlayerHandRect?.(result.targetPlayerId)
  const discardRect = props.getDiscardRect?.()
  const deckRect = props.getDeckRect?.()
  if (!originRect || !discardRect || !result.discardedCard || (result.newCard && !deckRect)) {
    finish(result)
    return
  }

  stop()
  activeResult.value = result
  activeId = result.id
  drawCard.value = result.newCard ?? null
  const height = Math.min(Math.max(originRect.height * 2.4, 220), Math.min(window.innerHeight * 0.62, 420))
  const width = height * 0.75
  const originX = originRect.left + originRect.width / 2
  const originY = originRect.top + originRect.height / 2
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const travel = reduced ? 0.12 : 0.46
  const flip = reduced ? 0.12 : 0.34
  cardStyle.value = { display: 'block', left: `${originX - width / 2}px`, top: `${originY - height / 2}px`, width: `${width}px`, height: `${height}px` }
  await nextTick()
  if (activeId !== result.id || !cardRef.value || !flipperRef.value || !veilRef.value) return

  gsap.set(cardRef.value, { x: 0, y: 0, scale: originRect.height / height, opacity: 1, transformPerspective: 1200 })
  gsap.set(flipperRef.value, { rotationY: 180, transformPerspective: 1200, transformStyle: 'preserve-3d' })
  gsap.set(veilRef.value, { opacity: 0 })

  await new Promise((resolve) => {
    timeline = gsap.timeline({ onComplete: () => { timeline = null; resolve() } })
    timeline
      .to(veilRef.value, { opacity: 1, duration: reduced ? 0.08 : 0.14 })
      .to(cardRef.value, { x: window.innerWidth / 2 - originX, y: window.innerHeight / 2 - originY, scale: Math.min(1.2, Math.max(1, window.innerHeight * 0.52 / height)), duration: travel, ease: reduced ? 'none' : 'expo.out' }, '<')
      .to(flipperRef.value, { rotationY: 0, duration: flip, ease: 'power2.inOut' })
      .to({}, { duration: 0.35 })
      .to(cardRef.value, { x: discardRect.left + discardRect.width / 2 - originX, y: discardRect.top + discardRect.height / 2 - originY, scale: discardRect.height / height, rotation: 2, rotationX: 58, duration: travel, ease: reduced ? 'none' : 'power3.in' })
      .to(cardRef.value, { opacity: 0, duration: 0.04 })
  })

  if (activeId !== result.id) return
  if (result.newCard) {
    const options = { startRect: deckRect, targetRect: originRect, onLanded: () => {} }
    if (props.isSelfPlayer?.(result.targetPlayerId)) await drawRef.value?.selfDraw(options)
    else await drawRef.value?.othersDraw(options)
  }
  if (activeId !== result.id) return
  timeline = gsap.timeline({ onComplete: () => finish(result) })
  timeline.to(veilRef.value, { opacity: 0, duration: reduced ? 0.08 : 0.2 })
}

watch(() => props.result?.id, (id) => {
  if (id && id !== activeId) play(props.result)
}, { immediate: true })
onBeforeUnmount(stop)
</script>

<template>
  <Teleport to="body">
    <div v-if="activeResult" class="pm-animation" aria-hidden="true">
      <div ref="veilRef" class="pm-animation__veil"></div>
      <div ref="cardRef" class="pm-animation__card" :style="cardStyle">
        <div ref="flipperRef" class="pm-animation__flipper">
          <div class="pm-animation__face"><GameCard :name="activeResult.discardedCard.name" :background-url="activeResult.discardedCard.backgroundUrl" :frame-url="activeResult.discardedCard.frameUrl" /></div>
          <div class="pm-animation__face pm-animation__face--back"><img :src="cardBackUrl" alt="" draggable="false" /></div>
        </div>
      </div>
      <CardDrawAnimation ref="drawRef" :card="drawCard" />
    </div>
  </Teleport>
</template>

<style scoped>
.pm-animation { position: fixed; inset: 0; z-index: 90; pointer-events: none; }
.pm-animation__veil { position: fixed; inset: 0; background: radial-gradient(circle at 50% 50%,rgba(15,23,42,.08),rgba(0,0,0,.72) 68%),linear-gradient(115deg,rgba(2,6,23,.76),rgba(15,23,42,.42)); }
.pm-animation__card { position: fixed; z-index: 2; perspective: 1200px; transform-origin: 50% 50%; will-change: transform,opacity; }
.pm-animation__flipper { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; }
.pm-animation__face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; filter: drop-shadow(0 20px 28px rgba(0,0,0,.48)); }
.pm-animation__face--back { transform: rotateY(180deg); }
.pm-animation__face--back img { width: 100%; height: 100%; object-fit: contain; }
</style>
