<template>
  <div class="relative min-h-screen w-full overflow-hidden bg-gray-900">
    <div class="absolute inset-0 overflow-hidden">
      <video
        class="absolute inset-0 h-full w-full object-cover entry-video"
        autoplay
        muted
        loop
        playsinline
      >
        <source :src="bgEntryVideo" type="video/mp4" />
      </video>
    </div>
    <div class="absolute inset-0 bg-black/40 entry-overlay" />
    <div
      class="relative z-10 flex flex-col items-center justify-center min-h-screen px-4"
    >
      <div class="flex flex-col items-center gap-6 mb-8 lg:mb-12">
        <img
          src="@/assets/images/logo-main.png"
          alt="Office Politics Logo"
          class="object-contain drop-shadow-lg w-66 lg:w-120"
        />
      </div>
      <div class="flex w-full max-w-60 flex-col gap-4 lg:max-w-xs">
        <button
          class="btn-glass tap-pop"
          type="button"
          @click="handlePrimaryAction"
        >
          {{ isMemberLoggedIn ? "進入遊戲" : "登入遊玩" }}
        </button>
        <button
          class="btn-glass tap-pop"
          type="button"
          @click="handleSecondaryAction"
        >
          {{ isMemberLoggedIn ? "登出" : "訪客遊玩" }}
        </button>
      </div>

      <RouterLink
        class="mt-5 text-[13px] font-medium text-white/78 transition-colors duration-[180ms] ease-out hover:text-white focus-visible:outline-0 focus-visible:shadow-[0_0_0_4px_var(--brand-focus)] lg:mt-6 lg:text-[15px]"
        to="/intro"
      >
        關於遊戲
      </RouterLink>

      <footer
        class="absolute inset-x-0 bottom-4 z-10 flex items-center justify-center px-4 text-white/62 lg:bottom-6"
        aria-label="頁尾資訊"
      >
        <div
          class="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[11px] font-normal leading-none lg:text-[12px]"
        >
          <span>ver 1.0.0</span>
          <span aria-hidden="true">|</span>
          <span>© 2026 Office Politics Game Team</span>
          <span aria-hidden="true">|</span>
          <RouterLink
            class="transition-colors duration-[180ms] ease-out hover:text-white focus-visible:outline-0 focus-visible:shadow-[0_0_0_4px_var(--brand-focus)]"
            to="/privacy"
          >
            隱私權政策
          </RouterLink>
          <span aria-hidden="true">|</span>
          <a
            class="transition-colors duration-[180ms] ease-out hover:text-white focus-visible:outline-0 focus-visible:shadow-[0_0_0_4px_var(--brand-focus)]"
            href="#"
            @click.prevent
          >
            會員條款
          </a>
        </div>
      </footer>
      <div
        v-if="showLoginModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        @click.self="handleAuthOverlayClose"
      >
        <LoginContent
          v-if="authModalMode === 'login'"
          :notice-message="loginNoticeMessage"
          :notice-type="loginNoticeType"
          @close="closeAuthModal"
          @open-guest="openGuestModal"
          @open-register="openRegisterModal"
          @open-forgot-password="openForgotPasswordModal"
        />
        <RegisterPage
          v-else-if="authModalMode === 'register'"
          @close="closeAuthModal"
          @back-login="showLoginMode"
          @register-success="handleRegisterSuccess"
        />
        <ForgotPasswordContent
          v-else-if="authModalMode === 'forgot-password'"
          @close="closeAuthModal"
          @back-login="showLoginMode"
        />
        <ResetPasswordContent
          v-else-if="authModalMode === 'reset-password'"
          :reset-token="resetPasswordToken"
          @close="closeAuthModal"
          @back-login="showLoginMode"
          @reset-success="showLoginMode"
        />
      </div>
      <div
        v-if="showGuestLoginModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        @click.self="handleGuestOverlayClose"
      >
        <GuestLoginModal
          @close="closeGuestLoginModal"
          @success="handleGuestCreated"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import GuestLoginModal from "@/components/login/GuestLoginModal.vue";
import LoginContent from "@/components/login/LoginContent.vue";
import RegisterPage from "@/components/register/RegisterPage.vue";
import { usePlayerStore } from "@/stores/playerStore.js";
import { useAuthStore } from "@/stores/authStore.js";
import bgEntryVideo from "@/assets/videos/EntryPage_BgVideo.mp4";
import { usePreGameAudio } from "@/composables/UsePreGameAudio";
import ForgotPasswordContent from "@/components/login/ForgotPasswordContent.vue";
import ResetPasswordContent from "@/components/login/ResetPasswordContent.vue";
import { resolvePasswordResetToken } from "@/services/authApi.js";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const playerStore = usePlayerStore();
const {
  playPreGameSound,
  startPreGameBackground,
  stopPreGameBackground,
} = usePreGameAudio();
const showLoginModal = ref(false);
const showGuestLoginModal = ref(false);
const authModalMode = ref("login");
const resetPasswordToken = ref("");
const loginNoticeMessage = ref("");
const loginNoticeType = ref("success");

const isMemberLoggedIn = computed(
  () => authStore.isLoggedIn && Boolean(authStore.currentPlayer),
);

