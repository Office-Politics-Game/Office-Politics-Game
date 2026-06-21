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

      <!-- 按鈕容器 -->
      <div class="flex flex-col gap-4 w-full max-w-60 lg:max-w-xs">
        <!-- 登入遊玩按鈕 -->
        <button @click="showLoginModal = true" class="btn-glass tap-pop">
          登入遊玩
        </button>

        <!-- 訪客遊玩按鈕 -->
        <button @click="showGuestLoginModal = true" class="btn-glass tap-pop">
          訪客遊玩
        </button>
      </div>

      <!-- 登入彈窗 -->
      <div
        v-if="showLoginModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        @click.self="showLoginModal = false"
      >
        <LoginContent @close="showLoginModal = false" />
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
import { ref } from "vue";
import { useRouter } from "vue-router";
import GuestLoginModal from "@/components/login/GuestLoginModal.vue";
import LoginContent from "@/components/login/LoginContent.vue";
import bgEntryVideo from "@/assets/videos/EntryPage_BgVideo.mp4";

const router = useRouter();
const showLoginModal = ref(false);
const showGuestLoginModal = ref(false);

function handleGuestCreated(player) {
  localStorage.setItem("guestPlayer", JSON.stringify(player));
  showGuestLoginModal.value = false;
  router.push("/lobby");
}
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
