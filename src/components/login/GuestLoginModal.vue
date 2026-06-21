<template>
  <section class="guest-modal" aria-labelledby="guest-login-title">
    <button
      type="button"
      class="guest-close tap-pop"
      aria-label="關閉訪客登入彈窗"
      @click="emit('close')"
    >
      <X class="h-7 w-7" aria-hidden="true" />
    </button>

    <h2 id="guest-login-title" class="guest-title">訪客遊玩</h2>
    <div class="guest-rule" aria-hidden="true"></div>

    <p class="guest-subtitle">選擇你的職場分身</p>

    <div class="avatar-picker" aria-label="選擇訪客頭像">
      <button
        type="button"
        class="avatar-nav tap-pop"
        aria-label="上一個頭像"
        @click="selectPreviousAvatar"
      >
        <ChevronLeft class="h-11 w-11" aria-hidden="true" />
      </button>

      <div class="avatar-frame">
        <img
          class="avatar-image"
          :src="selectedAvatar.image"
          :alt="selectedAvatar.name"
        />
      </div>

      <button
        type="button"
        class="avatar-nav tap-pop"
        aria-label="下一個頭像"
        @click="selectNextAvatar"
      >
        <ChevronRight class="h-11 w-11" aria-hidden="true" />
      </button>
    </div>

    <form class="guest-form" @submit.prevent="submitGuest">
      <label class="guest-field">
        <span class="guest-label">暱稱</span>
        <span class="nickname-control">
          <input
            v-model.trim="nickname"
            class="nickname-input"
            type="text"
            maxlength="20"
            autocomplete="nickname"
            placeholder="請輸入暱稱"
            :disabled="isSubmitting"
          />
          <button
            type="button"
            class="dice-button tap-pop"
            aria-label="隨機產生暱稱"
            :disabled="isSubmitting"
            @click="rollNickname"
          >
            <Dice5 class="h-8 w-8" aria-hidden="true" />
          </button>
        </span>
      </label>

      <p v-if="errorMessage" class="error-message" role="alert">
        {{ errorMessage }}
      </p>

      <div class="guest-actions">
        <button
          type="button"
          class="guest-button is-secondary tap-pop"
          :disabled="isSubmitting"
          @click="emit('close')"
        >
          返回
        </button>
        <button
          type="submit"
          class="guest-button is-primary tap-pop"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? "建立中..." : "開始遊玩" }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup>
import { computed, ref } from "vue";
import { ChevronLeft, ChevronRight, Dice5, X } from "lucide-vue-next";
import { guestAvatars, guestNicknames } from "@/constants/guestOptions";
import { createGuestPlayer } from "@/services/playerService";

const emit = defineEmits(["close", "success"]);

const selectedAvatarIndex = ref(0);
const nickname = ref(guestNicknames[0]);
const errorMessage = ref("");
const isSubmitting = ref(false);

const selectedAvatar = computed(() => guestAvatars[selectedAvatarIndex.value]);

function selectPreviousAvatar() {
  selectedAvatarIndex.value =
    (selectedAvatarIndex.value - 1 + guestAvatars.length) % guestAvatars.length;
}

function selectNextAvatar() {
  selectedAvatarIndex.value =
    (selectedAvatarIndex.value + 1) % guestAvatars.length;
}

function rollNickname() {
  const randomIndex = Math.floor(Math.random() * guestNicknames.length);
  nickname.value = guestNicknames[randomIndex];
  errorMessage.value = "";
}

