<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { gsap } from 'gsap'
import cardBackUrl from '@/assets/images/card-bg-back.webp'
import GameCard from './GameCard.vue'

const props = defineProps({
  deckCount: {
    type: [Number, String],
    required: true,
  },
  discardCard: {
    type: Object,
    default: null,
    validator: (card) =>
      card === null ||
      (typeof card?.name === 'string' &&
        typeof card?.backgroundUrl === 'string' &&
        typeof card?.frameUrl === 'string'),
  },
  discardCards: {
    type: Array,
    default: () => [],
    validator: (cards) =>
      cards.every(
        (card) =>
          typeof card?.name === 'string' &&
          typeof card?.backgroundUrl === 'string' &&
          typeof card?.frameUrl === 'string',
      ),
  },
  isDrawDisabled: {
    type: Boolean,
    default: false,
  },
  isDropTargetActive: {
    type: Boolean,
    default: false,
  },
  isDeckHidden: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['draw'])

const pileArea = ref(null)
const deckPile = ref(null)
const discardPile = ref(null)
const isDeckPressing = ref(false)
const TABLE_ROTATION_X = 58
let gsapContext
let gsapMedia
let pressTimeline
let hasRequestedDraw = false

const normalizedDiscardCards = computed(() => {
  if (props.discardCards.length > 0) {
    return props.discardCards
  }

  return props.discardCard ? [props.discardCard] : []
})

const topDiscardCard = computed(() => {
  if (normalizedDiscardCards.value.length > 0) {
    return normalizedDiscardCards.value[normalizedDiscardCards.value.length - 1]
  }

  return null
})

const isDeckInteractionDisabled = computed(
  () => props.isDrawDisabled || props.isDeckHidden || isDeckPressing.value,
)

function getDeckRect() {
  return deckPile.value?.getBoundingClientRect() ?? null
}

function getDeckAnimationPose() {
  const rect = getDeckRect()
  if (!rect || !deckPile.value) {
    return null
  }

  return {
    rect: {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    },
    width: deckPile.value.offsetWidth,
    height: deckPile.value.offsetHeight,
    rotationX: TABLE_ROTATION_X,
    rotationY: 0,
    rotationZ: -2,
    transformPerspective: 900,
  }
}

function resetDeckPose() {
  if (!deckPile.value) {
    return
  }

  gsap.set(deckPile.value, {
    rotationX: TABLE_ROTATION_X,
    rotationY: 0,
    rotationZ: -2,
    scale: 1,
    y: 0,
    clearProps: 'filter,opacity',
  })
}

function releaseDeckInteraction() {
  hasRequestedDraw = false
  isDeckPressing.value = false
  resetDeckPose()
}

function emitDrawAfterPress() {
  hasRequestedDraw = true
  emit('draw')

  nextTick(() => {
    if (!props.isDrawDisabled) {
      releaseDeckInteraction()
    }
  })
}

function handleDeckDraw() {
  if (isDeckInteractionDisabled.value || !deckPile.value) {
    return
  }

  isDeckPressing.value = true
  gsap.killTweensOf(deckPile.value)

  const reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches

  pressTimeline?.kill()
  pressTimeline = gsap.timeline({
    onComplete: emitDrawAfterPress,
  })

  if (reduceMotion) {
    pressTimeline
      .to(deckPile.value, {
        filter: 'brightness(0.82)',
        duration: 0.08,
        ease: 'power1.out',
      })
      .to(deckPile.value, {
        filter: 'brightness(1)',
        duration: 0.1,
        ease: 'power1.out',
      })
    return
  }

  pressTimeline
    .to(deckPile.value, {
      rotationX: TABLE_ROTATION_X,
      rotationY: 0,
      rotationZ: -1,
      scale: 0.96,
      y: 5,
      duration: 0.08,
      ease: 'power2.in',
    })
    .to(deckPile.value, {
      rotationZ: -2,
      scale: 1,
      y: 0,
      duration: 0.12,
      ease: 'back.out(1.8)',
    })
}

function createPileTilt(element, rotationZ) {
  if (!element) {
    return () => {}
  }

  gsap.set(element, {
    rotationX: TABLE_ROTATION_X,
    rotationY: 0,
    rotationZ,
    transformPerspective: 900,
    transformOrigin: '50% 100%',
    y: 0,
  })

  const moveX = gsap.quickTo(element, 'rotationY', {
    duration: 0.45,
    ease: 'power3.out',
  })
  const moveY = gsap.quickTo(element, 'rotationX', {
    duration: 0.45,
    ease: 'power3.out',
  })
  const lift = gsap.quickTo(element, 'y', {
    duration: 0.35,
    ease: 'power3.out',
  })

  function handlePointerMove(event) {
    if (isDeckInteractionDisabled.value && element === deckPile.value) {
      return
    }

    const bounds = element.getBoundingClientRect()
    const offsetX = (event.clientX - bounds.left) / bounds.width - 0.5
    const offsetY = (event.clientY - bounds.top) / bounds.height - 0.5

    moveX(offsetX * 4)
    moveY(TABLE_ROTATION_X + offsetY * -4)
    lift(-2)
  }

  function handlePointerLeave() {
    if (isDeckInteractionDisabled.value && element === deckPile.value) {
      return
    }

    moveX(0)
    moveY(TABLE_ROTATION_X)
    lift(0)
  }

  element.addEventListener('pointermove', handlePointerMove, { passive: true })
  element.addEventListener('pointerleave', handlePointerLeave)

  return () => {
    element.removeEventListener('pointermove', handlePointerMove)
    element.removeEventListener('pointerleave', handlePointerLeave)
  }
}

watch(
  () => props.isDrawDisabled,
  (isDisabled) => {
    if (!isDisabled && hasRequestedDraw) {
      releaseDeckInteraction()
    }
  },
)

defineExpose({
  getDeckRect,
  getDeckAnimationPose,
  getDiscardRect() {
    const topDiscardCard = discardPile.value?.querySelector('.table-card-pile__card:last-child')
    return topDiscardCard?.getBoundingClientRect() ?? discardPile.value?.getBoundingClientRect() ?? null
  },
  getPlayZoneRect() {
    const bounds = pileArea.value?.getBoundingClientRect()
    if (!bounds) {
      return null
    }

    const expandX = Math.min(Math.max(bounds.width * 0.24, 110), 220)
    const expandY = Math.min(Math.max(bounds.height * 0.16, 70), 160)

    return {
      left: bounds.left - expandX,
      top: bounds.top - expandY,
      width: bounds.width + expandX * 2,
      height: bounds.height + expandY * 2,
      right: bounds.right + expandX,
      bottom: bounds.bottom + expandY,
    }
  },
})

onMounted(() => {
  gsapContext = gsap.context(() => {
    gsap.set(deckPile.value, {
      rotationX: TABLE_ROTATION_X,
      rotationY: 0,
      rotationZ: -2,
      transformPerspective: 900,
      transformOrigin: '50% 100%',
    })
    gsap.set(discardPile.value, {
      rotationX: TABLE_ROTATION_X,
      rotationY: 0,
      rotationZ: 2,
      transformPerspective: 900,
      transformOrigin: '50% 100%',
    })

    gsapMedia = gsap.matchMedia()
    gsapMedia.add(
      '(pointer: fine) and (prefers-reduced-motion: no-preference)',
      () => {
        const clearDeckTilt = createPileTilt(deckPile.value, -2)
        const clearDiscardTilt = createPileTilt(discardPile.value, 2)

        return () => {
          clearDeckTilt()
          clearDiscardTilt()
        }
      },
    )
  }, pileArea.value)
})

onUnmounted(() => {
  pressTimeline?.kill()
  gsapMedia?.revert()
  gsapContext?.revert()
})
</script>

<template>
  <div
    ref="pileArea"
    class="pile-area flex items-end justify-center gap-[clamp(44px,8vw,112px)]"
    aria-label="牌庫與棄牌區"
  >
    <section
      class="flex flex-col items-center gap-[clamp(6px,1.4vh,12px)]"
      :aria-label="`牌庫，剩餘 ${deckCount} 張`"
    >
      <button
        ref="deckPile"
        type="button"
        class="table-card-pile table-card-pile--deck card-stack relative aspect-[3/4] h-[clamp(108px,25vh,220px)]"
        :class="{ 'table-card-pile--hidden': isDeckHidden }"
        :disabled="isDeckInteractionDisabled"
        :aria-label="`抽牌，牌庫剩餘 ${deckCount} 張`"
        @click="handleDeckDraw"
      >
        <img
          v-for="layer in 3"
          :key="layer"
          :src="cardBackUrl"
          alt=""
          aria-hidden="true"
          class="absolute inset-0 block size-full select-none object-contain"
          :class="`card-stack__layer--${layer}`"
          draggable="false"
        />
      </button>

      <p
        aria-hidden="true"
        class="m-0 text-[var(--text-xs)] font-bold tracking-[0.12em] text-white text-shadow-[0_2px_6px_var(--brand-navy)]"
      >
        牌庫 · {{ deckCount }} 張
      </p>
    </section>

    <section
      class="flex flex-col items-center gap-[clamp(6px,1.4vh,12px)]"
      :aria-label="topDiscardCard ? `棄牌區，上一張牌是 ${topDiscardCard.name}` : '棄牌區'"
    >
      <div
        ref="discardPile"
        class="table-card-pile table-card-pile--discard relative aspect-[3/4] h-[clamp(108px,25vh,220px)]"
        :class="{ 'table-card-pile--active': isDropTargetActive }"
      >
        <template v-for="(card, index) in normalizedDiscardCards" :key="`${index}-${card.name}`">
          <GameCard
            :name="card.name"
            :background-url="card.backgroundUrl"
            :frame-url="card.frameUrl"
            class="table-card-pile__card"
          />
        </template>
      </div>

      <p
        aria-hidden="true"
        class="m-0 text-[var(--text-xs)] font-bold tracking-[0.12em] text-white text-shadow-[0_2px_6px_var(--brand-navy)]"
      >
        棄牌區 · {{ topDiscardCard ? topDiscardCard.name : '尚未出牌' }}
      </p>
    </section>
  </div>
</template>

<style scoped>
.pile-area {
  perspective: 1100px;
}

.table-card-pile {
  isolation: isolate;
  transform-origin: 50% 100%;
  transform-style: preserve-3d;
  filter:
    drop-shadow(0 3px 3px rgba(0, 19, 50, 0.34))
    drop-shadow(0 9px 10px rgba(0, 19, 50, 0.24));
  will-change: transform;
}

.table-card-pile::after {
  position: absolute;
  z-index: -1;
  right: 5%;
  bottom: -5%;
  left: 5%;
  height: 12%;
  content: '';
  background: rgba(0, 19, 50, 0.46);
  filter: blur(7px);
  transform: translateZ(-1px) scaleX(0.96);
}

.table-card-pile--deck {
  padding: 0;
  cursor: pointer;
  border: 0;
  border-radius: 0;
  background: transparent;
  transform: rotateX(58deg) rotateZ(-2deg);
  transition:
    filter 0.18s ease,
    box-shadow 0.18s ease;
}

.table-card-pile--deck:hover:not(:disabled) {
  filter:
    brightness(1.06)
    drop-shadow(0 4px 4px rgba(0, 19, 50, 0.34))
    drop-shadow(0 12px 12px rgba(0, 19, 50, 0.26));
}

.table-card-pile--deck:focus-visible {
  outline: none;
  box-shadow: 0 0 0 5px var(--brand-focus);
}

.table-card-pile--deck:disabled {
  cursor: not-allowed;
}

.table-card-pile--hidden {
  visibility: hidden;
}

.table-card-pile--discard {
  transform: rotateX(58deg) rotateZ(2deg);
}

.table-card-pile--active {
  filter:
    drop-shadow(0 0 18px rgba(107, 184, 212, 0.88))
    drop-shadow(0 0 42px rgba(200, 168, 75, 0.38))
    drop-shadow(0 3px 3px rgba(0, 19, 50, 0.34))
    drop-shadow(0 9px 10px rgba(0, 19, 50, 0.24));
}

.table-card-pile__card {
  position: absolute;
  inset: 0;
}

.card-stack__layer--1 {
  transform: translate(clamp(7px, 1vw, 12px), clamp(7px, 1vw, 12px));
  filter: brightness(0.72);
}

.card-stack__layer--2 {
  transform: translate(clamp(3px, 0.5vw, 6px), clamp(3px, 0.5vw, 6px));
  filter: brightness(0.86);
}

.card-stack__layer--3 {
  transform: translate(0, 0);
}

@media (prefers-reduced-motion: reduce) {
  .table-card-pile {
    will-change: auto;
  }
}
</style>
