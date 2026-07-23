<template>
  <section
    class="login-card relative w-full max-w-[420px] max-h-[calc(100dvh-32px)] overflow-y-auto overflow-x-hidden px-6 py-7 sm:px-8 sm:py-8 max-[420px]:px-5 max-[420px]:py-6"
    aria-labelledby="reset-password-title"
  >
    <div
      class="absolute inset-x-8 top-0 h-px login-rule"
      aria-hidden="true"
    ></div>
    <button
      type="button"
      class="btn-dark tap-pop absolute right-3 top-3 grid h-9 w-9 place-items-center"
      aria-label="關閉重設密碼視窗"
      @click="emit('close')"
    >
      <span aria-hidden="true">×</span>
    </button>
    <h2
      id="reset-password-title"
      class="mb-7 text-center font-black login-title max-lg:landscape:mb-3"
    >
      重新設定密碼
    </h2>
    <form
      class="grid gap-3.5 max-lg:landscape:gap-2"
      @submit.prevent="handleResetPassword"
    >
      <label class="relative block">
        <span class="sr-only">新密碼</span>
        <input
          v-model="password"
          class="login-input w-full border outline-0 pr-14"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="new-password"
          placeholder="新密碼"
          :disabled="authStore.isLoading"
          @input="clearPasswordError"
        />
        <button
          type="button"
          class="password-toggle"
          :aria-label="showPassword ? '隱藏新密碼' : '顯示新密碼'"
          :disabled="authStore.isLoading"
          @click="showPassword = !showPassword"
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
          v-model="confirmPassword"
          class="login-input w-full border outline-0 pr-14"
          :type="showConfirmPassword ? 'text' : 'password'"
          autocomplete="new-password"
          placeholder="確認密碼"
          :disabled="authStore.isLoading"
          @input="clearConfirmPasswordError"
        />
        <button
          type="button"
          class="password-toggle"
          :aria-label="showConfirmPassword ? '隱藏確認密碼' : '顯示確認密碼'"
          :disabled="authStore.isLoading"
          @click="showConfirmPassword = !showConfirmPassword"
        >
          <EyeOff v-if="showConfirmPassword" class="password-toggle__icon" />
          <Eye v-else class="password-toggle__icon" />
        </button>
        <p v-if="confirmPasswordError" class="login-error" role="alert">
          {{ confirmPasswordError }}
        </p>
      </label>
      <PasswordRuleList :password="password" />
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
          :disabled="authStore.isLoading"
          @click="emit('back-login')"
        >
          返回
        </button>
        <button
          class="login-button is-primary tap-pop flex cursor-pointer items-center justify-center"
          type="submit"
          :disabled="authStore.isLoading"
        >
          {{ authStore.isLoading ? "送出中..." : "送出" }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup>
import { ref, onBeforeUnmount } from "vue"
import { Eye, EyeOff } from "@lucide/vue"
import { useAuthStore } from "@/stores/authStore.js"
import PasswordRuleList from "@/components/login/PasswordRuleList.vue"
import { getPasswordError } from "@/utils/passwordRules.js"

const props = defineProps({
  resetToken: {
    type: String,
    default: ""
  }
})

const emit = defineEmits(["close", "back-login", "reset-success"])
const authStore = useAuthStore()

const password = ref("")
const confirmPassword = ref("")
const passwordError = ref("")
const confirmPasswordError = ref("")
const apiStatusMessage = ref("")
const apiStatusType = ref("")
const isAlertLeaving = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const ALERT_VISIBLE_MS = 2000
const ALERT_FADE_MS = 420

let alertTimer = null
let fadeTimer = null

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

function clearPasswordError() {
  passwordError.value = ""
  confirmPasswordError.value = ""
  clearApiStatus()
  authStore.clearError()

  if (confirmPassword.value) {
    confirmPassword.value = ""
  }
}

function clearConfirmPasswordError() {
  confirmPasswordError.value = ""
  clearApiStatus()
  authStore.clearError()
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

function validateResetPasswordForm() {
  authStore.clearError()

  passwordError.value = getPasswordError(password.value)

  if (!confirmPassword.value) {
    confirmPasswordError.value = "請再次輸入密碼"
  } else if (password.value !== confirmPassword.value) {
    confirmPasswordError.value = "密碼不一致，請重新輸入"
  } else {
    confirmPasswordError.value = ""
  }

  if (!props.resetToken) {
    showApiStatus("error", "重設密碼連結已失效，請重新申請")
    return false
  }

  return !passwordError.value && !confirmPasswordError.value
}

async function handleResetPassword() {
  if (authStore.isLoading) {
    return
  }

  if (!validateResetPasswordForm()) {
    return
  }

  try {
    const data = await authStore.resetPassword({
      token: props.resetToken,
      password: password.value
    })

    showApiStatus(
      "success",
      data?.message || "密碼已重設完成，請重新登入",
      () => {
        emit("reset-success")
      }
    )
  } catch {
    showApiStatus("error", authStore.errorMessage || "密碼重設失敗，請稍後再試")
  }
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
  color: var(--brand-navy);
  font-size: clamp(24px, 2.5vw, 32px);
  letter-spacing: 0;
  line-height: 1.15;
}

.login-input {
  height: 54px;
  border-color: var(--brand-primary);
  background: rgba(255, 255, 255, 0.62);
  padding: 0 16px;
  color: var(--brand-active);
  font-size: var(--text-md);
  font-weight: 700;
}

.login-input::placeholder {
  color: var(--brand-disabled);
}

.login-input:focus {
  border-color: var(--brand-hover);
  box-shadow: 0 0 0 5px var(--brand-focus);
}

.login-error {
  margin-top: 6px;
  color: var(--feedback-error);
  font-size: var(--text-sm);
  font-weight: 700;
}

.auth-alert {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  border: 1px solid;
  background: rgba(255, 255, 255, 0.72);
  padding: 12px;
  font-size: var(--text-sm);
  font-weight: 700;
  box-shadow: 0 10px 24px rgba(70, 85, 99, 0.18);
  animation: auth-alert-in 220ms ease-out both;
}

.auth-alert.is-leaving {
  animation: auth-alert-out 420ms ease-in forwards;
}

.auth-alert.is-success {
  border-color: #84D65A;
  background: #EDFBD8;
  color: #2B641E;
}

.auth-alert.is-error {
  border-color: #EF4444;
  background: #FEE2E2;
  color: var(--feedback-error);
  animation: auth-alert-in 220ms ease-out both, auth-alert-shake 260ms ease-out 80ms both;
}

.auth-alert.is-error.is-leaving {
  animation: auth-alert-out 420ms ease-in forwards;
}

.auth-alert__icon {
  display: grid;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  place-items: center;
}

.auth-alert__svg {
  width: 24px;
  height: 24px;
}

.auth-alert__mark {
  fill: currentColor;
}

.auth-alert__check {
  transform-origin: center;
  animation: auth-check-pop 420ms cubic-bezier(0.18, 1.35, 0.25, 1) both;
}

.auth-alert__title {
  min-width: 0;
  flex: 1;
  line-height: 1.35;
}

.password-toggle {
  position: absolute;
  right: 8px;
  top: 11px;
  z-index: 10;
  display: grid;
  width: 40px;
  height: 32px;
  place-items: center;
  border: 0;
  background: transparent;
  color: var(--brand-active);
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

.password-toggle:hover:not(:disabled) {
  color: var(--brand-hover);
}

.password-toggle__icon {
  width: 20px;
  height: 20px;
}

.login-button {
  min-height: 52px;
  border: 1px solid var(--brand-primary);
  font-size: var(--text-md);
  font-weight: 900;
  transition:
    transform 0.18s ease,
    background 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.login-button.is-secondary {
  color: var(--brand-active);
  background: rgba(255, 255, 255, 0.48);
}

.login-button.is-primary {
  color: white;
  background: var(--brand-active);
}

.login-button:hover:not(:disabled) {
  border-color: var(--brand-hover);
  background: var(--brand-hover);
  color: white;
  transform: translateY(-1px);
}

.login-button:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.login-button:focus-visible,
.password-toggle:focus-visible,
.btn-dark:focus-visible {
  outline: none;
  box-shadow: 0 0 0 5px var(--brand-focus);
}

@media (max-width: 1024px) and (max-height: 560px) and (orientation: landscape) {
  .login-card {
    max-width: 360px;
    max-height: calc(100dvh - 24px);
    padding: 20px 24px;
  }

  .login-title {
    font-size: 22px;
  }

  .login-input {
    height: 40px;
    font-size: 14px;
  }

  .password-toggle {
    top: 4px;
    right: 6px;
    width: 40px;
  }

  .password-toggle__icon {
    width: 18px;
    height: 18px;
  }

  .login-button {
    min-height: 40px;
    font-size: 14px;
  }
}
</style>
