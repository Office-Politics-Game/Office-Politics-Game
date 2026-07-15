<template>
  <section
    class="login-card relative w-full max-w-[420px] max-h-[calc(100dvh-32px)] overflow-y-auto overflow-x-hidden px-6 py-7 sm:px-8 sm:py-8 max-[420px]:px-5 max-[420px]:py-6"
    aria-labelledby="login-title"
  >
    <div
      class="absolute inset-x-8 top-0 h-px login-rule"
      aria-hidden="true"
    ></div>

    <button
      type="button"
      class="btn-dark tap-pop absolute right-3 top-3 grid h-9 w-9 place-items-center"
      aria-label="關閉登入視窗"
      @click="closeLogin"
    >
      <span aria-hidden="true">×</span>
    </button>

    <h2
      id="login-title"
      class="mb-7 text-center font-black login-title max-lg:landscape:mb-3"
    >
      登入
    </h2>

    <form
      class="grid gap-3.5 max-lg:landscape:gap-2"
      @submit.prevent="handleLogin"
    >
      <label class="relative block">
        <span class="sr-only">Email帳號</span>
        <input
          v-model.trim="account"
          class="login-input w-full border outline-0 pr-[78px]"
          type="email"
          autocomplete="email"
          inputmode="email"
          placeholder="Email帳號"
          :disabled="authStore.isLoading"
          @input="clearLoginError"
        />
        <p v-if="accountError" class="login-error" role="alert">
          {{ accountError }}
        </p>
      </label>

      <label class="relative block">
        <span class="sr-only">密碼</span>
        <input
          v-model="password"
          class="login-input w-full border outline-0 pr-14"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="current-password"
          placeholder="密碼"
          :disabled="authStore.isLoading"
          @input="clearLoginError"
        />
        <button
          type="button"
          class="password-toggle"
          :aria-label="showPassword ? '隱藏密碼' : '顯示密碼'"
          :disabled="authStore.isLoading"
          @click="togglePasswordVisibility"
        >
          <EyeOff v-if="showPassword" class="password-toggle__icon" />
          <Eye v-else class="password-toggle__icon" />
        </button>
        <p v-if="passwordError" class="login-error" role="alert">
          {{ passwordError }}
        </p>
      </label>
      <div
        v-if="visibleNoticeMessage"
        class="auth-alert"
        :class="[
          visibleNoticeType === 'success' ? 'is-success' : 'is-error',
          isNoticeLeaving ? 'is-leaving' : '',
        ]"
        :role="visibleNoticeType === 'success' ? 'status' : 'alert'"
      >
        <div class="auth-alert__icon" aria-hidden="true">
          <svg
            v-if="visibleNoticeType === 'success'"
            class="auth-alert__svg"
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              class="auth-alert__mark auth-alert__check"
              clip-rule="evenodd"
              d="m12 1c-6.075 0-11 4.925-11 11s4.925 11 11 11 11-4.925 11-11-4.925-11-11-11zm4.768 9.14c.0878-.1004.1546-.21726.1966-.34383.0419-.12657.0581-.26026.0477-.39319-.0105-.13293-.0475-.26242-.1087-.38085-.0613-.11844-.1456-.22342-.2481-.30879-.1024-.08536-.2209-.14938-.3484-.18828s-.2616-.0519-.3942-.03823c-.1327.01366-.2612.05372-.3782.1178-.1169.06409-.2198.15091-.3027.25537l-4.3 5.159-2.225-2.226c-.1886-.1822-.4412-.283-.7034-.2807s-.51301.1075-.69842.2929-.29058.4362-.29285.6984c-.00228.2622.09851.5148.28067.7034l3 3c.0983.0982.2159.1748.3454.2251.1295.0502.2681.0729.4069.0665.1387-.0063.2747-.0414.3991-.1032.1244-.0617.2347-.1487.3236-.2554z"
              fill-rule="evenodd"
            />
          </svg>
          <svg
            v-else
            class="auth-alert__svg"
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              class="auth-alert__mark"
              clip-rule="evenodd"
              d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1Zm3.7 7.3a1 1 0 0 0-1.4 0L12 10.6 9.7 8.3a1 1 0 1 0-1.4 1.4l2.3 2.3-2.3 2.3a1 1 0 1 0 1.4 1.4l2.3-2.3 2.3 2.3a1 1 0 0 0 1.4-1.4L13.4 12l2.3-2.3a1 1 0 0 0 0-1.4Z"
              fill-rule="evenodd"
            />
          </svg>
        </div>
        <div class="auth-alert__title">
          {{ visibleNoticeMessage }}
        </div>
      </div>
      <p v-if="authStore.errorMessage" class="login-error" role="alert">
        {{ authStore.errorMessage }}
      </p>
      <div
        class="mt-1.5 grid grid-cols-2 gap-3 max-lg:landscape:mt-1 max-lg:landscape:gap-2"
      >
        <button
          class="login-button is-secondary tap-pop flex cursor-pointer items-center justify-center"
          type="button"
          :disabled="authStore.isLoading"
          @click="goRegister"
        >
          註冊
        </button>
        <button
          class="login-button is-primary tap-pop flex cursor-pointer items-center justify-center"
          type="submit"
          :disabled="authStore.isLoading"
        >
          {{ authStore.isLoading ? "登入中..." : "登入" }}
        </button>
      </div>
    </form>

    <div
      class="mt-4 flex justify-between gap-4 login-links max-lg:landscape:mt-2 max-lg:landscape:gap-3"
    >
      <button
        class="login-link inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0"
        type="button"
        :disabled="authStore.isLoading"
        @click="openGuest"
      >
        訪客遊玩 <span aria-hidden="true">›</span>
      </button>
      <button
        class="login-link inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0"
        type="button"
        :disabled="authStore.isLoading"
        @click="goForgotPassword"
      >
        忘記密碼 <span aria-hidden="true">›</span>
      </button>
    </div>

    <div class="login-divider relative my-5 text-center max-lg:landscape:my-2">
      <span class="relative px-3">其他登入方式</span>
    </div>
    <div class="grid grid-cols-2 gap-3 max-lg:landscape:gap-2">
      <button
        class="social-button tap-pop flex items-center justify-center"
        type="button"
        disabled
      >
        <span
          class="grid h-6 w-6 place-items-center rounded-full bg-[#1877f2] text-sm font-black text-white"
          aria-hidden="true"
          >f</span
        >
        Facebook
      </button>
      <button
        class="social-button tap-pop flex items-center justify-center"
        type="button"
        disabled
      >
        <svg
          class="h-6 w-6"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Google
      </button>
    </div>
  </section>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "../../stores/authStore.js"
