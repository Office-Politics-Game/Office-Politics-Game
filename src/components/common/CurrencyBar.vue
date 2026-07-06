<template>
  <section
    class="flex items-center gap-1.5 text-white lg:gap-2"
  >
    <div
      v-if="items.includes('coins')"
      class="flex h-6 w-20 -skew-x-[20deg] items-center justify-center bg-slate-400/70 px-2 shadow-[inset_0_0_10px_rgba(255,255,255,0.12)] backdrop-blur-sm lg:h-7 lg:w-24"
    >
      <div class="flex skew-x-[20deg] items-center gap-1.5">
        <span
          class="grid h-4 w-4 place-items-center rounded-full bg-gradient-to-br from-yellow-200 via-amber-400 to-orange-500 text-[10px] font-black text-amber-900 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.65),0_1px_2px_rgba(0,0,0,0.25)] lg:h-5 lg:w-5 lg:text-xs"
        >
          $
        </span>
        <span class="min-w-8 text-[10px] font-bold tracking-normal text-white/90 lg:min-w-12 lg:text-sm">
          {{ currencyStore.coins }}
        </span>
      </div>
    </div>

    <div
      v-if="items.includes('gems')"
      class="flex h-6 w-20 -skew-x-[20deg] items-center justify-center bg-slate-400/70 px-2 shadow-[inset_0_0_10px_rgba(255,255,255,0.12)] backdrop-blur-sm lg:h-7 lg:w-24"
    >
      <div class="flex skew-x-[20deg] items-center gap-1.5">
        <span class="grid h-4 w-4 place-items-center rounded-sm bg-sky-200/80 text-blue-900 lg:h-5 lg:w-5">
          <TrendingUp class="h-3 w-3 lg:h-3.5 lg:w-3.5" />
        </span>
        <span class="min-w-8 text-[10px] font-bold tracking-normal text-white/90 lg:min-w-12 lg:text-sm">
          {{ currencyStore.gems }}
        </span>
      </div>
    </div>

    <div
      v-if="items.includes('tickets')"
      class="flex h-6 w-20 -skew-x-[20deg] items-center justify-center bg-slate-400/70 px-2 shadow-[inset_0_0_10px_rgba(255,255,255,0.12)] backdrop-blur-sm lg:h-7 lg:w-24"
    >
      <div class="flex skew-x-[20deg] items-center gap-1.5">
        <span class="relative h-5 w-5 overflow-hidden lg:h-6 lg:w-6">
          <img
            :src="lotteryTicketImage"
            alt=""
            class="absolute left-1/2 top-1/2 h-10 max-w-none -translate-x-1/2 -translate-y-[34%] lg:h-12"
          />
        </span>
        <span class="min-w-8 text-[10px] font-bold tracking-normal text-white/90 lg:min-w-12 lg:text-sm">
          {{ currencyStore.tickets }}
        </span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { TrendingUp } from "lucide-vue-next";
import lotteryTicketImage from "@/assets/images/lottery-ticket.webp";
import { useCurrencyStore } from "@/stores/currencyStore.js";

defineProps({
  items: {
    type: Array,
    default: () => ["coins", "gems", "tickets"],
  },
});

const currencyStore = useCurrencyStore();
</script>
