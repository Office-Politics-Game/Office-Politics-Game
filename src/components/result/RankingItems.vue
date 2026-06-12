<script setup >
import { ref, onMounted } from "vue";
import RankingItem from "./RankingItem.vue";
import { getRankingList } from "@/services/rankingService.js";

const rankingList = ref([]);

onMounted(async () => {
  rankingList.value = await getRankingList();
});
</script>

<template>
  <div class="flex flex-col">
    <RankingItem
      v-for="player in rankingList"
      :key="player.id"
      :name="player.name"
      :level="player.level"
      :score="player.stars"
      :avatar="player.avatar"
    />
  </div>
</template>
