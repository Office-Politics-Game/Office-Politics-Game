<template>
  <div class="social-flip-scene h-81 w-144 lg:h-135 lg:w-240">
    <div
      class="social-flip-card"
      :class="{ 'is-flipped': isSocialTransitioning || isProfileTransitioning }"
    >
      <section
        class="social-flip-face social-flip-front relative h-full w-full bg-[length:100%_100%] bg-center shadow-2xl"
        :style="{ backgroundImage: `url(${menuBg})` }"
      >
        <RoomInvitationNotice />

        <CurrencyBar
          class="absolute bottom-1.5 right-7 origin-bottom-right scale-[0.6] lg:bottom-3 lg:right-12"
          :items="['coins', 'gems']"
        />
        <!-- 開始遊玩 -->
        <button
          class="menu-btn left-[35px] top-[32px] h-[244px] w-[170px] gap-6 lg:left-[58px] lg:top-[53px] lg:h-[407px] lg:w-[283px]"
          :disabled="isAnyPageTransitioning"
          @click="openGameMenu"
        >
          <div class="btn-content">
            <img
              src="../../assets/images/icon-card.png"
              alt="開始遊玩"
              class="h-auto w-[78px] object-contain lg:w-[120px]"
            />
            <span class="text-lg font-bold tracking-wider">開始遊玩</span>
          </div>
        </button>

        <button
          class="menu-btn left-[212px] top-[32px] h-[148px] w-[220px] lg:left-[353px] lg:top-[53px] lg:h-[247px] lg:w-[367px]"
          :disabled="isAnyPageTransitioning"
          @click="openProfilePage"
        >
          <div class="btn-content">
            <img
              src="../../assets/images/icon-personal.png"
              alt="個人區域"
              class="h-auto w-[59px] object-contain lg:w-[90px]"
            />
            <span class="mt-2 text-lg font-bold tracking-wider">個人區域</span>
          </div>
        </button>

        <button
          class="menu-btn right-[40px] top-[32px] h-[88px] w-[96px] lg:right-[67px] lg:top-[53px] lg:h-[147px] lg:w-[160px]"
          :disabled="isAnyPageTransitioning"
          @click="openFriendPage"
        >
          <div class="btn-content">
            <img
              src="../../assets/images/icon-social.png"
              alt="社交"
              class="h-auto w-[47px] object-contain lg:w-[75px]"
            />
            <span class="mt-1 text-lg font-bold tracking-wider">社交</span>
          </div>
        </button>

        <button
          class="menu-btn right-[40px] top-[126px] h-[70px] w-[96px] lg:right-[67px] lg:top-[210px] lg:h-[117px] lg:w-[160px]"
          :disabled="isAnyPageTransitioning"
          @click="openStyleStudio"
        >
          <div class="btn-content">
            <img
              src="../../assets/images/icon-setting.png"
              alt="設定"
              class="h-auto w-[30px] object-contain lg:w-[45px]"
            />
            <span class="mt-1 text-lg font-bold tracking-wider">設定</span>
          </div>
        </button>

        <button
          class="menu-btn left-[212px] bottom-[47px] h-[90px] w-[95px] lg:left-[353px] lg:bottom-[79px] lg:h-[150px] lg:w-[158px]"
          :disabled="isAnyPageTransitioning"
          @click="openGachaPage"
        >
          <div class="btn-content">
            <img
              src="../../assets/images/icon-recruit.png"
              alt="招募"
              class="h-auto w-[44px] object-contain lg:w-[66px]"
            />
            <span class="mt-1 text-lg font-bold tracking-wider">招募</span>
          </div>
        </button>

        <button
          class="menu-btn left-[314px] bottom-[47px] h-[90px] w-[86px] lg:left-[523px] lg:bottom-[79px] lg:h-[150px] lg:w-[143px]"
          :disabled="isAnyPageTransitioning"
          @click="openMallPage"
        >
          <div class="btn-content">
            <img
              src="../../assets/images/icon-mall.png"
              alt="商城"
              class="h-auto w-[41px] object-contain lg:w-[60px]"
            />
            <span class="mt-1 text-lg font-bold tracking-wider">商城</span>
          </div>
        </button>

        <button
          class="menu-btn right-[40px] bottom-[47px] h-[74px] w-[130px] lg:right-[67px] lg:bottom-[79px] lg:h-[124px] lg:w-[217px]"
          :disabled="isAnyPageTransitioning"
          @click="leaveLobby"
        >
          <div class="btn-content">
            <img
              src="../../assets/images/icon-quit.png"
              alt="打卡下班"
              class="h-auto w-[32px] object-contain lg:w-[48px]"
            />
            <span class="mt-1 text-lg font-bold tracking-wider">打卡下班</span>
          </div>
        </button>
      </section>

      <section
        class="social-flip-face social-flip-back relative h-full w-full bg-cover bg-center shadow-2xl"
        :style="{ backgroundImage: `url(${transitionBackBg})` }"
      >
        <div class="social-flip-backdrop"></div>
        <div class="social-flip-copy">
          <span>{{ transitionBackTitle }}</span>
          <strong>{{ transitionBackSubtitle }}</strong>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import RoomInvitationNotice from "@/components/gameRoom/RoomInvitationNotice.vue";