function playLoginClick() {
  playPreGameSound("login-button-click");
}

function handlePrimaryAction() {
  playLoginClick();

  if (isMemberLoggedIn.value) {
    startPreGameBackground({ fadeIn: true, userInitiated: true });
    router.push("/lobby");
    return;
  }

  openLoginModal();
}

async function handleSecondaryAction() {
  playLoginClick();

  if (isMemberLoggedIn.value) {
    const didLogout = await authStore.logout();

    if (!didLogout) {
      return;
    }

    stopPreGameBackground({ fadeOut: false });
    playerStore.resetPlayer();
    localStorage.removeItem("guestPlayer");
    showLoginModal.value = false;
    showGuestLoginModal.value = false;
    router.push("/");
    return;
  }

  showGuestLoginModal.value = true;
}

function openGuestModal() {
  showLoginModal.value = false;
  showGuestLoginModal.value = true;
}

function handleGuestCreated(player) {
  localStorage.setItem("guestPlayer", JSON.stringify(player));
  playerStore.setCurrentPlayer(player);
  showGuestLoginModal.value = false;
  router.push("/lobby");
}

function openLoginModal() {
  authModalMode.value = "login";
  showLoginModal.value = true;
}

function openRegisterModal() {
  authModalMode.value = "register";
  showLoginModal.value = true;
}

function openForgotPasswordModal() {
  authModalMode.value = "forgot-password";
  showLoginModal.value = true;
}

function showLoginMode() {
  authModalMode.value = "login";
  resetPasswordToken.value = "";
  clearAuthQuery();
}

function clearAuthQuery() {
  if (route.name !== "Entry") {
    return;
  }

  const authQueryKeys = new Set([
    "auth",
    "notice",
    "code",
    "access_token",
    "refresh_token",
    "type",
    "error",
    "error_description",
  ]);

  const hasAuthQuery = Object.keys(route.query).some((key) =>
    authQueryKeys.has(key),
  );

  if (!hasAuthQuery) {
    return;
  }

  const nextQuery = Object.fromEntries(
    Object.entries(route.query).filter(([key]) => !authQueryKeys.has(key)),
  );

  router.replace({
    name: "Entry",
    query: nextQuery,
    hash: "",
  });
}

function clearLoginNotice() {
  loginNoticeMessage.value = "";
  loginNoticeType.value = "success";
}

function showLoginNotice(message, type = "success") {
  loginNoticeMessage.value = message;
  loginNoticeType.value = type;
}

async function openResetPasswordModalFromRoute() {
  resetPasswordToken.value = "";
  authModalMode.value = "reset-password";
  showLoginModal.value = true;
  clearLoginNotice();

  try {
    resetPasswordToken.value = await resolvePasswordResetToken();
  } catch {
    resetPasswordToken.value = "";
  }
}

function closeAuthModal() {
  showLoginModal.value = false;
  authModalMode.value = "login";
  resetPasswordToken.value = "";
  clearLoginNotice();
  clearAuthQuery();
}

function handleAuthOverlayClose() {
  playLoginClick();
  closeAuthModal();
}

function closeGuestLoginModal() {
  showGuestLoginModal.value = false;
}

function handleGuestOverlayClose() {
  playLoginClick();
  closeGuestLoginModal();
}

function handleRegisterSuccess() {
  authModalMode.value = "login";
}

onMounted(async () => {
  if (playerStore.currentPlayer) {
    return;
  }

  try {
    const savedPlayer = JSON.parse(localStorage.getItem("guestPlayer") || "null");

    if (savedPlayer?.id) {
      playerStore.setCurrentPlayer(savedPlayer);
    }
  } catch {
    localStorage.removeItem("guestPlayer");
  }
});

watch(
  () => [route.query.auth, route.query.notice],
  ([auth, notice]) => {
    if (auth === "login") {
      authModalMode.value = "login";
      showLoginModal.value = true;

      if (notice === "email-verified") {
        showLoginNotice("信箱驗證完成，請重新登入", "success");
      }

      if (notice === "password-updated") {
        showLoginNotice("密碼已更新，請重新登入", "success");
      }

      return;
    }

    if (auth === "forgot-password") {
      clearLoginNotice();
      authModalMode.value = "forgot-password";
      showLoginModal.value = true;
      return;
    }

    if (auth === "reset-password") {
      void openResetPasswordModalFromRoute();
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.entry-video {
  object-fit: cover;
  filter: blur(7px) saturate(1.18) brightness(0.58) contrast(1.12);
  transform: scale(1.045);
  z-index: 0;
}

.entry-overlay {
  z-index: 1;
  background:
    linear-gradient(
      90deg,
      rgba(2, 18, 28, 0.5),
      rgba(4, 24, 35, 0.24),
      rgba(2, 18, 28, 0.52)
    ),
    linear-gradient(
      180deg,
      rgba(2, 13, 20, 0.34),
      rgba(4, 20, 28, 0.3) 48%,
      rgba(2, 11, 16, 0.58)
    ),
    rgba(5, 33, 46, 0.22);
  pointer-events: none;
}
</style>
