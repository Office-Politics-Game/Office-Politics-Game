<script setup>
import { onMounted } from "vue";
import RotateDeviceNotice from "@/components/common/RotateDeviceNotice.vue";
import { useAuthStore } from "@/stores/authStore.js";

const authStore = useAuthStore();

onMounted(() => {
  authStore.initializeSession().catch(() => false);
});
</script>

<template>
  <RouterView />
  <RotateDeviceNotice />
</template>
