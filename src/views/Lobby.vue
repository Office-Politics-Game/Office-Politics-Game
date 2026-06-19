<template>
  <main
    class="w-screen min-h-screen bg-[#1e1e1e] flex items-center justify-center overflow-hidden"
  >
    <div
      class="relative w-full min-h-screen bg-cover bg-center flex items-center justify-center"
      :style="{ backgroundImage: `url(${bgDashboard})` }"
    >
      <div class="absolute inset-0 bg-black/20"></div>
      <div class="lobby-flip-scene relative h-81 w-144 lg:h-135 lg:w-240">
        <div
          class="lobby-flip-card"
          :class="{ 'is-flipped': isGameMenuRoute }"
        >
          <div
            class="lobby-flip-face lobby-flip-front"
            :class="{ 'is-inactive': isGameMenuRoute }"
          >
            <LobbyMenu />
          </div>
          <div
            class="lobby-flip-face lobby-flip-back"
            :class="{ 'is-inactive': !isGameMenuRoute }"
          >
            <GameMenuPanel />
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import GameMenuPanel from "@/components/gameRoom/GameMenuPanel.vue";
import LobbyMenu from "@/components/menu/LobbyMenu.vue";
import bgDashboard from "@/assets/images/bg-dashboard.webp";

const route = useRoute();
const isGameMenuRoute = computed(() => route.name === "LobbyGameMenu");
</script>

<style scoped>
.lobby-flip-scene {
  perspective: 1600px;
}

.lobby-flip-card {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 700ms cubic-bezier(0.22, 0.61, 0.36, 1);
}

.lobby-flip-card.is-flipped {
  transform: rotateY(180deg);
}

.lobby-flip-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.lobby-flip-face.is-inactive {
  pointer-events: none;
}

.lobby-flip-front {
  transform: rotateY(0deg);
}

.lobby-flip-back {
  transform: rotateY(180deg);
}

@media (prefers-reduced-motion: reduce) {
  .lobby-flip-card {
    transition: none;
  }
}
</style>