import friendBg from "@/assets/images/bg-friend-view.webp";
import profileBg from "@/assets/images/bg-personal.webp";
import menuBg from "@/assets/images/menu.webp";
import CurrencyBar from "@/components/common/CurrencyBar.vue";
import { useProfileInitializer } from "@/composables/useProfileInitializer.js";
import { useAuthStore } from "@/stores/authStore.js";
import { useCurrencyStore } from "@/stores/currencyStore.js";
import { usePlayerStore } from "@/stores/playerStore.js";
import { usePreGameAudio } from "@/composables/UsePreGameAudio";

const router = useRouter();
const authStore = useAuthStore();
const currencyStore = useCurrencyStore();
const playerStore = usePlayerStore();
const { initializeProfile } = useProfileInitializer();
const { playPreGameSound, stopPreGameBackground } = usePreGameAudio();
const isSocialTransitioning = ref(false);
const isProfileTransitioning = ref(false);
const isMallTransitioning = ref(false);
const SOCIAL_FLIP_DURATION = 700;
const PROFILE_FLIP_DURATION = 700;

const isAnyPageTransitioning = computed(
  () =>
    isSocialTransitioning.value ||
    isProfileTransitioning.value ||
    isMallTransitioning.value,
);

const transitionBackBg = computed(() =>
  isProfileTransitioning.value ? profileBg : friendBg,
);

const transitionBackTitle = computed(() =>
  isProfileTransitioning.value ? "個人頁面" : "社交",
);

const transitionBackSubtitle = computed(() =>
  isProfileTransitioning.value ? "辦公桌" : "交誼廳",
);

function getCurrentPlayerId() {
  return authStore.currentPlayer?.id ?? playerStore.currentPlayerId;
}

function playLobbyNavigationSound() {
  playPreGameSound("lobby-navigation-whoosh");
}

watch(
  getCurrentPlayerId,
  (playerId) => {
    if (!playerId) {
      return;
    }

    currencyStore.fetchPlayerCurrency(playerId).catch(() => {});
  },
  { immediate: true }
);

function openFriendPage() {
  if (isAnyPageTransitioning.value) {
    return;
  }

  playLobbyNavigationSound();
  isSocialTransitioning.value = true;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    router.push("/friend");
    return;
  }

  window.setTimeout(() => {
    router.push("/friend");
  }, SOCIAL_FLIP_DURATION);
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function openProfilePage() {
  if (isAnyPageTransitioning.value) {
    return;
  }

  playLobbyNavigationSound();
  isProfileTransitioning.value = true;

  const shouldReduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const profileLoad = initializeProfile().catch(() => null);
  const flipDelay = shouldReduceMotion
    ? Promise.resolve()
    : wait(PROFILE_FLIP_DURATION);

  await Promise.all([profileLoad, flipDelay]);
  router.push("/profile");
}

function leaveLobby() {
  if (isAnyPageTransitioning.value) {
    return;
  }

  playPreGameSound("login-button-click");
  stopPreGameBackground({ fadeOut: false });
  router.push("/");
}

function openMallPage() {
  if (isAnyPageTransitioning.value) {
    return;
  }

  playPreGameSound("login-button-click");
  isMallTransitioning.value = true;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    router.push("/mall");
    return;
  }

  window.setTimeout(() => {
    router.push("/mall");
  }, 180);
}

function openGameMenu() {
  if (isAnyPageTransitioning.value) {
    return;
  }

  playLobbyNavigationSound();
  router.push({ name: "LobbyGameMenu" });
}

function openGachaPage() {
  if (isAnyPageTransitioning.value) {
    return;
  }

  playPreGameSound("login-button-click");
  router.push("/gacha");
}

function openStyleStudio() {
  if (isAnyPageTransitioning.value) {
    return;
  }

  playLobbyNavigationSound();
  router.push({ name: "StyleStudio" });
}
</script>

<style scoped>
.social-flip-scene {
  perspective: 1600px;
}

.social-flip-card {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 700ms cubic-bezier(0.22, 0.61, 0.36, 1);
  will-change: transform;
}

.social-flip-card.is-flipped {
  transform: rotateY(180deg);
}

.social-flip-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.social-flip-back {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transform: rotateY(180deg);
}

.social-flip-backdrop {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg, rgba(0, 19, 50, 0.18), rgba(70, 85, 99, 0.36)),
    rgba(0, 19, 50, 0.08);
}

.social-flip-copy {
  position: relative;
  display: grid;
  gap: 8px;
  border: 1px solid rgba(255, 255, 255, 0.56);
  background: rgba(255, 255, 255, 0.3);
  padding: 18px 28px;
  text-align: center;
  color: white;
  letter-spacing: 0.08em;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.social-flip-copy span {
  font-size: var(--text-sm);
  font-weight: 700;
}

.social-flip-copy strong {
  font-size: var(--text-xl);
  font-weight: 900;
}

.menu-btn {
  position: absolute;
  overflow: visible;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
}

.menu-btn:disabled {
  cursor: wait;
}

.menu-btn::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
}

.menu-btn img,
.menu-btn span {
  position: relative;
  z-index: 1;
}

.menu-btn:hover::before {
  opacity: 1;
  mix-blend-mode: difference;
  backdrop-filter: saturate(0);
  background-color: rgb(120, 120, 120);
  -webkit-backdrop-filter: saturate(0);
}

.btn-content {
  transition-property: transform;
  transition-duration: 200ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.menu-btn:hover .btn-content {
  transform: scale(1.03);
}

@media (prefers-reduced-motion: reduce) {
  .social-flip-card {
    transition: none;
  }
}
</style>
