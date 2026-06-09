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
})
</script>

<template>
  <div
    class="flex h-[clamp(28px,4.2vh,36px)] items-stretch overflow-hidden rounded-full border border-white/75 text-[clamp(12px,1.4vw,15px)] font-medium tracking-[0.04em] text-white shadow-[0_4px_16px_rgba(0,19,50,0.2)] backdrop-blur-[6px]"
    aria-label="目前回合狀態"
  >
    <span class="flex items-center bg-[rgba(70,85,99,0.72)] px-[clamp(12px,1.35vw,18px)]">
      第 {{ roundNumber }} 回合
    </span>
    <span class="flex items-center bg-white px-[clamp(12px,1.35vw,18px)] text-[var(--brand-active)]">
      {{ currentPhase }}
    </span>
    <span class="flex items-center bg-[rgba(255,255,255,0.2)] px-[clamp(12px,1.35vw,18px)]">
      {{ currentStep }}
    </span>
  </div>
</template>
