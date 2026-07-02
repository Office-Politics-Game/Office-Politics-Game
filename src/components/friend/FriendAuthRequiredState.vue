<template>
  <section
    class="friend-auth-required"
    :class="{ compact }"
    aria-live="polite"
  >
    <p class="auth-eyebrow">好友功能已鎖定</p>
    <h3 class="auth-title">登入後才能使用好友功能</h3>
    <p class="auth-copy">
      訪客可以繼續遊玩，但好友列表、邀請、解除好友與封鎖名單會綁定正式登入帳號。
    </p>

    <button type="button" class="auth-login-button" @click="emit('login')">
      前往登入
    </button>
  </section>
</template>

<script setup>
defineProps({
  compact: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["login"]);
</script>

<style scoped>
@reference "tailwindcss";

.friend-auth-required {
  @apply flex min-h-full flex-col items-center justify-center border border-[var(--gray-100)] bg-[rgba(255,255,255,0.78)] px-6 py-8 text-center;
}

.friend-auth-required.compact {
  @apply min-h-[240px] px-4 py-5;
}

.auth-eyebrow {
  @apply text-xs font-black tracking-[0.12em] text-[var(--brand-disabled)];
}

.auth-title {
  @apply mt-3 text-xl font-black text-[var(--brand-navy)];
}

.auth-copy {
  @apply mt-3 max-w-[420px] text-sm font-bold leading-6 text-[var(--gray-400)];
}

.auth-login-button {
  @apply mt-6 min-h-12 min-w-36 border border-[var(--brand-primary)] bg-[var(--surface-glass)] px-5 py-3 text-sm font-extrabold text-[var(--brand-navy)] transition-[background,border-color,box-shadow,color,transform] duration-[180ms] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--brand-focus)];
}

.auth-login-button:hover {
  @apply -translate-y-px border-[var(--brand-hover)] bg-[var(--brand-hover)] text-white;
}

.auth-login-button:active {
  @apply translate-y-px border-[var(--brand-active)] bg-[var(--brand-active)] text-white;
}
</style>