import { Eye, EyeOff } from "lucide-vue-next"
import { usePlayerStore } from "@/stores/playerStore.js"
import { usePreGameAudio } from "@/composables/UsePreGameAudio"

const emit = defineEmits(["close", "open-guest", "open-register", "open-forgot-password"])
const authStore = useAuthStore()
const playerStore = usePlayerStore()
const router = useRouter()
const { playPreGameSound, startPreGameBackground } = usePreGameAudio()

const account = ref("")
const password = ref("")
const accountError = ref("")
const passwordError = ref("")
const showPassword = ref(false)
const visibleNoticeMessage = ref("")
const visibleNoticeType = ref("success")
const isNoticeLeaving = ref(false)

const ALERT_VISIBLE_MS = 2000
const ALERT_FADE_MS = 420

let noticeTimer = null
let noticeFadeTimer = null

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const props = defineProps({
  noticeMessage: {
    type: String,
    default: "",
  },
  noticeType: {
    type: String,
    default: "success",
  },
})

function clearNoticeTimers() {
  if (noticeTimer) {
    clearTimeout(noticeTimer)
    noticeTimer = null
  }

  if (noticeFadeTimer) {
    clearTimeout(noticeFadeTimer)
    noticeFadeTimer = null
  }
}

function clearNotice() {
  clearNoticeTimers()
  visibleNoticeMessage.value = ""
  visibleNoticeType.value = "success"
  isNoticeLeaving.value = false
}

function showNotice(message, type = "success") {
  clearNoticeTimers()

  visibleNoticeMessage.value = message
  visibleNoticeType.value = type === "success" ? "success" : "error"
  isNoticeLeaving.value = false

  noticeTimer = setTimeout(() => {
    isNoticeLeaving.value = true

    noticeFadeTimer = setTimeout(() => {
      clearNotice()
    }, ALERT_FADE_MS)
  }, ALERT_VISIBLE_MS)
}

function playLoginClick() {
  playPreGameSound("login-button-click")
}

function closeLogin() {
  playLoginClick()
  emit("close")
}

