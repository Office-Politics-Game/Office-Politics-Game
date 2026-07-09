<template>
  <section
    class="login-card relative w-full max-w-[420px] max-h-[calc(100dvh-32px)] overflow-y-auto overflow-x-hidden px-6 py-7 sm:px-8 sm:py-8 max-[420px]:px-5 max-[420px]:py-6"
    aria-labelledby="register-title"
  >
    <div
      class="absolute inset-x-8 top-0 h-px login-rule"
      aria-hidden="true"
    ></div>
    <button
      type="button"
      class="btn-dark tap-pop absolute right-3 top-3 grid h-9 w-9 place-items-center"
      aria-label="關閉註冊視窗"
      :disabled="isSubmitting"
      @click="closeRegister"
    >
      <span aria-hidden="true">×</span>
    </button>
    <h2
      id="register-title"
      class="mb-7 text-center font-black login-title max-lg:landscape:mb-3"
    >
      註冊
    </h2>
    <form
      class="grid gap-3.5 max-lg:landscape:gap-2"
      @submit.prevent="handleRegister"
    >
      <label class="relative block">
        <span class="sr-only">用戶名稱</span>
        <input
          v-model.trim="form.username"
          class="login-input w-full border outline-0"
          type="text"
          autocomplete="name"
          placeholder="用戶名稱"
          :disabled="isSubmitting"
          @input="usernameError = ''"
        />
        <p v-if="usernameError" class="login-error" role="alert">
          {{ usernameError }}
        </p>
      </label>
      <label class="relative block">
        <span class="sr-only">Email帳號</span>
        <input
          v-model.trim="form.account"
          class="login-input w-full border outline-0"
          type="email"
          autocomplete="email"
          inputmode="email"
          placeholder="Email帳號"
          :disabled="isSubmitting"
          @input="accountError = ''"
        />
        <p v-if="accountError" class="login-error" role="alert">
          {{ accountError }}
        </p>
      </label>
      <label class="relative block">
        <span class="sr-only">密碼</span>
        <input
          v-model="form.password"
          class="login-input w-full border outline-0 pr-14"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="new-password"
          placeholder="密碼"
          :disabled="isSubmitting"
          @input="handlePasswordInput"
        />
        <button
          type="button"
          class="password-toggle"
          :aria-label="showPassword ? '隱藏密碼' : '顯示密碼'"
          :disabled="isSubmitting"
          @click="togglePasswordVisibility"
        >
          <EyeOff v-if="showPassword" class="password-toggle__icon" />
          <Eye v-else class="password-toggle__icon" />
        </button>
        <p v-if="passwordError" class="login-error" role="alert">
          {{ passwordError }}
        </p>
      </label>
      <label class="relative block">
        <span class="sr-only">確認密碼</span>
        <input
          v-model="form.confirmPassword"
          class="login-input w-full border outline-0 pr-14"
          :type="showConfirmPassword ? 'text' : 'password'"
          autocomplete="new-password"
          placeholder="確認密碼"
          :disabled="isSubmitting"
          @input="confirmPasswordError = ''"
        />
        <button
          type="button"
          class="password-toggle"
          :aria-label="showConfirmPassword ? '隱藏確認密碼' : '顯示確認密碼'"
          :disabled="isSubmitting"
          @click="toggleConfirmPasswordVisibility"
        >
          <EyeOff v-if="showConfirmPassword" class="password-toggle__icon" />
          <Eye v-else class="password-toggle__icon" />
        </button>
        <p v-if="confirmPasswordError" class="login-error" role="alert">
          {{ confirmPasswordError }}
        </p>
      </label>
      <div
        v-if="apiStatusMessage"
        class="auth-alert"
        :class="[
          apiStatusType === 'success' ? 'is-success' : 'is-error',
          isAlertLeaving ? 'is-leaving' : '',
        ]"
        :role="apiStatusType === 'success' ? 'status' : 'alert'"
      >
        <div class="auth-alert__icon" aria-hidden="true">
          <svg
            v-if="apiStatusType === 'success'"
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
          {{ apiStatusMessage }}
        </div>
      </div>
      <div
        class="mt-1.5 grid grid-cols-2 gap-3 max-lg:landscape:mt-1 max-lg:landscape:gap-2"
      >
        <button
          class="login-button is-secondary tap-pop flex cursor-pointer items-center justify-center"
          type="button"
          :disabled="isSubmitting"
          @click="goLogin"
        >
          返回登入
        </button>
        <button
          class="login-button is-primary tap-pop flex cursor-pointer items-center justify-center"
          type="submit"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? "註冊中..." : "註冊" }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup>
import { reactive, ref, onBeforeUnmount } from "vue"
import { useAuthStore } from "@/stores/authStore.js"
import { Eye, EyeOff } from "lucide-vue-next"
import { usePreGameAudio } from "@/composables/UsePreGameAudio"

const authStore = useAuthStore()
const emit = defineEmits(["close", "back-login", "register-success"])
const { playPreGameSound } = usePreGameAudio()

const form = reactive({
  username: "",
  account: "",
  password: "",
  confirmPassword: "",
  avatarId: 1
})

const usernameError = ref("")
const accountError = ref("")
const passwordError = ref("")
const confirmPasswordError = ref("")
const apiStatusMessage = ref("")
const apiStatusType = ref("")
const isAlertLeaving = ref(false)
const isSubmitting = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const ALERT_VISIBLE_MS = 1200
const ALERT_FADE_MS = 420

let alertTimer = null
let fadeTimer = null

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function playRegisterClick() {
  playPreGameSound("login-button-click")
}