async function submitGuest() {
  const username = nickname.value.trim();

  if (!username) {
    errorMessage.value = "請輸入暱稱";
    return;
  }

  errorMessage.value = "";
  isSubmitting.value = true;

  try {
    const player = await createGuestPlayer({
      username,
      avatarId: selectedAvatar.value.id,
    });

    emit("success", player);
  } catch (error) {
    errorMessage.value = error.message || "建立訪客資料失敗，請稍後再試";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
@reference "tailwindcss";

.guest-modal {
  @apply relative w-full max-w-[680px] bg-white px-8 py-10 text-[var(--brand-navy)] shadow-[0_24px_80px_rgba(0,19,50,0.32)] sm:px-11 sm:py-12;
  border: 1px solid rgba(0, 19, 50, 0.28);
  animation: popIn 0.38s cubic-bezier(0.18, 1.35, 0.25, 1) both;
}

.guest-close {
  @apply absolute right-4 top-4 grid h-12 w-12 place-items-center border border-[var(--brand-active)] bg-[var(--brand-navy)] text-white transition-colors duration-200 hover:bg-[var(--brand-hover)] sm:right-5 sm:top-5;
}

.guest-title {
  @apply m-0 text-center text-[42px] font-black leading-none tracking-normal text-[var(--brand-navy)] sm:text-[56px];
}

.guest-rule {
  @apply my-7 h-px w-full bg-[var(--gray-100)] sm:my-8;
}

.guest-subtitle {
  @apply mb-8 mt-0 text-center text-[24px] font-black text-[var(--brand-navy)] sm:text-[30px];
}

.avatar-picker {
  @apply grid grid-cols-[52px_minmax(0,1fr)_52px] items-center gap-2 sm:grid-cols-[72px_minmax(0,1fr)_72px] sm:gap-5;
}

.avatar-nav {
  @apply grid h-14 w-14 place-items-center border-0 bg-transparent text-[var(--brand-navy)] transition-colors duration-200 hover:text-[var(--brand-hover)] sm:h-16 sm:w-16;
}

.avatar-frame {
  @apply mx-auto grid aspect-square w-full max-w-[300px] place-items-center overflow-hidden rounded-full border border-[rgba(70,85,99,0.38)] bg-[linear-gradient(145deg,#f6f8fa,#e8edf2)] sm:max-w-[330px];
}

.avatar-image {
  @apply h-full w-full object-cover;
}

.guest-form {
  @apply mt-8 grid gap-5 sm:mt-10;
}

.guest-field {
  @apply grid gap-3;
}

.guest-label {
  @apply text-[22px] font-black text-[var(--brand-navy)] sm:text-[26px];
}

.nickname-control {
  @apply grid min-h-[64px] grid-cols-[minmax(0,1fr)_76px] border border-[var(--brand-navy)] bg-white;
}

.nickname-input {
  @apply min-w-0 border-0 bg-transparent px-6 text-[22px] font-black text-[var(--brand-navy)] outline-0 placeholder:text-[var(--gray-300)] disabled:cursor-not-allowed disabled:opacity-60 sm:text-[26px];
}

.dice-button {
  @apply grid place-items-center border-0 border-l border-[var(--brand-navy)] bg-white text-[var(--brand-navy)] transition-colors duration-200 hover:bg-[var(--brand-navy)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60;
}

.error-message {
  @apply m-0 text-sm font-bold text-red-600;
}

.guest-actions {
  @apply mt-3 grid grid-cols-2 gap-5 sm:mt-5 sm:gap-9;
}

.guest-button {
  @apply min-h-[66px] border text-[24px] font-black transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 sm:text-[28px];
}

.guest-button.is-secondary {
  @apply border-[var(--brand-navy)] bg-white text-[var(--brand-navy)] hover:bg-[var(--gray-100)];
}

.guest-button.is-primary {
  @apply border-[var(--brand-navy)] bg-[var(--brand-navy)] text-white hover:border-[var(--brand-hover)] hover:bg-[var(--brand-hover)];
}

@media (max-width: 520px) {
  .guest-modal {
    @apply px-5 py-8;
  }

  .guest-title {
    @apply text-[36px];
  }

  .guest-subtitle {
    @apply text-[21px];
  }

  .avatar-picker {
    @apply grid-cols-[44px_minmax(0,1fr)_44px];
  }

  .avatar-nav {
    @apply h-11 w-11;
  }

  .nickname-control {
    @apply grid-cols-[minmax(0,1fr)_58px];
  }

  .nickname-input {
    @apply px-4 text-[20px];
  }

  .guest-actions {
    @apply gap-3;
  }

  .guest-button {
    @apply min-h-[56px] text-[20px];
  }
}
</style>
