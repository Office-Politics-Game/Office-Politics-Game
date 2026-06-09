<script setup>
import BG from "../assets/BG_Result.jpg";
import Board from "@/assets/Result_Board.png";
import RankingItems from "@/components/result/RankingItems.vue";
</script>

<template>
  <div
    class="min-h-screen bg-cover bg-center bg-no-repeat content-center"
    :style="{ backgroundImage: `url(${BG})` }"
  >
    <div class="relative mx-auto h-100 w-fit">
      <img :src="Board" class="h-full object-contain" alt="ranking board" />

      <div class="absolute inset-0 flex absolute left-21 top-39">
        <RankingItems />
      </div>
    </div>
    <!-- 頁面內容 -->
  </div>
</template>
