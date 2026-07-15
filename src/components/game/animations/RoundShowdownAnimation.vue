<script setup>
import { nextTick, onBeforeUnmount, ref } from 'vue'
import { gsap } from 'gsap'
import {
  getCardMotionTiming,
  getEmphasisVars,
  getFlipVars,
} from '@/composables/useCardMotionPresets'
import { isReducedMotion } from '@/composables/useCardEffectAnimation'
import { rectToFixedStyle } from '@/composables/useGameAnimationRects'
import EffectCardLayer from './EffectCardLayer.vue'

const SHOWDOWN_HOLD_SECONDS = 5
const WINNER_SCALE = 2

const props = defineProps({
  getPlayerHandRect: {
    type: Function,
    default: null,
  },
  isSelfPlayer: {
    type: Function,
    default: null,
  },
})

const activeResult = ref(null)
const cardEntries = ref([])
const cardLayerRefs = new Map()

let activePlayKey = null
let activeResolve = null
let timeline = null

function setCardLayerRef(playerId, component) {
  if (component) {
    cardLayerRefs.set(playerId, component)
    return
  }

  cardLayerRefs.delete(playerId)
}

function getAnimationTargets() {
  return [...cardLayerRefs.values()].flatMap((component) => [
    component?.getCardElement?.(),
    component?.getFlipperElement?.(),
  ]).filter(Boolean)
}

function resetVisuals() {
  activeResult.value = null
  cardEntries.value = []
  cardLayerRefs.clear()
}

function settle(value) {
  const resolve = activeResolve
  activeResolve = null
  activePlayKey = null
  resolve?.(value)
}

function stop(value = false) {
  timeline?.kill()
  timeline = null

  const targets = getAnimationTargets()
  if (targets.length > 0) {
    gsap.killTweensOf(targets)
  }

  resetVisuals()
  settle(value)
}

function finish(playKey) {
  if (activePlayKey !== playKey) {
    return
  }

  timeline = null
  resetVisuals()
  settle(true)
}

async function play(result) {
  stop(false)

  if (!result?.winnerPlayerId || !Array.isArray(result.players) || result.players.length === 0) {
    return false
  }

  const winnerPlayerId = String(result.winnerPlayerId)
  const entries = result.players.map((player) => {
    const playerId = String(player.playerId)
    const rect = props.getPlayerHandRect?.(playerId)

    if (!player.card || !rect) {
      return null
    }

    return {
      playerId,
      card: player.card,
      isSelf: props.isSelfPlayer?.(playerId) === true,
      isWinner: playerId === winnerPlayerId,
      style: {
        ...rectToFixedStyle(rect),
        zIndex: playerId === winnerPlayerId ? 4 : 2,
      },
    }
  })

  if (entries.some((entry) => !entry) || !entries.some((entry) => entry.isWinner)) {
    return false
  }

  const playKey = Symbol('round-showdown')
  const completion = new Promise((resolve) => {
    activeResolve = resolve
  })

  activePlayKey = playKey
  activeResult.value = result
  cardEntries.value = entries
  await nextTick()

  if (activePlayKey !== playKey) {
    return completion
  }

  const layers = entries.map((entry) => ({
    ...entry,
    element: cardLayerRefs.get(entry.playerId)?.getCardElement?.(),
    flipper: cardLayerRefs.get(entry.playerId)?.getFlipperElement?.(),
  }))

  if (layers.some((layer) => !layer.element || !layer.flipper)) {
    stop(false)
    return completion
  }

  const reduced = isReducedMotion()
  const timing = getCardMotionTiming(reduced)
  const opponentFlippers = layers
    .filter((layer) => !layer.isSelf)
    .map((layer) => layer.flipper)
  const winnerElement = layers.find((layer) => layer.isWinner).element

  layers.forEach((layer) => {
    gsap.set(layer.element, {
      scale: 1,
      transformOrigin: '50% 50%',
      transformPerspective: 1200,
    })
    gsap.set(layer.flipper, {
      rotationY: layer.isSelf ? 0 : 180,
      transformPerspective: 1200,
      transformStyle: 'preserve-3d',
    })
  })

  timeline = gsap.timeline({ onComplete: () => finish(playKey) })

  if (opponentFlippers.length > 0) {
    timeline.to(opponentFlippers, getFlipVars(0, timing.flip))
  }

  timeline
    .to(
      winnerElement,
      getEmphasisVars(WINNER_SCALE, {
        duration: timing.emphasis,
        reduced,
      }),
    )
    .to({}, { duration: SHOWDOWN_HOLD_SECONDS })

  return completion
}

defineExpose({ play, stop })
onBeforeUnmount(() => stop(false))
</script>

<template>
  <Teleport to="body">
    <div
      v-if="activeResult"
      class="round-showdown-animation"
      aria-hidden="true"
    >
      <div class="round-showdown-animation__veil"></div>
      <EffectCardLayer
        v-for="entry in cardEntries"
        :key="entry.playerId"
        :ref="(component) => setCardLayerRef(entry.playerId, component)"
        class="round-showdown-animation__card"
        :class="{
          'round-showdown-animation__card--winner': entry.isWinner,
        }"
        :card="entry.card"
        :style="entry.style"
      />
    </div>
  </Teleport>
</template>

<style scoped>
.round-showdown-animation {
  position: fixed;
  inset: 0;
  z-index: 90;
  overflow: hidden;
  pointer-events: none;
}

.round-showdown-animation__veil {
  position: fixed;
  inset: 0;
  background: rgba(0, 19, 50, 0.58);
}

.round-showdown-animation__card {
  --effect-card-face-filter: drop-shadow(0 18px 26px rgba(0, 19, 50, 0.48));
}

.round-showdown-animation__card--winner {
  --effect-card-face-filter:
    drop-shadow(0 0 18px rgba(134, 179, 224, 0.82))
    drop-shadow(0 22px 30px rgba(0, 19, 50, 0.56));
}
</style>
