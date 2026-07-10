<template>
  <main class="auth-callback-page">
    <div class="auth-callback-bg" aria-hidden="true">
      <video
        class="auth-callback-video"
        autoplay
        muted
        loop
        playsinline
      >
        <source :src="bgEntryVideo" type="video/mp4" />
      </video>
    </div>
    <div class="auth-callback-overlay" aria-hidden="true"></div>
    <section class="auth-callback-panel" aria-live="polite">
      <p class="auth-callback-message">
        {{ authStore.errorMessage || "正在登入中，請稍後..." }}
      </p>
      <div class="auth-callback-loader" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </section>
  </main>
</template>

<script setup>
import { onMounted } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "@/stores/authStore.js"
import { usePlayerStore } from "@/stores/playerStore.js"
import bgEntryVideo from "@/assets/videos/EntryPage_BgVideo.mp4"

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
  @apply relative grid min-h-screen place-items-center overflow-hidden bg-gray-900 px-4 [font-family:var(--font-sans)];
}

.auth-callback-bg {
  @apply absolute inset-0 overflow-hidden;
}

.auth-callback-video {
  @apply absolute inset-0 h-full w-full object-cover;
  filter: blur(7px) saturate(1.18) brightness(0.58) contrast(1.12);
  transform: scale(1.045);
}

.auth-callback-overlay {
  @apply absolute inset-0 bg-black/40;
  background:
    linear-gradient(
      90deg,
      rgba(2, 18, 28, 0.5),
      rgba(4, 24, 35, 0.24),
      rgba(2, 18, 28, 0.52)
    ),
    linear-gradient(
      180deg,
      rgba(2, 13, 20, 0.34),
      rgba(4, 20, 28, 0.3) 48%,
      rgba(2, 11, 16, 0.58)
    ),
    rgba(5, 33, 46, 0.22);
}

.auth-callback-panel {
  @apply relative z-10 w-full max-w-[520px] overflow-hidden rounded-[var(--radius-lg)] border px-8 py-12 text-center backdrop-blur-[20px] sm:px-10;
  border-color: rgba(214, 215, 220, 0.42);
  background:
    linear-gradient(
      135deg,
      rgba(0, 19, 50, 0.94),
      rgba(18, 34, 48, 0.9) 58%,
      rgba(70, 85, 99, 0.82)
    ),
    rgba(0, 19, 50, 0.92);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.1) inset,
    0 26px 72px rgba(0, 0, 0, 0.5),
    0 0 44px rgba(214, 215, 220, 0.2);
}

.auth-callback-panel::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(
      90deg,
      transparent,
      rgba(134, 179, 224, 0.16),
      transparent
    ),
    repeating-linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.045) 0,
      rgba(255, 255, 255, 0.045) 1px,
      transparent 1px,
      transparent 10px
    );
  opacity: 0.72;
}

.auth-callback-panel::after {
  content: "";
  position: absolute;
  left: 28px;
  right: 28px;
  top: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(214, 215, 220, 0.82),
    rgba(134, 179, 224, 0.95),
    transparent
  );
  box-shadow: 0 0 20px rgba(214, 215, 220, 0.54);
}

.auth-callback-message {
  @apply relative m-0 text-[24px] font-black tracking-normal text-white sm:text-[26px];
  text-shadow:
    0 0 18px rgba(134, 179, 224, 0.58),
    0 2px 10px rgba(0, 0, 0, 0.42);
}

.auth-callback-loader {
  @apply relative mt-8 flex justify-center gap-4;
}

.auth-callback-loader span {
  @apply block h-4 w-4 bg-[var(--brand-primary)];
  box-shadow: 0 0 16px rgba(134, 179, 224, 0.78);
  animation: authCallbackPulse 0.9s ease-in-out infinite;
}

.auth-callback-loader span:nth-child(2) {
  animation-delay: 0.15s;
  background: var(--brand-hover);
  box-shadow: 0 0 18px rgba(0, 70, 244, 0.72);
}

.auth-callback-loader span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes authCallbackPulse {
  0%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }

  50% {
    opacity: 1;
    transform: translateY(-4px);
  }
}

@media (max-width: 420px) {
  .auth-callback-panel {
    @apply px-5 py-9;
  }

  .auth-callback-message {
    @apply text-[20px];
  }
  .auth-callback-loader span {
    @apply h-3 w-3;
  }
}
</style>