<script setup>
import BG from "../assets/images/bg-result.webp";
import Board from "@/assets/images/result-board.webp";
import RankingItems from "@/components/result/RankingItems.vue";
import ChampionCard from "@/components/result/ChampionCard.vue";
import Achievements from "@/components/result/Achievements.vue";
</script>

<template>
  <div
    class="min-h-screen bg-cover bg-center bg-no-repeat content-center"
    :style="{ backgroundImage: `url(${BG})` }"
  >
    <div class="relative mx-auto h-90 w-fit lg:h-150">
      <img :src="Board" class="h-full object-contain" alt="ranking board" />

      <div
        class="absolute inset-0 left-18 top-34 flex gap-12 lg:left-30 lg:top-56 lg:gap-23"
      >
        <div><RankingItems /></div>
        <div><ChampionCard /></div>
        <div><Achievements /></div>
      </div>
      <div class="absolute bottom-6 left-1/2 -translate-x-1/2 lg:bottom-10">
        <button
          class="bg-[var(--brand-active)] px-4 py-1 text-sm text-white hover:bg-[var(--brand-hover)] lg:px-8 lg:py-2 lg:text-lg"
        >
          返回大廳
        </button>
      </div>
    </div>
    <!-- 頁面內容 -->
  </div>
</template>
