<script setup>
import BG from "../assets/BG_Result.jpg";
import Board from "@/assets/Result_Board.png";
import RankingItems from "@/components/result/RankingItems.vue";
import ChampionCard from "@/components/result/ChampionCard.vue";
import Achievements from "@/components/result/Achievements.vue";
</script>

<template>
  <div
    class="min-h-screen bg-cover bg-center bg-no-repeat content-center"
    :style="{ backgroundImage: `url(${BG})` }"
  >
    <div class="relative mx-auto h-90 w-fit">
      <img :src="Board" class="h-full object-contain" alt="ranking board" />

      <div class="flex gap-12 inset-0 flex absolute left-18 top-34">
        <RankingItems />
        <ChampionCard />
        <Achievements />
      </div>

      <div></div>
    </div>
    <!-- 頁面內容 -->
  </div>
</template>
