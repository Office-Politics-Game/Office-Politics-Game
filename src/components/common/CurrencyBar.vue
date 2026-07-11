<template>
  <section
    class="flex items-center gap-1.5 text-white lg:gap-2"
  >
    <div
      v-if="items.includes('coins')"
      tabindex="0"
      class="group relative flex h-6 w-24 -skew-x-[20deg] items-center justify-center border border-white/60 bg-white/5 px-2 backdrop-blur-[1px] lg:h-7 lg:w-28"
      @click="blurCurrencyItem"
    >
      <div class="flex w-full skew-x-[20deg] items-center justify-between gap-1.5">
        <span class="relative h-5 w-5 overflow-hidden lg:h-6 lg:w-6">
          <img
            :src="officeTokenImage"
            alt=""
            class="absolute left-1/2 top-1/2 h-4.5 max-w-none -translate-x-1/2 -translate-y-1/2 lg:h-5.5"
          />
        </span>
        <span class="flex-1 pr-2 text-right text-[10px] font-bold tracking-normal text-white/90 lg:pr-2.5 lg:text-sm">
          {{ displayCurrency(currencyStore.coins) }}
        </span>
      </div>
      <div :class="tooltipClass">
        金幣可由遊玩遊戲獲得
      </div>
    </div>

    <div
      v-if="items.includes('gems')"
      tabindex="0"
      class="group relative flex h-6 w-24 -skew-x-[20deg] items-center justify-center border border-white/60 bg-white/5 px-2 backdrop-blur-[1px] lg:h-7 lg:w-28"
      @click="blurCurrencyItem"
    >
      <div class="flex w-full skew-x-[20deg] items-center justify-between gap-1.5">
        <span class="relative h-5 w-5 overflow-hidden lg:h-6 lg:w-6">
          <img
            :src="stockTokenImage"
            alt=""
            class="absolute left-1/2 top-1/2 h-5.5 max-w-none -translate-x-1/2 -translate-y-1/2 lg:h-6.5"
          />
        </span>
        <span class="flex-1 pr-2 text-right text-[10px] font-bold tracking-normal text-white/90 lg:pr-2.5 lg:text-sm">
          {{ displayCurrency(currencyStore.gems) }}
        </span>
      </div>
      <div :class="tooltipClass">
        股票可由商城儲值獲得
      </div>
    </div>

    <div
      v-if="items.includes('tickets')"
      tabindex="0"
      class="group relative flex h-6 w-24 -skew-x-[20deg] items-center justify-center border border-white/60 bg-white/5 px-2 backdrop-blur-[1px] lg:h-7 lg:w-28"
      @click="blurCurrencyItem"
    >
      <div class="flex w-full skew-x-[20deg] items-center justify-between gap-1.5">
        <span class="relative h-5 w-5 overflow-hidden lg:h-6 lg:w-6">
          <img
            :src="lotteryTicketImage"
            alt=""
            class="absolute left-1/2 top-1/2 h-8.5 max-w-none -translate-x-1/2 -translate-y-[32%] lg:h-10"
          />
        </span>
        <span class="flex-1 pr-2 text-right text-[10px] font-bold tracking-normal text-white/90 lg:pr-2.5 lg:text-sm">
          {{ displayCurrency(currencyStore.tickets) }}
        </span>
      </div>
      <div :class="tooltipClass">
        抽獎券可於商城購買
      </div>
    </div>
  </section>
</template>

<script setup>
import stockTokenImage from "@/assets/images/stock-token.webp";
import officeTokenImage from "@/assets/images/office-token.webp";
import lotteryTicketImage from "@/assets/images/lottery-ticket.webp";
import { computed } from "vue";
import { useCurrencyStore } from "@/stores/currencyStore.js";

const props = defineProps({
  items: {
    type: Array,
    default: () => ["coins", "gems", "tickets"],
  },
  tooltipSize: {
    type: String,
    default: "large",
  },
});

const currencyStore = useCurrencyStore();
const maxCurrencyDisplay = 99999;
const tooltipClass = computed(() => {
  const baseClass = "pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-max -translate-x-1/2 skew-x-[20deg] rounded-md border border-white/40 bg-slate-950/90 text-center text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus:opacity-100 group-active:opacity-100";

  if (props.tooltipSize === "small") {
    return `${baseClass} max-w-44 px-2 py-1 text-[10px] leading-snug`;
  }

  return `${baseClass} max-w-72 px-4 py-2.5 text-sm leading-relaxed`;
});

function displayCurrency(value) {
  const numericValue = Number(value) || 0;
  return Math.min(numericValue, maxCurrencyDisplay);
}

function blurCurrencyItem(event) {
  if (window.matchMedia("(hover: hover)").matches) {
    event.currentTarget.blur();
  }
}
</script>
