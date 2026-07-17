<script setup>
import IntroMainSection from "@/components/intro/IntroMainSection.vue";
</script>

<template>
  <main class="intro-view" aria-label="職場風雲遊戲介紹">
    <IntroMainSection />
  </main>
</template>

<style scoped>
.intro-view {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--brand-navy);
  font-family: var(--font-sans);
}
</style>
