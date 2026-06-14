<script setup>
import { ref } from "vue";
import { gsap } from "gsap";

const settingIcon = ref(null);
const emit = defineEmits(["open"]);

function handleMouseEnter() {
  gsap.to(settingIcon.value, {
    rotation: 90,
    scale: 1.1,
    duration: 0.4,
    ease: "back.out(1.7)",
  });
}

function handleMouseLeave() {
  gsap.to(settingIcon.value, {
    rotation: 0,
    scale: 1,
    duration: 0.3,
    ease: "power2.out",
  });
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
    <span
      ref="settingIcon"
      class="setting-icon size-[clamp(42px,4.8vw,58px)] drop-shadow-[0_2px_8px_rgba(0,19,50,0.48)]"
      aria-hidden="true"
    />
  </button>
</template>

<style scoped>
.settings-button {
  cursor: pointer;
  color: white;
  border: 0;
  border-radius: 0;
  background: transparent;
  transition:
    color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
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
.setting-icon {
  display: block;
  background-color: currentColor;

  -webkit-mask: url("@/assets/images/icon-setting.png") center / contain
    no-repeat;
  mask: url("@/assets/images/icon-setting.png") center / contain no-repeat;
}
</style>
