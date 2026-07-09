<template>
  <section class="guest-modal" aria-labelledby="guest-login-title">
    <button
      type="button"
      class="btn-dark tap-pop absolute right-3 top-3 grid h-9 w-9 place-items-center"
      aria-label="關閉訪客登入彈窗"
      @click="closeGuest"
    >
      <span aria-hidden="true">×</span>
    </button>

    <h2
      id="guest-login-title"
      class="m-0 text-center text-xl font-black leading-none tracking-normal text-[var(--brand-navy)]"
    >
      訪客遊玩
    </h2>
    <div
      class="my-2 h-px w-full bg-[var(--brand-primary)] lg:my-4"
      aria-hidden="true"
    ></div>

    <p
      class="mb-2 text-center text-[var(--text-md)] font-bold text-[var(--brand-active)]"
    >
      選擇你的職場分身
    </p>

    <div
      class="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-1 lg:grid-cols-[72px_minmax(0,1fr)_72px] lg:gap-2"
      aria-label="選擇訪客頭像"
    >
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
          class="h-full w-full object-cover"
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

    <form class="mt-2 grid gap-3" @submit.prevent="submitGuest">
      <label class="grid gap-1 lg:gap-2">
        <span class="text-sm font-bold text-[var(--brand-active)]">暱稱</span>
        <span
          class="grid grid-cols-[minmax(0,1fr)_40px] border border-[var(--brand-primary)] bg-[rgba(255,255,255,0.58)]"
        >
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

      <p
        v-if="errorMessage"
        class="m-0 text-sm font-bold text-[var(--brand-hover)]"
        role="alert"
      >
        {{ errorMessage }}
      </p>

      <div class="grid grid-cols-2 gap-3 lg:mt-0">
        <button
          type="button"
          class="guest-button is-secondary btn-glass tap-pop"
          :disabled="isSubmitting"
          @click="closeGuest"
        >
          返回
        </button>
        <button
          type="submit"
          class="guest-button is-primary btn-dark tap-pop"
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
import { ChevronLeft, ChevronRight, Dice5 } from "lucide-vue-next";
import { createGuestNickname, guestAvatars } from "@/constants/guestOptions";
import { createGuestPlayer } from "@/services/playerService";
import { usePreGameAudio } from "@/composables/UsePreGameAudio";

const emit = defineEmits(["close", "success"]);
const { playPreGameSound } = usePreGameAudio();

const selectedAvatarIndex = ref(0);
const nickname = ref(createGuestNickname());
const errorMessage = ref("");
const isSubmitting = ref(false);

const selectedAvatar = computed(() => guestAvatars[selectedAvatarIndex.value]);

function playGuestClick() {
  playPreGameSound("login-button-click");
}

function closeGuest() {
  playGuestClick();
  emit("close");
}

function selectPreviousAvatar() {
  playGuestClick();
  selectedAvatarIndex.value =
    (selectedAvatarIndex.value - 1 + guestAvatars.length) % guestAvatars.length;
}

function selectNextAvatar() {
  playGuestClick();
  selectedAvatarIndex.value =
    (selectedAvatarIndex.value + 1) % guestAvatars.length;
}

function rollNickname() {
  playGuestClick();
  nickname.value = createGuestNickname();
  errorMessage.value = "";
}

async function submitGuest() {
  if (isSubmitting.value) {
    return;
  }

  playGuestClick();

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
  @apply relative w-full max-w-[420px] rounded-[var(--radius-lg)] border border-[rgba(134,179,224,0.38)] bg-[rgba(255,255,255,0.92)] px-5 py-6 text-[var(--brand-active)] shadow-[var(--shadow)] animate-[popIn_0.42s_cubic-bezier(0.18,1.35,0.25,1)_both] [font-family:var(--font-sans)] lg:px-8 lg:py-8;
}

.avatar-nav {
  @apply grid h-11 w-11 place-items-center border-0 bg-transparent transition-colors duration-200 lg:h-16 lg:w-16;
  color: var(--brand-navy);
}

.avatar-nav:hover {
  color: var(--brand-hover);
}

.avatar-frame {
  @apply mx-auto grid aspect-square w-full max-w-[100px] place-items-center overflow-hidden rounded-full border lg:max-w-[200px];
  background: var(--surface-glass-hover);
  border-color: var(--brand-primary);
}

.nickname-input {
  @apply min-w-0 border-0 bg-transparent px-2 text-[var(--text-md)] font-bold text-[var(--brand-active)] outline-0 transition-[background-color,box-shadow] duration-[180ms] disabled:cursor-not-allowed disabled:opacity-60 lg:px-4;
}

.nickname-input::placeholder {
  @apply font-semibold text-[var(--brand-disabled)];
}

.nickname-input:focus {
  @apply bg-[var(--surface-glass-hover)] shadow-[0_0_0_4px_var(--brand-focus)];
}

.dice-button {
  @apply grid place-items-center border-0 border-l border-[var(--brand-primary)] bg-transparent text-[var(--brand-active)] transition-[background-color,color] duration-[180ms] disabled:cursor-not-allowed disabled:opacity-60;
}

.dice-button:hover {
  @apply bg-[var(--brand-hover)] text-white;
}

.guest-button {
  @apply flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--brand-primary)] px-3 text-[var(--text-sm)] font-extrabold transition-[border-color,background-color,box-shadow,color] duration-[180ms] disabled:cursor-not-allowed disabled:opacity-60 lg:min-h-[46px] lg:px-6;
}

.guest-button.is-secondary {
  @apply bg-[var(--surface-glass)] text-[var(--brand-active)];
}

.guest-button.is-primary {
  @apply bg-[var(--brand-active)] text-white shadow-[0_10px_24px_rgba(70,85,99,0.24)];
}

.guest-button:hover {
  @apply border-[var(--brand-hover)] bg-[var(--brand-hover)] text-white shadow-[0_10px_24px_rgba(0,70,244,0.24)];
}

.guest-button:focus-visible,
.dice-button:focus-visible {
  @apply outline-0 shadow-[0_0_0_4px_var(--brand-focus)];
}
</style>
