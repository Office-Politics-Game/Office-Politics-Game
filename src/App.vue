<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <div id="app" :class="{ 'login-route': route.name === 'Login' }">
    <router-view />
  </div>
</template>

<style>
#app.login-route {
  min-height: 100vh;
  overflow: hidden;
}
</style>
