<script setup>
  import GameRoom from '@/components/layout/GameRoom.vue'
</script>

<template>
  <main>
    <section class="preview-section">
      <GameRoom />
    </section>
    <RouterView />
  </main>
</template>
