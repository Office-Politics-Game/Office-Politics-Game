<script setup>
import { ref, computed, onMounted } from "vue";
import { getRankingList } from "@/services/rankingService.js";
import Crown from "@/assets/images/crown.png";
const rankingList = ref([]);
const champion = computed(() => rankingList.value[0]);
onMounted(async () => {
  rankingList.value = await getRankingList();
});
</script>

<template>
  <div v-if="champion" class="relative flex flex-col items-center">
    <div>
      <img
        :src="Crown"
        class="absolute h-10 w-10 mt-3 -top-3 -left-2 -rotate-12 lg:h-16 lg:w-16"
      />
      <img
        :src="champion.avatar"
        :alt="champion.name"
        class="h-20 w-20 rounded-full mt-5 object-cover left-0 top-0 lg:h-32 lg:w-32 lg:mt-10"
      />
    </div>

    <div class="mt-2 text-lg font-bold text-slate-600 lg:mt-4 lg:text-3xl">
      {{ champion.name }}
    </div>
  </div>
</template>
