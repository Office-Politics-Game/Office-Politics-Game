<script setup>
defineProps({
  roundNumber: {
    type: [Number, String],
    required: true,
  },
  currentPhase: {
    type: String,
    required: true,
  },
  currentStep: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <div
    class="flex items-stretch overflow-hidden border border-white/75 text-xs font-medium tracking-[0.04em] text-white shadow-[0_4px_16px_rgba(0,19,50,0.2)] backdrop-blur-[6px] lg:text-[18px]"
    aria-label="目前回合狀態"
  >
    <span class="flex items-center bg-[rgba(70,85,99,0.72)] px-3 py-1 lg:px-6">
      第 {{ roundNumber }} 回合
    </span>
    <span
      class="flex items-center bg-white px-3 text-[var(--brand-active)] lg:px-6"
    >
      {{ currentPhase }}
    </span>
    <span
      class="flex items-center bg-[rgba(70,85,99,0.72)] px-3 py-1 text-white lg:px-6"
    >
      {{ currentStep }}
    </span>
  </div>
</template>
