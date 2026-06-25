<template>
    <section
        class="login-card relative w-full overflow-hidden px-6 py-7 sm:px-8 sm:py-8 max-lg:landscape:max-w-[92vw] max-lg:landscape:px-4 max-lg:landscape:py-3 lg:max-w-[420px]"
        aria-labelledby="register-title"
    >
        <div
          class="absolute inset-x-8 top-0 h-px login-rule"
          aria-hidden="true"
        ></div>
        <button
          type="button"
          class="btn-dark tap-pop absolute right-3 top-3 grid h-9 w-9 place-items-center"
          aria-label="返回登入頁"
          @click="goLogin"
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
                />
            </label>
            <label class="relative block">
                <span class="sr-only">帳號</span>
                <input
                v-model.trim="form.account"
                class="login-input w-full border outline-0"
                type="text"
                autocomplete="username"
                placeholder="帳號"
                :disabled="isSubmitting"
                />
            </label>
            <label class="relative block">
                <span class="sr-only">密碼</span>
                <input
                v-model="form.password"
                class="login-input w-full border outline-0"
                type="password"
                autocomplete="new-password"
                placeholder="密碼"
                :disabled="isSubmitting"
                />
            </label>
            <label class="relative block">
                <span class="sr-only">確認密碼</span>
                <input
                v-model="form.confirmPassword"
                class="login-input w-full border outline-0"
                type="password"
                autocomplete="new-password"
                placeholder="確認密碼"
                :disabled="isSubmitting"
                />
            </label>
            <p v-if="errorMessage" class="login-error" role="alert">
                {{ errorMessage }}
            </p>
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
import { reactive, ref } from "vue"
import { useRouter } from "vue-router"
// import { useAuthStore } from "@/stores/authStore.js"

const router = useRouter()
// const authStore = useAuthStore()

const form = reactive({
  username: "",
  account: "",
  password: "",
  confirmPassword: "",
});

const errorMessage = ref("")
const isSubmitting = ref(false)

function validateRegisterForm() {
  if (!form.username) {
    errorMessage.value = "請輸入用戶名稱"
    return false
  }

  if (!form.account) {
    errorMessage.value = "請輸入帳號"
    return false
  }

  if (!form.password) {
    errorMessage.value = "請輸入密碼"
    return false
  }

  if (!form.confirmPassword) {
    errorMessage.value = "請輸入確認密碼"
    return false
  }

  if (form.password !== form.confirmPassword) {
    errorMessage.value = "密碼不一致，請重新輸入"
    return false
  }

  errorMessage.value = ""
  return true
}

async function handleRegister() {
  if (!validateRegisterForm()) {
    return
  }

  isSubmitting.value = true
//   authStore.clearError()

  try {
    await authStore.register({
      username: form.username,
      account: form.account,
      password: form.password
    })

    router.push("/login")
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "註冊失敗，請稍後再試"
  } finally {
    isSubmitting.value = false
  }
}

function goLogin() {
  router.push("/login")
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

@media (max-width: 420px) {
  .login-card {
    @apply px-5 py-6;
  }

  .login-button {
    @apply min-h-11;
  }
}
</style>