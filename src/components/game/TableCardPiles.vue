<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { gsap } from 'gsap'
import cardBackUrl from '@/assets/images/card-bg-back.webp'
import GameCard from './GameCard.vue'

const pileArea = ref(null)
const deckPile = ref(null)
const discardPile = ref(null)
const TABLE_ROTATION_X = 58
let gsapContext
let gsapMedia

defineProps({
  deckCount: {
    type: [Number, String],
    required: true,
  },
  discardCard: {
    type: Object,
    required: true,
    validator: (card) =>
      typeof card?.name === 'string' &&
      typeof card?.backgroundUrl === 'string' &&
      typeof card?.frameUrl === 'string',
  },
})

function getDeckRect() {
  return deckPile.value?.getBoundingClientRect() ?? null
}

defineExpose({
  getDeckRect,
})

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
    const bounds = element.getBoundingClientRect()
    const offsetX = (event.clientX - bounds.left) / bounds.width - 0.5
    const offsetY = (event.clientY - bounds.top) / bounds.height - 0.5

    moveX(offsetX * 4)
    moveY(TABLE_ROTATION_X + offsetY * -4)
    lift(-2)
  }

  function handlePointerLeave() {
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
      <div
        ref="deckPile"
        class="table-card-pile table-card-pile--deck card-stack relative aspect-[3/4] h-[clamp(108px,25vh,220px)]"
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
      </div>

      <p
        aria-hidden="true"
        class="m-0 text-[var(--text-xs)] font-bold tracking-[0.12em] text-white text-shadow-[0_2px_6px_var(--brand-navy)]"
      >
        牌庫 · {{ deckCount }} 張
      </p>
    </section>

    <section
      class="flex flex-col items-center gap-[clamp(6px,1.4vh,12px)]"
      :aria-label="`棄牌區，上一張牌是${discardCard.name}`"
    >
      <div
        ref="discardPile"
        class="table-card-pile table-card-pile--discard relative aspect-[3/4] h-[clamp(108px,25vh,220px)]"
      >
        <GameCard
          :name="discardCard.name"
          :background-url="discardCard.backgroundUrl"
          :frame-url="discardCard.frameUrl"
        />
      </div>

      <p
        aria-hidden="true"
        class="m-0 text-[var(--text-xs)] font-bold tracking-[0.12em] text-white text-shadow-[0_2px_6px_var(--brand-navy)]"
      >
        棄牌區 · {{ discardCard.name }}
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
  transform: rotateX(58deg) rotateZ(-2deg);
}

.table-card-pile--discard {
  transform: rotateX(58deg) rotateZ(2deg);
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
