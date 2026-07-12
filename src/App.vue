<script setup>
import AchievementUnlockNotice from "@/components/common/AchievementUnlockNotice.vue";
import RotateDeviceNotice from "@/components/common/RotateDeviceNotice.vue";
</script>

<template>
  <RouterView />
  <AchievementUnlockNotice />
  <RotateDeviceNotice />
</template>
