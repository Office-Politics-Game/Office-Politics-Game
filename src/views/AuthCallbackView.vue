<template>
  <main class="auth-callback-page">
    <section class="auth-callback-panel" aria-live="polite">
      <h1 class="auth-callback-title">第三方登入處理中</h1>
      <p class="auth-callback-message">
        {{ authStore.errorMessage || "正在完成登入，請稍候..." }}
      </p>
    </section>
  </main>
</template>

<script setup>
import { onMounted } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "@/stores/authStore.js"
import { usePlayerStore } from "@/stores/playerStore.js"

const router = useRouter()
const authStore = useAuthStore()
const playerStore = usePlayerStore()

onMounted(async () => {
  try {
    await authStore.completeOAuthLogin()

    if (authStore.currentPlayer) {
      localStorage.removeItem("guestPlayer")
      playerStore.setCurrentPlayer(authStore.currentPlayer)
    }

    await router.replace("/lobby")
  } catch {
    await router.replace({
      path: "/",
      query: { auth: "login" },
    })
  }
})
</script>

<style scoped>
@reference "tailwindcss";

.auth-callback-page {
  @apply grid min-h-screen place-items-center bg-[linear-gradient(180deg,#ffffff_0%,#F4F7FB_100%)] px-4 [font-family:var(--font-sans)];
}

.auth-callback-panel {
  @apply w-full max-w-[420px] rounded-[var(--radius-lg)] border border-[rgba(134,179,224,0.38)] bg-[rgba(255,255,255,0.92)] px-6 py-8 text-center shadow-[var(--shadow)];
}

.auth-callback-title {
  @apply m-0 text-[var(--text-xl)] font-black text-[var(--brand-navy)];
}

.auth-callback-message {
  @apply mt-4 mb-0 text-[var(--text-md)] font-semibold text-[var(--brand-active)];
}
</style>