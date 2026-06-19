<script setup>
import GameMenuPanel from "@/components/gameRoom/GameMenuPanel.vue";
</script>

<template>
  <main class="game-view relative overflow-hidden text-[#282623]">
    <GameMenuPanel />
  </main>
</template>

<style scoped>
.game-view {
  width: 100vw;
  height: 100svh;
  min-height: 100svh;
}
</style>
