<script setup>
import { ref } from "vue";
import CardInspectionOverlay from "@/components/game/ui/CardInspectionOverlay.vue";
import GameCard from "@/components/game/ui/GameCard.vue";
import cardsIllustrationUrl from "@/assets/images/intro/cards.webp";
import { cardAssetsByKey } from "@/constants/cardAssets.js";

const cardOrder = [
  "ceo",
  "advisor",
  "hr",
  "pm",
  "senior",
  "manager",
  "intern",
  "cleaner",
];

const cards = cardOrder.map((key) => ({
  key,
  ...cardAssetsByKey[key],
}));

const inspectedCard = ref(null);

function openCardInspection(card) {
  inspectedCard.value = card;
}

function closeCardInspection() {
  inspectedCard.value = null;
}
</script>

<template>
  <section
    id="intro-cards"
    class="flex h-full min-h-full w-full justify-center snap-start snap-always overflow-hidden bg-[linear-gradient(90deg,#ffffff_0%,#f4f7fb_58%,rgba(134,179,224,0.62)_100%)]"
    aria-labelledby="intro-cards-title"
  >
    <div
      class="flex h-[654px] w-[calc(90%/var(--intro-scale))] min-w-[calc(600px/var(--intro-scale))] max-w-[calc(1180px/var(--intro-scale))] origin-top scale-[var(--intro-scale)] items-center gap-[42px] py-6"
    >
      <aside
        class="flex h-[560px] w-85 shrink-0 flex-col justify-between"
        aria-labelledby="intro-cards-title"
      >
        <header>
          <p
            class="m-0 [color:var(--gray-300)] [font-size:24px] font-bold leading-none"
          >
            卡牌介紹 CARDS
          </p>
          <div
            class="mt-[28px] h-[6px] w-[88px] bg-[var(--brand-hover)]"
            aria-hidden="true"
          />
        </header>

        <img
          class="ml-[4px] mt-[38px] block w-[300px] object-contain"
          :src="cardsIllustrationUrl"
          alt="職場風雲卡牌牌庫與未知手牌"
        />

        <ul
          class="m-0 grid list-none gap-[18px] p-0 [color:var(--brand-active)] [font-size:22px] font-bold leading-none"
          aria-label="卡牌資訊"
        >
          <li class="flex items-baseline gap-[12px]">
            <span class="[color:var(--brand-hover)]" aria-hidden="true">-</span>
            <span>
              全遊戲共
              <strong
                class="[color:var(--brand-hover)] [font-size:32px] font-black"
              >
                16
              </strong>
              張卡牌
            </span>
          </li>
          <li class="flex items-baseline gap-[12px]">
            <span class="[color:var(--brand-hover)]" aria-hidden="true">-</span>
            <span>
              <strong
                class="[color:var(--brand-hover)] [font-size:32px] font-black"
              >
                8
              </strong>
              種職位，各具獨特能力
            </span>
          </li>
          <li class="flex items-baseline gap-[12px]">
            <span class="[color:var(--brand-hover)]" aria-hidden="true">-</span>
            <span>
              每位玩家手上各持
              <strong
                class="[color:var(--brand-hover)] [font-size:32px] font-black"
              >
                1
              </strong>
              張卡牌
            </span>
          </li>
        </ul>
      </aside>

      <div
        class="grid min-w-0 flex-1 grid-cols-4 gap-x-[24px] gap-y-[28px]"
        aria-label="職位卡牌一覽"
      >
        <button
          v-for="card in cards"
          :key="card.key"
          class="h-[224px] w-[164px] bg-transparent p-0 transition-transform duration-[180ms] ease-out hover:-translate-y-px active:translate-y-px focus-visible:outline-0 focus-visible:shadow-[0_0_0_5px_var(--brand-focus)]"
          type="button"
          :aria-label="`檢視卡牌：${card.name}`"
          @click="openCardInspection(card)"
        >
          <GameCard
            :name="card.name"
            :background-url="card.backgroundUrl"
            :frame-url="card.frameUrl"
          />
        </button>
      </div>
    </div>

    <CardInspectionOverlay
      v-if="inspectedCard"
      :card="inspectedCard"
      :card-aria-label="`檢視卡牌：${inspectedCard.name}`"
      :emit-card-pointer-down="false"
      @close="closeCardInspection"
    />
  </section>
</template>
