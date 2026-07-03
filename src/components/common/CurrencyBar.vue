<template>
  <section
    class="flex items-center gap-2 text-white lg:gap-3"
  >
    <div
      v-if="items.includes('coins')"
      class="-skew-x-[20deg] bg-slate-950/35 px-3 py-0.5 shadow-[inset_0_0_12px_rgba(255,255,255,0.08)] backdrop-blur-sm"
    >
      <div class="flex skew-x-[20deg] items-center gap-1.5">
        <span
          class="grid h-4 w-4 place-items-center rounded-full border border-yellow-200/80 text-[10px] font-black text-yellow-300 lg:h-5 lg:w-5 lg:text-xs"
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
      class="-skew-x-[20deg] bg-slate-950/35 px-3 py-0.5 shadow-[inset_0_0_12px_rgba(255,255,255,0.08)] backdrop-blur-sm"
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
      class="-skew-x-[20deg] bg-slate-950/35 px-3 py-0.5 shadow-[inset_0_0_12px_rgba(255,255,255,0.08)] backdrop-blur-sm"
    >
      <div class="flex skew-x-[20deg] items-center gap-1.5">
        <span class="text-[10px] font-black text-blue-100 lg:text-xs">
          T
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
import { useCurrencyStore } from "@/stores/currencyStore.js";

defineProps({
  items: {
    type: Array,
    default: () => ["coins", "gems", "tickets"],
  },
});

const currencyStore = useCurrencyStore();
</script>
