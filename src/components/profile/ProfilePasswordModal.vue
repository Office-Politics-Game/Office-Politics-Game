<template>
  <div class="profile-modal" role="dialog" aria-modal="true">
    <section class="profile-modal__panel">
      <button
        type="button"
        class="profile-modal__close"
        aria-label="關閉修改密碼視窗"
        :disabled="isSubmitting"
        @click="$emit('close')"
      >
        ×
      </button>
      <h2 class="profile-modal__title">修改密碼</h2>
      <form class="profile-modal__form" @submit.prevent="submitPasswordChange">
        <label class="profile-modal__field">
          <span class="profile-modal__label">目前密碼</span>
          <span class="profile-modal__input-wrap">
            <input
              v-model="currentPassword"
              class="profile-modal__input"
              :type="showCurrentPassword ? 'text' : 'password'"
              autocomplete="current-password"
              :disabled="isSubmitting"
              @input="currentPasswordError = ''; clearApiMessage()"
            />
            <button
              type="button"
              class="profile-modal__toggle"
              :aria-label="showCurrentPassword ? '隱藏目前密碼' : '顯示目前密碼'"
              :disabled="isSubmitting"
              @click="showCurrentPassword = !showCurrentPassword"
            >
              <EyeOff v-if="showCurrentPassword" class="profile-modal__toggle-icon" />
              <Eye v-else class="profile-modal__toggle-icon" />
            </button>
          </span>
          <span v-if="currentPasswordError" class="profile-modal__error">
            {{ currentPasswordError }}
          </span>
        </label>
        <label class="profile-modal__field">
          <span class="profile-modal__label">新密碼</span>
          <span class="profile-modal__input-wrap">
            <input
              v-model="password"
              class="profile-modal__input"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              :disabled="isSubmitting"
              @input="handlePasswordInput"
            />
            <button
              type="button"
              class="profile-modal__toggle"
              :aria-label="showPassword ? '隱藏新密碼' : '顯示新密碼'"
              :disabled="isSubmitting"
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="showPassword" class="profile-modal__toggle-icon" />
              <Eye v-else class="profile-modal__toggle-icon" />
            </button>
          </span>
          <span v-if="passwordError" class="profile-modal__error">
            {{ passwordError }}
          </span>
        </label>
        <label class="profile-modal__field">
          <span class="profile-modal__label">確認新密碼</span>
          <span class="profile-modal__input-wrap">
            <input
              v-model="confirmPassword"
              class="profile-modal__input"
              :type="showConfirmPassword ? 'text' : 'password'"
              autocomplete="new-password"
              :disabled="isSubmitting"
              @input="confirmPasswordError = ''; clearApiMessage()"
            />
            <button
              type="button"
              class="profile-modal__toggle"
              :aria-label="showConfirmPassword ? '隱藏確認密碼' : '顯示確認密碼'"
              :disabled="isSubmitting"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              <EyeOff v-if="showConfirmPassword" class="profile-modal__toggle-icon" />
              <Eye v-else class="profile-modal__toggle-icon" />
            </button>
          </span>
          <span v-if="confirmPasswordError" class="profile-modal__error">
            {{ confirmPasswordError }}
          </span>
        </label>
        <PasswordRuleList :password="password" />
        <p
          v-if="apiMessage"
          class="profile-modal__status"
          :class="`profile-modal__status--${apiStatus}`"
          role="status"
        >
          {{ apiMessage }}
        </p>
        <div class="profile-modal__actions">
          <button
            type="button"
            class="profile-modal__button"
            :disabled="isSubmitting"
            @click="$emit('close')"
          >
            取消
          </button>
          <button
            type="submit"
            class="profile-modal__button profile-modal__button--primary"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? "更新中..." : "更新密碼" }}
          </button>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { Eye, EyeOff } from "lucide-vue-next";
import PasswordRuleList from "@/components/login/PasswordRuleList.vue";
import { getPasswordError } from "@/utils/passwordRules.js";
import { useAuthStore } from "@/stores/authStore.js";

const emit = defineEmits(["close", "changed"]);
const authStore = useAuthStore();

const currentPassword = ref("");
const password = ref("");
const confirmPassword = ref("");
const currentPasswordError = ref("");
const passwordError = ref("");
const confirmPasswordError = ref("");
const apiMessage = ref("");
const apiStatus = ref("");
const showCurrentPassword = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const isSubmitting = computed(() => authStore.isLoading);

function clearApiMessage() {
  apiMessage.value = "";
  apiStatus.value = "";
}

function handlePasswordInput() {
  passwordError.value = "";
  confirmPasswordError.value = "";
  clearApiMessage();

  if (!password.value) {
    confirmPassword.value = "";
    showConfirmPassword.value = false;
  }
}