function togglePasswordVisibility() {
  playLoginClick()
  showPassword.value = !showPassword.value
}

function clearLoginError() {
  accountError.value = ""
  passwordError.value = ""
  clearNotice()
  authStore.clearError()
}

function validateLoginForm() {
  authStore.clearError()

  const trimmedAccount = account.value.trim()

  if (!trimmedAccount) {
    accountError.value = "請輸入Email帳號"
  } else if (!EMAIL_REGEX.test(trimmedAccount)) {
    accountError.value = "Email帳號格式有誤"
  } else {
    accountError.value = ""
  }

  passwordError.value = password.value.trim() ? "" : "請輸入密碼"

  return !accountError.value && !passwordError.value
}

async function handleLogin() {
  if (authStore.isLoading) {
    return
  }

  playLoginClick()

  if (!validateLoginForm()) {
    return
  }

  try {
    await authStore.login({
      account: account.value.trim().toLowerCase(),
      password: password.value,
    })

    if (authStore.currentPlayer) {
      playerStore.setCurrentPlayer(authStore.currentPlayer)
    }

    startPreGameBackground({ fadeIn: true, userInitiated: true })

    emit("close")
    await router.push("/lobby")
  } catch {
    return
  }
}

function goRegister() {
  playLoginClick()
  authStore.clearError()
  emit("open-register")
}

function openGuest() {
  playLoginClick()
  emit("open-guest")
}

function goForgotPassword() {
  playLoginClick()
  authStore.clearError()
  emit("open-forgot-password")
}

watch(
  () => [props.noticeMessage, props.noticeType],
  ([message, type]) => {
    if (!message) {
      clearNotice()
      return
    }

    showNotice(message, type)
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  clearNoticeTimers()
})
</script>

<style scoped>
@reference "tailwindcss";

.login-card {
  @apply max-w-[420px]
    rounded-[var(--radius-lg)]
    border border-[rgba(134,179,224,0.38)]
    bg-[rgba(255,255,255,0.92)]
    [font-family:var(--font-sans)]
    text-[var(--brand-active)]
    shadow-[var(--shadow)]
    animate-[popIn_0.42s_cubic-bezier(0.18,1.35,0.25,1)_both];
}

.login-rule {
  @apply bg-[linear-gradient(90deg,transparent,var(--brand-primary),transparent)];
}

.login-title {
  @apply text-[var(--brand-navy)] text-xl tracking-normal;
}

.login-input {
  @apply min-h-12
    rounded-[var(--radius-md)]
    border-[var(--brand-primary)]
    bg-[rgba(255,255,255,0.58)]
    px-3.5
    text-[var(--brand-active)]
    text-[var(--text-md)]
    font-bold
    transition-[border-color,background-color,box-shadow]
    duration-[180ms]
    disabled:cursor-not-allowed
    disabled:opacity-60;
}

.login-error {
  @apply m-0 text-sm font-bold text-[var(--brand-hover)];
}

.login-input[type="password"]::-ms-reveal,
.login-input[type="password"]::-ms-clear {
  display: none;
  width: 0;
  height: 0;
}

.login-input::-webkit-credentials-auto-fill-button,
.login-input::-webkit-contacts-auto-fill-button {
  visibility: hidden;
  display: none !important;
  pointer-events: none;
}

.login-input::placeholder {
  @apply font-semibold text-[var(--brand-disabled)];
}

.login-input:focus {
  @apply border-[var(--brand-hover)]
    bg-[var(--surface-glass-hover)]
    shadow-[0_0_0_4px_var(--brand-focus)];
}

.password-toggle {
  @apply absolute right-2 top-6 z-10 grid h-8 w-10 -translate-y-1/2 place-items-center border-0 bg-transparent text-[var(--brand-active)] transition-colors disabled:cursor-not-allowed disabled:opacity-60;
}

.password-toggle:hover:not(:disabled) {
  @apply text-[var(--brand-hover)];
}

.password-toggle__icon {
  @apply h-5 w-5;
}

.login-button,
.social-button {
  @apply min-h-[46px]
    rounded-[var(--radius-md)]
    text-[var(--text-sm)]
    font-extrabold
    transition-[border-color,background-color,box-shadow,color]
    duration-[180ms]
    disabled:cursor-not-allowed
    disabled:opacity-60;
}

.login-button {
  @apply border border-[var(--brand-primary)];
}