function closeRegister() {
  playRegisterClick()
  emit("close")
}

function togglePasswordVisibility() {
  playRegisterClick()
  showPassword.value = !showPassword.value
}

function toggleConfirmPasswordVisibility() {
  playRegisterClick()
  showConfirmPassword.value = !showConfirmPassword.value
}

function clearRegisterErrors() {
  usernameError.value = ""
  accountError.value = ""
  passwordError.value = ""
  confirmPasswordError.value = ""
}

function validateRegisterForm() {
  clearApiStatus()

  const trimmedUsername = form.username.trim()
  const trimmedAccount = form.account.trim()

  usernameError.value = trimmedUsername ? "" : "請輸入用戶名稱"

  if (!trimmedAccount) {
    accountError.value = "請輸入Email帳號"
  } else if (!EMAIL_REGEX.test(trimmedAccount)) {
    accountError.value = "Email帳號格式有誤"
  } else {
    accountError.value = ""
  }

  passwordError.value = form.password.trim() ? "" : "請輸入密碼"

  if (!form.confirmPassword.trim()) {
    confirmPasswordError.value = "請再次輸入密碼"
  } else if (form.password !== form.confirmPassword) {
    confirmPasswordError.value = "密碼不一致，請重新輸入"
  } else {
    confirmPasswordError.value = ""
  }

  return (
    !usernameError.value &&
    !accountError.value &&
    !passwordError.value &&
    !confirmPasswordError.value
  )
}

function handlePasswordInput() {
  passwordError.value = ""

  if (confirmPasswordError.value === "密碼不一致，請重新輸入") {
    form.confirmPassword = ""
    confirmPasswordError.value = ""
  }
}

async function handleRegister() {
  if (isSubmitting.value) {
    return
  }

  playRegisterClick()

  if (!validateRegisterForm()) {
    return
  }

  isSubmitting.value = true
  authStore.clearError()

  try {
    await authStore.register({
      username: form.username.trim(),
      account: form.account.trim().toLowerCase(),
      password: form.password,
      avatarId: form.avatarId ?? 1
    })

    clearRegisterErrors()
    showApiStatus("success", "註冊成功，正在返回登入頁面", () => {
      emit("register-success")
    })
  } catch (error) {
    showApiStatus(
      "error", error instanceof Error ? error.message : "註冊失敗，請稍後再試"
    )

    isSubmitting.value = false
  }
}

function clearAlertTimers() {
  if (alertTimer) {
    clearTimeout(alertTimer)
    alertTimer = null
  }

  if (fadeTimer) {
    clearTimeout(fadeTimer)
    fadeTimer = null
  }
}

function clearApiStatus() {
  clearAlertTimers()
  apiStatusType.value = ""
  apiStatusMessage.value = ""
  isAlertLeaving.value = false
}

function showApiStatus(type, message, onFinished) {
  const statusType = type === "success" ? "success" : "error"

  clearAlertTimers()

  apiStatusType.value = statusType
  apiStatusMessage.value = message
  isAlertLeaving.value = false

  alertTimer = setTimeout(() => {
    isAlertLeaving.value = true

    fadeTimer = setTimeout(() => {
      clearApiStatus()

      if (onFinished) {
        onFinished()
      }
    }, ALERT_FADE_MS)
  }, ALERT_VISIBLE_MS)
}

function goLogin() {
  playRegisterClick()
  clearApiStatus()
  emit("back-login")
}

onBeforeUnmount(() => {
  clearAlertTimers()
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

.login-input::placeholder {
  @apply font-semibold text-[var(--brand-disabled)];
}

.login-input:focus {
  @apply border-[var(--brand-hover)]
    bg-[var(--surface-glass-hover)]
    shadow-[0_0_0_4px_var(--brand-focus)];
}

.login-error {
  @apply m-0 text-sm font-bold text-[var(--brand-hover)];
}

.password-toggle {
  @apply absolute right-3 top-6 grid h-8 w-8 -translate-y-1/2 place-items-center border-0 bg-transparent text-[var(--brand-active)] transition-colors disabled:cursor-not-allowed disabled:opacity-60;
}

.password-toggle:hover:not(:disabled) {
  @apply text-[var(--brand-hover)];
}

.password-toggle__icon {
  @apply h-5 w-5;
}

.login-button {
  @apply min-h-[46px]
    rounded-[var(--radius-md)]
    border border-[var(--brand-primary)]
    text-[var(--text-sm)]
    font-extrabold
    transition-[border-color,background-color,box-shadow,color]
    duration-[180ms]
    disabled:cursor-not-allowed
    disabled:opacity-60;
}

.login-button.is-secondary {
  @apply bg-[var(--surface-glass)] text-[var(--brand-active)];
}

.login-button.is-primary {
  @apply bg-[var(--brand-active)]
    text-white
    shadow-[0_10px_24px_rgba(70,85,99,0.24)];
}

.login-button:hover:not(:disabled) {
  @apply border-[var(--brand-hover)]
    bg-[var(--brand-hover)]
    text-white
    shadow-[0_10px_24px_rgba(0,70,244,0.24)];
}

.login-button:focus-visible {
  @apply outline-0 shadow-[0_0_0_4px_var(--brand-focus)];
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

  .login-button {
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
    right: 8px;
    width: 32px;
    height: 32px;
  }

  .password-toggle__icon {
    width: 20px;
    height: 20px;
  }

  .login-button {
    min-height: 40px;
    font-size: 14px;
  }
}
</style>
