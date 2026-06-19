<script setup>
import { nextTick, onUnmounted, ref } from 'vue'
import { gsap } from 'gsap'
import cardBackUrl from '@/assets/images/card-bg-back.webp'

const DEAL_STAGGER = 0.25
const DEAL_DURATION = 0.55

const dealCards = ref([])
const dealElements = new Map()
let timeline
let resolvePlay
let activeRunId = 0

function setDealElement(playerId, element) {
  if (element) {
    dealElements.set(playerId, element)
    return
  }

  dealElements.delete(playerId)
}

function finishRun(runId, resolve) {
  if (runId !== activeRunId) {
    resolve()
    return
  }

  timeline = null
  resolvePlay = null
  dealCards.value = []
  resolve()
}

function cancel() {
  activeRunId += 1
  timeline?.kill()
  timeline = null
  dealCards.value = []

  if (resolvePlay) {
    const resolve = resolvePlay
    resolvePlay = null
    resolve()
  }
}

function getCardGeometry(startRect, targetRect) {
  const startX =
    startRect.left + (startRect.width - targetRect.width) / 2
  const startY =
    startRect.top + (startRect.height - targetRect.height) / 2
  const startScale = Math.min(
    startRect.width / targetRect.width,
    startRect.height / targetRect.height,
  )

  return {
    startX,
    startY,
    startScale,
    endX: targetRect.left,
    endY: targetRect.top,
  }
}

function playReducedMotion({
  deals,
  onCardStart,
  onCardLanded,
  runId,
}) {
  return new Promise((resolve) => {
    resolvePlay = resolve
    timeline = gsap.timeline({
      onComplete: () => finishRun(runId, resolve),
    })

    deals.forEach((deal, index) => {
      const element = dealElements.get(deal.playerId)
      const startAt = index * DEAL_STAGGER

      gsap.set(element, {
        width: deal.targetRect.width,
        height: deal.targetRect.height,
        x: deal.targetRect.left,
        y: deal.targetRect.top,
        rotation: deal.rotation,
        scale: 0.96,
        autoAlpha: 0,
      })

      timeline
        .call(() => onCardStart?.(deal), [], startAt)
        .to(
          element,
          {
            autoAlpha: 1,
            scale: 1,
            duration: 0.12,
            ease: 'power1.out',
          },
          startAt,
        )
        .call(() => onCardLanded?.(deal), [], startAt + 0.12)
        .to(
          element,
          {
            autoAlpha: 0,
            duration: 0.08,
            ease: 'power1.out',
          },
          startAt + 0.16,
        )
    })
  })
}

function playFullMotion({
  startRect,
  deals,
  onCardStart,
  onCardLanded,
  runId,
}) {
  return new Promise((resolve) => {
    resolvePlay = resolve
    timeline = gsap.timeline({
      onComplete: () => finishRun(runId, resolve),
    })

    deals.forEach((deal, index) => {
      const element = dealElements.get(deal.playerId)
      const geometry = getCardGeometry(startRect, deal.targetRect)
      const startAt = index * DEAL_STAGGER
      const arcY =
        Math.min(geometry.startY, geometry.endY) -
        Math.max(36, Math.abs(geometry.endY - geometry.startY) * 0.18)
      const halfwayX =
        geometry.startX + (geometry.endX - geometry.startX) * 0.52

      gsap.set(element, {
        width: deal.targetRect.width,
        height: deal.targetRect.height,
        x: geometry.startX,
        y: geometry.startY,
        rotation: 0,
        scale: geometry.startScale,
        autoAlpha: 0,
        transformOrigin: '50% 50%',
      })

      const cardTimeline = gsap.timeline()

      cardTimeline
        .set(element, { autoAlpha: 1 })
        .call(() => onCardStart?.(deal))
        .to(element, {
          y: geometry.startY - 18,
          scale: geometry.startScale * 1.04,
          duration: DEAL_DURATION * 0.18,
          ease: 'power2.out',
        })
        .to(element, {
          x: halfwayX,
          y: arcY,
          rotation: deal.rotation * 0.48,
          scale: geometry.startScale + (1 - geometry.startScale) * 0.58,
          duration: DEAL_DURATION * 0.36,
          ease: 'power2.inOut',
        })
        .to(element, {
          x: geometry.endX,
          y: geometry.endY,
          rotation: deal.rotation,
          scale: 1,
          duration: DEAL_DURATION * 0.46,
          ease: 'back.out(1.25)',
        })
        .call(() => onCardLanded?.(deal))
        .to(element, {
          autoAlpha: 0,
          duration: 0.08,
          ease: 'power1.out',
        }, '+=0.04')

      timeline.add(cardTimeline, startAt)
    })
  })
}

async function play({
  startRect,
  deals,
  onCardStart,
  onCardLanded,
}) {
  cancel()

  if (!startRect || !Array.isArray(deals) || deals.length === 0) {
    return
  }

  const runId = activeRunId
  dealCards.value = deals.map((deal) => ({ ...deal }))
  await nextTick()

  if (
    runId !== activeRunId ||
    deals.some((deal) => !dealElements.get(deal.playerId))
  ) {
    dealCards.value = []
    return
  }

  const reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches
  const options = {
    startRect,
    deals,
    onCardStart,
    onCardLanded,
    runId,
  }

  return reduceMotion
    ? playReducedMotion(options)
    : playFullMotion(options)
}

onUnmounted(() => {
  cancel()
})

defineExpose({
  play,
  cancel,
})
</script>

<template>
  <Teleport to="body">
    <img
      v-for="deal in dealCards"
      :key="deal.playerId"
      :ref="(element) => setDealElement(deal.playerId, element)"
      :src="cardBackUrl"
      alt=""
      class="card-deal pointer-events-none fixed top-0 left-0 invisible block select-none object-contain"
      aria-hidden="true"
      draggable="false"
    />
  </Teleport>
</template>

<style scoped>
.card-deal {
  z-index: 70;
  filter: drop-shadow(0 14px 18px rgba(0, 19, 50, 0.42));
  will-change: transform, opacity;
}

@media (prefers-reduced-motion: reduce) {
  .card-deal {
    will-change: auto;
  }
}
</style>