.login-button.is-secondary {
  @apply bg-[var(--surface-glass)] text-[var(--brand-active)];
}

.login-button.is-primary {
  @apply bg-[var(--brand-active)]
    text-white
    shadow-[0_10px_24px_rgba(70,85,99,0.24)];
}

.login-button:hover:not(:disabled),
.social-button:hover:not(:disabled) {
  @apply border-[var(--brand-hover)]
    bg-[var(--brand-hover)]
    text-white
    shadow-[0_10px_24px_rgba(0,70,244,0.24)];
}

.login-link:focus-visible,
.login-button:focus-visible,
.social-button:focus-visible,
.login-close:focus-visible {
  @apply outline-0 shadow-[0_0_0_4px_var(--brand-focus)];
}

.login-links {
  @apply text-[var(--gray-400)] text-[var(--text-sm)];
}

.login-link {
  @apply text-inherit font-bold disabled:cursor-not-allowed disabled:opacity-60;
}

.login-link:hover:not(:disabled) {
  @apply text-[var(--brand-hover)];
}

.login-divider {
  @apply flex items-center gap-3 text-[var(--gray-400)] text-[var(--text-sm)];
}

.login-divider::before,
.login-divider::after {
  content: "";
  @apply h-px flex-1 bg-[var(--gray-100)];
}

.social-button {
  @apply gap-2
    border border-[var(--gray-100)]
    bg-[rgba(255,255,255,0.72)]
    text-[var(--brand-active)];
}

.auth-alert {
  @apply flex w-full items-center justify-start gap-2 border px-3 py-3 text-sm font-bold shadow-[0_10px_24px_rgba(70,85,99,0.18)];
  background: rgba(255, 255, 255, 0.72);
  animation: auth-alert-in 220ms ease-out both;
}

.auth-alert.is-leaving {
  animation: auth-alert-out 420ms ease-in forwards;
}

.auth-alert.is-success {
  @apply border-[#84D65A] text-[#2B641E];
  background: #EDFBD8;
}

.auth-alert.is-error {
  @apply border-[#EF4444] text-[#991B1B];
  background: #FEE2E2;
  animation: auth-alert-in 220ms ease-out both, auth-alert-shake 260ms ease-out 80ms both;
}

.auth-alert.is-error.is-leaving {
  animation: auth-alert-out 420ms ease-in forwards;
}

.auth-alert__icon {
  @apply grid h-6 w-6 shrink-0 place-items-center;
}

.auth-alert__svg {
  @apply h-6 w-6;
}

.auth-alert__mark {
  fill: currentColor;
}

.auth-alert__check {
  transform-origin: center;
  animation: auth-check-pop 420ms cubic-bezier(0.18, 1.35, 0.25, 1) both;
}

.auth-alert__title {
  @apply min-w-0 flex-1 leading-snug;
}

@keyframes auth-alert-in {
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes auth-alert-out {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  to {
    opacity: 0;
    transform: translateY(-4px) scale(0.98);
  }
}

@keyframes auth-check-pop {
  0% {
    opacity: 0;
    transform: scale(0.55) rotate(-10deg);
  }

  70% {
    opacity: 1;
    transform: scale(1.12) rotate(0deg);
  }

  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes auth-alert-shake {
  0%,
  100% {
    transform: translateX(0);
  }

  35% {
    transform: translateX(-4px);
  }

  70% {
    transform: translateX(4px);
  }
}

@media (max-width: 420px) {
  .login-card {
    @apply px-5 py-6;
  }

  .login-button,
  .social-button {
    @apply min-h-11;
  }
}

@media (max-width: 1024px) and (max-height: 560px) and (orientation: landscape) {
  .login-card {
    max-width: 360px;
    max-height: calc(100dvh - 24px);
    overflow-y: auto;
    overflow-x: hidden;
    padding: 20px 24px;
  }

  .login-title {
    margin-bottom: 16px;
    font-size: 28px;
    line-height: 1.15;
  }

  .login-input {
    min-height: 40px;
    font-size: 14px;
    padding-left: 12px;
    padding-right: 44px;
  }

  .password-toggle {
    top: 20px;
    right: 6px;
    width: 40px;
    height: 32px;
  }

  .password-toggle__icon {
    width: 20px;
    height: 20px;
  }

  .login-button,
  .social-button {
    min-height: 40px;
    font-size: 14px;
  }
}
</style>
