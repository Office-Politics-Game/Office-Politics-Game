<script setup>
import { ref } from 'vue'
import { gsap } from 'gsap'

const settingIcon = ref(null)
const emit = defineEmits(['open'])

function handleMouseEnter() {
  gsap.to(settingIcon.value, {
    rotation: 90,
    scale: 1.1,
    duration: 0.4,
    ease: 'back.out(1.7)',
  })
}

function handleMouseLeave() {
  gsap.to(settingIcon.value, {
    rotation: 0,
    scale: 1,
    duration: 0.3,
    ease: 'power2.out',
  })
}
</script>

<template>
  <button
    type="button"
    class="settings-button grid size-[clamp(50px,5.6vw,66px)] shrink-0 place-items-center"
    aria-label="開啟遊戲設定"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @focus="handleMouseEnter"
    @blur="handleMouseLeave"
    @click="emit('open')"
  >
    <svg
      ref="settingIcon"
      class="size-[clamp(42px,4.8vw,58px)] transition-colors drop-shadow-[0_2px_8px_rgba(0,19,50,0.48)]"
      viewBox="0 0 512 512"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        d="M487.4 315.7l-42.6-24.6c4.3-23.2 4.3-47 0-70.2l42.6-24.6c4.9-2.8 7.1-8.6 5.5-14-11.1-35.6-30-67.8-54.7-94.6-3.8-4.1-10-5.1-14.8-2.3L380.8 110c-17.9-15.4-38.5-27.3-60.8-35.1V25.8c0-5.6-3.9-10.5-9.4-11.7-36.7-8.2-74.3-7.8-109.2 0-5.5 1.2-9.4 6.1-9.4 11.7V75c-22.2 7.9-42.8 19.8-60.8 35.1L88.7 85.5c-4.9-2.8-11-1.9-14.8 2.3-24.7 26.7-43.6 58.9-54.7 94.6-1.7 5.4.6 11.2 5.5 14L67.3 221c-4.3 23.2-4.3 47 0 70.2l-42.6 24.6c-4.9 2.8-7.1 8.6-5.5 14 11.1 35.6 30 67.8 54.7 94.6 3.8 4.1 10 5.1 14.8 2.3l42.6-24.6c17.9 15.4 38.5 27.3 60.8 35.1v49.2c0 5.6 3.9 10.5 9.4 11.7 36.7 8.2 74.3 7.8 109.2 0 5.5-1.2 9.4-6.1 9.4-11.7v-49.2c22.2-7.9 42.8-19.8 60.8-35.1l42.6 24.6c4.9 2.8 11 1.9 14.8-2.3 24.7-26.7 43.6-58.9 54.7-94.6 1.5-5.5-.7-11.3-5.6-14.1zM256 336c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z"
      />
    </svg>
  </button>
</template>

<style scoped>
.settings-button {
  cursor: pointer;
  color: var(--gray-500);
  border: 0;
  border-radius: 0;
  background: transparent;
  transition:
    color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
}

.settings-button:hover {
  color: var(--brand-navy);
}

.settings-button:active {
  color: var(--brand-active);
}

.settings-button:focus-visible {
  outline: none;
  color: var(--brand-navy);
  background: rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 0 5px var(--brand-focus);
}

.settings-button:disabled {
  cursor: not-allowed;
  color: var(--brand-disabled);
  background: transparent;
  box-shadow: none;
}
</style>
