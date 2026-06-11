<script setup>
import cardBackUrl from '@/assets/CardBGBack.png'
import GameCard from './GameCard.vue'

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
</script>

<template>
  <div
    class="flex items-end justify-center gap-[clamp(44px,8vw,112px)]"
    aria-label="牌庫與棄牌區"
  >
    <section
      class="flex flex-col items-center gap-[clamp(6px,1.4vh,12px)]"
      :aria-label="`牌庫，剩餘 ${deckCount} 張`"
    >
      <div class="card-stack relative aspect-[3/4] h-[clamp(108px,25vh,220px)]">
        <img
          v-for="layer in 3"
          :key="layer"
          :src="cardBackUrl"
          alt=""
          aria-hidden="true"
          class="absolute inset-0 block size-full select-none object-contain drop-shadow-[0_8px_12px_rgba(0,19,50,0.24)]"
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
        class="relative aspect-[3/4] h-[clamp(108px,25vh,220px)] rotate-[2deg] drop-shadow-[0_10px_16px_rgba(0,19,50,0.28)]"
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
</style>
