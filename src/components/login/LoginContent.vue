<template>
  <section
    class="login-card relative w-full overflow-hidden px-6 py-7 sm:px-8 sm:py-8 max-lg:landscape:max-w-[92vw] max-lg:landscape:px-4 max-lg:landscape:py-3 lg:max-w-[420px]"
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
      @click="emit('close')"
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
        <span class="sr-only">帳號</span>
        <input
          class="login-input w-full border outline-0 pr-[78px]"
          type="text" v-model="account"
          autocomplete="username"
          placeholder="帳號"
        />
        <p v-if="accountError" class="login-error">
          {{ accountError }}
        </p>
        <span
          class="absolute right-2 top-1/2 flex -translate-y-1/2 gap-1"
          aria-hidden="true"
        >
          <!-- <button class="login-field-icon grid h-8 w-8 place-items-center" type="button" tabindex="-1">×</button> -->
          <!-- <button class="login-field-icon grid h-8 w-8 place-items-center" type="button" tabindex="-1">⌄</button> -->
        </span>
      </label>

      <label class="relative block">
        <span class="sr-only">密碼</span>
        <input
          class="login-input w-full border outline-0"
          type="password" v-model="password"
          autocomplete="current-password"
          placeholder="密碼"
        />
        <p v-if="passwordError" class="login-error">
          {{ passwordError }}
        </p>
      </label>
      <p v-if="authStore.errorMessage" class="login-error">
        {{ authStore.errorMessage }}
      </p>
      <div
        class="mt-1.5 grid grid-cols-2 gap-3 max-lg:landscape:mt-1 max-lg:landscape:gap-2"
      >
        <button
          class="login-button is-secondary tap-pop flex cursor-pointer items-center justify-center"
          type="button" @click="goRegister"
        >
          註冊
        </button>
        <button
          class="login-button is-primary tap-pop flex cursor-pointer items-center justify-center"
          type="submit"
        >
          登入
        </button>
      </div>
    </form>

    <div
      class="mt-4 flex justify-between gap-4 login-links max-lg:landscape:mt-2 max-lg:landscape:gap-3"
    >
      <button
        class="login-link inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0"
        type="button"
      >
        訪客登入 <span aria-hidden="true">›</span>
      </button>
      <button
        class="login-link inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0"
        type="button"
      >
        取回密碼 <span aria-hidden="true">›</span>
      </button>
    </div>

    <div class="login-divider relative my-5 text-center max-lg:landscape:my-2">
      <span class="relative px-3">其他登入方式</span>
    </div>

    <div class="grid grid-cols-2 gap-3 max-lg:landscape:gap-2">
      <button
        class="social-button tap-pop flex cursor-pointer items-center justify-center"
        type="button"
      >
        <span
          class="grid h-6 w-6 place-items-center rounded-full bg-[#1877f2] text-sm font-black text-white"
          aria-hidden="true"
          >f</span
        >
        Facebook
      </button>
      <button
        class="social-button tap-pop flex cursor-pointer items-center justify-center"
        type="button"
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
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/authStore.js";

const emit = defineEmits(["close"]);
const authStore = useAuthStore();
const router = useRouter();

const account = ref("");
const password = ref("");
const accountError = ref("");
const passwordError = ref("");
function validateLoginForm(){
  accountError.value = account.value.trim() ? "" : "請輸入帳號";
  passwordError.value = password.value.trim() ? "" : "請輸入密碼";
  return !accountError.value && !passwordError.value
}
async function handleLogin(){
  const isValid = validateLoginForm()
  if(!isValid){
    return;
  }
  try {
    await authStore.login({
      account: account.value.trim(),
      password: password.value,
    });

    emit("close");
    await router.push("/lobby");
  } catch (error) {
    console.error(error);
  }
}

function goRegister(){
  router.push("/register")
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
    duration-[180ms];
}

.login-input::placeholder {
  @apply font-semibold text-[var(--brand-disabled)];
}

.login-input:focus {
  @apply border-[var(--brand-hover)]
    bg-[var(--surface-glass-hover)]
    shadow-[0_0_0_4px_var(--brand-focus)];
}

.login-field-icon {
  @apply border-0
    rounded-[var(--radius-md)]
    bg-transparent
    text-[var(--brand-disabled)]
    text-[var(--text-md)]
    font-extrabold;
}

.login-button,
.social-button {
  @apply min-h-[46px]
    rounded-[var(--radius-md)]
    text-[var(--text-sm)]
    font-extrabold
    transition-[border-color,background-color,box-shadow,color]
    duration-[180ms];
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

.login-button:hover,
.social-button:hover {
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
  @apply text-inherit font-bold;
}

.login-link:hover {
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

@media (max-width: 420px) {
  .login-card {
    @apply px-5 py-6;
  }

  .login-button,
  .social-button {
    @apply min-h-11;
  }
}
</style>
