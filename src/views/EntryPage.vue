<template>
  <div class="relative min-h-screen w-full overflow-hidden bg-gray-900">
    <!-- 背景影片 -->
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

    <!-- 暗色遮罩 -->
    <div class="absolute inset-0 bg-black/40 entry-overlay" />

    <!-- 內容容器 -->
    <div
      class="relative z-10 flex flex-col items-center justify-center min-h-screen px-4"
    >
      <!-- Logo 和標題 -->
      <div class="flex flex-col items-center gap-6 mb-8 lg:mb-12">
        <!-- Logo 圖片 -->
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

      <!-- 登入彈窗 -->
      <div
        v-if="showLoginModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        @click.self="closeAuthModal"
      >
        <LoginContent
          v-if="authModalMode === 'login'"
          @close="closeAuthModal"
          @open-guest="openGuestModal"
          @open-register="openRegisterModal"
        />
        <RegisterPage
          v-else
          @close="closeAuthModal"
          @back-login="authModalMode = 'login'"
          @register-success="handleRegisterSuccess"
        />
      </div>

      <div
        v-if="showGuestLoginModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        @click.self="showGuestLoginModal = false"
      >
        <GuestLoginModal
          @close="showGuestLoginModal = false"
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

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const playerStore = usePlayerStore();
const showLoginModal = ref(false);
const showGuestLoginModal = ref(false);
const authModalMode = ref("login");

const isMemberLoggedIn = computed(
  () => authStore.isLoggedIn && Boolean(authStore.currentPlayer),
);

function handlePrimaryAction() {
  if (isMemberLoggedIn.value) {
    router.push("/lobby");
    return;
  }

  openLoginModal();
}

function handleSecondaryAction() {
  if (isMemberLoggedIn.value) {
    authStore.logout();
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

function closeLoginModal() {
  showLoginModal.value = false;

  if (route.query.auth !== "login") {
    return;
  }

  const { auth, ...nextQuery } = route.query;

  router.replace({
    name: "Entry",
    query: nextQuery,
  });
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

function closeAuthModal() {
  showLoginModal.value = false;
  authModalMode.value = "login";
}

function handleRegisterSuccess() {
  authModalMode.value = "login";
}

onMounted(async () => {
  if (authStore.token && !authStore.hasVerifiedToken) {
    await authStore.verifyToken();
  }

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
  () => route.query.auth,
  (auth) => {
    if (auth === "login") {
      showLoginModal.value = true;
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
