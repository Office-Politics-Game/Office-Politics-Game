<script setup>
import AchievementUnlockNotice from "@/components/common/AchievementUnlockNotice.vue";
import { watch } from "vue";
import { useRoute } from "vue-router";
import RotateDeviceNotice from "@/components/common/RotateDeviceNotice.vue";
import { usePreGameAudio } from "@/composables/UsePreGameAudio";

const route = useRoute();
const { syncPreGameRouteAudio } = usePreGameAudio();

watch(
  () => route.name,
  (routeName, previousRouteName) => {
    const fadeIn = previousRouteName === "Mall";
    syncPreGameRouteAudio(routeName, { fadeIn });
  },
  { immediate: true },
);
</script>

<template>
  <RouterView v-slot="{ Component, route }">
    <Transition :name="route.query.transition === 'game-end' ? 'result-page-slide' : ''">
      <component :is="Component" :key="route.fullPath" />
    </Transition>
  </RouterView>

  <AchievementUnlockNotice />
  <RotateDeviceNotice />
</template>

<style scoped>
.result-page-slide-enter-active {
  position: fixed;
  inset: 0;
  z-index: 80;
  transition:
    transform 0.72s cubic-bezier(.2, .82, .2, 1),
    opacity 0.72s ease;
}

.result-page-slide-enter-from {
  opacity: 0.96;
  transform: translateX(100%);
}

.result-page-slide-enter-to {
  opacity: 1;
  transform: translateX(0);
}

@media (prefers-reduced-motion: reduce) {
  .result-page-slide-enter-active {
    position: static;
    transition: none;
  }

  .result-page-slide-enter-from,
  .result-page-slide-enter-to {
    opacity: 1;
    transform: none;
  }
}
</style>