function validateForm() {
  currentPasswordError.value = currentPassword.value
    ? ""
    : "請輸入目前密碼";

  passwordError.value = getPasswordError(password.value);

  if (!confirmPassword.value) {
    confirmPasswordError.value = "請再次輸入新密碼";
  } else if (password.value !== confirmPassword.value) {
    confirmPasswordError.value = "新密碼與確認密碼不一致";
  } else {
    confirmPasswordError.value = "";
  }

  if (
    currentPassword.value &&
    password.value &&
    currentPassword.value === password.value
  ) {
    passwordError.value = "新密碼不能與目前密碼相同";
  }

  return (
    !currentPasswordError.value &&
    !passwordError.value &&
    !confirmPasswordError.value
  );
}

function applyApiFieldError(message) {
  if (message === "目前密碼錯誤") {
    currentPasswordError.value = message;
    return true;
  }

  if (message === "新密碼不可與目前密碼相同") {
    passwordError.value = message;
    return true;
  }

  if (message === "新密碼與確認密碼不一致") {
    confirmPasswordError.value = message;
    return true;
  }

  return false;
}

async function submitPasswordChange() {
  clearApiMessage();

  if (!validateForm()) {
    return;
  }

  try {
    const data = await authStore.changePassword({
      currentPassword: currentPassword.value,
      password: password.value,
      confirmPassword: confirmPassword.value,
    });

    apiStatus.value = "success";
    apiMessage.value = data?.message || "密碼已更新，請重新登入";

    window.setTimeout(() => {
      emit("changed");
    }, 900);
  } catch (error) {
    const message = error?.data?.message || error?.message || "修改密碼失敗";

    if (applyApiFieldError(message)) {
      return;
    }

    apiStatus.value = "error";
    apiMessage.value = message;
  }
}
</script>

<style scoped>
.profile-modal {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  background: rgba(0, 19, 50, 0.56);
}

.profile-modal__panel {
  position: relative;
  width: min(480px, calc(100vw - 32px));
  border: 1px solid var(--brand-primary);
  background: rgba(255, 255, 255, 0.94);
  padding: 32px 28px 28px;
}

.profile-modal__close,
.profile-modal__button {
  cursor: pointer;
}

.profile-modal__close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border: 0;
  background: var(--brand-active);
  color: white;
  font-size: 24px;
  font-weight: 700;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}

.profile-modal__close:hover {
  background: var(--brand-hover);
  color: white;
  transform: translateY(-1px);
}

.profile-modal__close:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px var(--brand-focus);
}

.profile-modal__title {
  margin: 0 0 20px;
  color: var(--brand-navy);
  font-size: var(--text-lg);
  font-weight: 900;
  text-align: center;
}

.profile-modal__message {
  margin: 0;
  color: var(--gray-500);
  font-size: var(--text-sm);
  font-weight: 800;
  line-height: 1.7;
  text-align: center;
}

.profile-modal__form {
  display: grid;
  gap: 16px;
}

.profile-modal__field {
  display: grid;
  gap: 8px;
}

.profile-modal__label {
  color: var(--brand-active);
  font-size: var(--text-sm);
  font-weight: 900;
}

.profile-modal__input-wrap {
  position: relative;
  display: block;
}

.profile-modal__input {
  width: 100%;
  min-height: 44px;
  border: 1px solid var(--brand-primary);
  background: white;
  padding: 0 48px 0 12px;
  color: var(--brand-active);
  font-size: var(--text-md);
  font-weight: 700;
}

.profile-modal__input:focus {
  outline: none;
  box-shadow: 0 0 0 4px var(--brand-focus);
}

.profile-modal__toggle {
  position: absolute;
  top: 50%;
  right: 8px;
  width: 32px;
  height: 32px;
  border: 0;
  background: transparent;
  color: var(--brand-active);
  transform: translateY(-50%);
}

.profile-modal__toggle-icon {
  width: 20px;
  height: 20px;
}

.profile-modal__error {
  color: #b91c1c;
  font-size: var(--text-xs);
  font-weight: 800;
}

.profile-modal__status {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: 900;
  text-align: center;
}

.profile-modal__status--success {
  color: #047857;
}

.profile-modal__status--error {
  color: #b91c1c;
}

.profile-modal__button:disabled,
.profile-modal__toggle:disabled,
.profile-modal__input:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.profile-modal__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 24px;
}

.profile-modal__actions--single {
  grid-template-columns: 1fr;
}

.profile-modal__button {
  min-height: 48px;
  border: 1px solid var(--brand-primary);
  font-size: var(--text-md);
  font-weight: 900;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}

.profile-modal__button:hover {
  background: var(--brand-hover);
  color: white;
  transform: translateY(-1px);
}

.profile-modal__button--primary {
  background: var(--brand-active);
  color: white;
}
</style>