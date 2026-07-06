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
        <PasswordRuleList :password="password" />
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
      <p v-if="successMessage" class="login-success" role="status">
        {{ successMessage }}
      </p>
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
import { ref } from "vue"
import { Eye, EyeOff } from "lucide-vue-next"
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
const successMessage = ref("")
const showPassword = ref(false)
const showConfirmPassword = ref(false)

function clearPasswordError() {
  passwordError.value = ""
  authStore.clearError()

  if (confirmPasswordError.value === "密碼不一致，請重新輸入") {
    confirmPassword.value = ""
    confirmPasswordError.value = ""
  }
}

function clearConfirmPasswordError() {
  confirmPasswordError.value = ""
  authStore.clearError()
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
    authStore.errorMessage = "重設密碼連結已失效，請重新申請"
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

    successMessage.value = data?.message || "密碼已重設完成，請重新登入"

    window.setTimeout(() => {
      emit("reset-success")
    }, 1000)
  } catch {
    return
  }
}
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
  font-size: clamp(32px, 5vw, 48px);
  letter-spacing: 0;
  line-height: 1.05;
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
  color: #b3261e;
  font-size: var(--text-sm);
  font-weight: 700;
}

.login-success {
  color: #2f8f46;
  font-size: var(--text-sm);
  font-weight: 800;
  line-height: 1.5;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 11px;
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  color: var(--brand-active);
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
    font-size: 28px;
  }

  .login-input {
    height: 40px;
    font-size: 14px;
  }

  .password-toggle {
    top: 4px;
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