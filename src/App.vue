<script setup>
import AchievementUnlockNotice from "@/components/common/AchievementUnlockNotice.vue";
import GameSettingsModal from "@/components/game/ui/GameSettingsModal.vue";
import GameSettingsIcon from "@/components/game/ui/GameSettingsIcon.vue";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import RotateDeviceNotice from "@/components/common/RotateDeviceNotice.vue";
import { usePreGameAudio } from "@/composables/UsePreGameAudio";
import { useAudioSettings } from "@/composables/UseAudioSettings";

const route = useRoute();
const { playPreGameSound, syncPreGameRouteAudio } = usePreGameAudio();

const isSettingsOpen = ref(false);
const {
  musicEnabled,
  musicVolume,
  soundEnabled,
  soundVolume,
  setMusicEnabled,
  setMusicVolume,
  setSoundEnabled,
  setSoundVolume,
} = useAudioSettings();
const shouldShowGlobalSettings = computed(
  () => !["Game", "Loading"].includes(route.name),
);

function openSettings() {
  playPreGameSound("login-button-click");
  isSettingsOpen.value = true;
}

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
  <RouterView v-slot="{ Component, route }">
    <Transition :name="route.query.transition === 'game-end' ? 'result-page-slide' : ''">
      <component :is="Component" :key="route.fullPath" />
    </Transition>
  </RouterView>
  <div v-if="shouldShowGlobalSettings" class="global-settings-button">
    <GameSettingsIcon @open="openSettings" />
  </div>
  <GameSettingsModal
    :is-open="isSettingsOpen"
    :music-enabled="musicEnabled"
    :music-volume="musicVolume"
    :sound-enabled="soundEnabled"
    :sound-volume="soundVolume"
    :show-lobby-action="false"
    :show-restart-action="false"
    @close="isSettingsOpen = false"
    @update:music-enabled="setMusicEnabled"
    @update:music-volume="setMusicVolume"
    @update:sound-enabled="setSoundEnabled"
    @update:sound-volume="setSoundVolume"
  />
  <AchievementUnlockNotice />
  <RotateDeviceNotice />
</template>

<style scoped>
.global-settings-button {
  position: fixed;
  top: 10px;
  right: 8px;
  z-index: 90;
  transform: translate(-4px, -4px);
}

.global-settings-button :deep(.settings-button) {
  width: 40px;
  height: 40px;
}

.global-settings-button :deep(.setting-icon) {
  width: 36px;
  height: 36px;
}

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

@media (min-width: 1024px) {
  .global-settings-button {
    top: 16px;
    right: 8px;
    transform: translate(-4px, -4px);
  }
}

@media (orientation: landscape) and (max-width: 1023px) and (max-height: 640px) {
  .global-settings-button {
    top: 8px;
    right: 0;
    transform: translate(-4px, -4px);
  }

  .global-settings-button :deep(.settings-button) {
    width: 32px;
    height: 32px;
  }

  .global-settings-button :deep(.setting-icon) {
    width: 22px;
    height: 22px;
  }
}
</style>
