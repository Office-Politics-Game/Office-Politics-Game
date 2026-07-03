<template>
  <section
    class="rotate-device-notice fixed inset-0 z-[100] flex min-h-[100dvh] w-full items-center justify-center bg-[linear-gradient(145deg,var(--brand-navy),var(--brand-active))] px-6 text-center text-white"
    aria-live="polite"
  >
    <div class="border-y border-white/45 px-6 py-7">
      <p class="m-0 text-[var(--text-lg)] font-semibold tracking-[0.08em]">
        請旋轉裝置以進入遊戲
      </p>
      <p class="mt-3 mb-0 text-[var(--text-sm)] text-white/72">
        此遊戲需要橫向畫面
      </p>
    </div>
  </section>
</template>

<style scoped>
@media (orientation: landscape) {
  .rotate-device-notice {
    display: none;
  }
}
</style>
