<template>
  <section class="profile-empty grid min-h-[280px] content-center justify-items-center p-[24px_20px] text-center lg:min-h-[360px] lg:p-11">
    <h2 class="m-0 text-[length:var(--text-xl)] font-black text-[var(--brand-navy)]">{{ title }}</h2>
    <p class="mt-3 mb-0 max-w-[420px] text-[length:var(--text-xs)] font-semibold leading-[1.7] text-[var(--gray-500)]">{{ description }}</p>
    <button type="button" class="btn-dark profile-empty__button mt-6 h-11 min-w-36 opacity-70" disabled>
      即將開放
    </button>
  </section>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});
</script>
