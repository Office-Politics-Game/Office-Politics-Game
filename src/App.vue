<script setup>
import { watch } from "vue";
import { useRoute } from "vue-router";
import RotateDeviceNotice from "@/components/common/RotateDeviceNotice.vue";
import { usePreGameAudio } from "@/composables/UsePreGameAudio";

const route = useRoute();
const { syncPreGameRouteAudio } = usePreGameAudio();

watch(
  () => route.name,
  (routeName, previousRouteName) => {
    const fadeIn =
      previousRouteName === "Mall" || previousRouteName === "Game";
    syncPreGameRouteAudio(routeName, { fadeIn });
  },
  { immediate: true },
);
</script>

<template>
  <RouterView />
  <RotateDeviceNotice />
</template>
