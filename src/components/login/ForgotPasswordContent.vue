<template>
  <section
    class="login-card relative w-full max-w-[420px] max-h-[calc(100dvh-32px)] overflow-y-auto overflow-x-hidden px-6 py-7 sm:px-8 sm:py-8 max-[420px]:px-5 max-[420px]:py-6"
    aria-labelledby="forgot-password-title"
  >
    <div
      class="absolute inset-x-8 top-0 h-px login-rule"
      aria-hidden="true"
    ></div>
    <button
      type="button"
      class="btn-dark tap-pop absolute right-3 top-3 grid h-9 w-9 place-items-center"
      aria-label="關閉重新設定密碼視窗"
      @click="emit('close')"
    >
      <span aria-hidden="true">×</span>
    </button>
    <h2
      id="forgot-password-title"
      class="mb-7 text-center font-black login-title max-lg:landscape:mb-3"
    >
      重新設定密碼
    </h2>
    <form
      class="grid gap-3.5 max-lg:landscape:gap-2"
      @submit.prevent="handleForgotPassword"
    >
      <label class="relative block">
        <span class="sr-only">Email帳號</span>
        <input
          v-model.trim="account"
          class="login-input w-full border outline-0"
          type="email"
          autocomplete="email"
          inputmode="email"
          placeholder="請輸入Email帳號"
          :disabled="authStore.isLoading"
          @input="clearForgotPasswordMessage"
        />
        <p v-if="accountError" class="login-error" role="alert">
          {{ accountError }}
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
          {{ authStore.isLoading ? "寄送中..." : "下一步" }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup>
import { ref } from "vue"
import { useAuthStore } from "@/stores/authStore.js"

const emit = defineEmits(["close", "back-login"])
const authStore = useAuthStore()

const account = ref("")
const accountError = ref("")
const successMessage = ref("")

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function clearForgotPasswordMessage() {
  accountError.value = ""
  successMessage.value = ""
  authStore.clearError()
}

function validateForgotPasswordForm() {
  const trimmedAccount = account.value.trim()

  if (!trimmedAccount) {
    accountError.value = "請輸入Email帳號"
  } else if (!EMAIL_REGEX.test(trimmedAccount)) {
    accountError.value = "Email帳號格式有誤"
  } else {
    accountError.value = ""
  }

  return !accountError.value
}

async function handleForgotPassword() {
  if (authStore.isLoading) {
    return
  }

  if (!validateForgotPasswordForm()) {
    return
  }

  try {
    const data = await authStore.forgotPassword({
      account: account.value.trim().toLowerCase()
    })

    successMessage.value = data?.message || "已寄出重設密碼信，請到信箱查收"
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

  .login-button {
    min-height: 40px;
    font-size: 14px;
  }
}
</style>