<template>
  <div class="social-flip-scene h-81 w-144 lg:h-135 lg:w-240">
    <div
      class="social-flip-card"
      :class="{ 'is-flipped': isSocialTransitioning }"
    >
      <section
        class="social-flip-face social-flip-front relative h-full w-full bg-[length:100%_100%] bg-center shadow-2xl"
        :style="{ backgroundImage: `url(${menuBg})` }"
      >
        <button
          class="menu-btn left-[35px] top-[32px] h-[244px] w-[170px] gap-6 lg:left-[58px] lg:top-[53px] lg:h-[407px] lg:w-[283px]"
          @click="$router.push({ name: 'LobbyGameMenu' })"
        >
          <div class="btn-content">
            <img
              src="../../assets/images/icon-card.png"
              alt="開始對局"
              class="h-auto w-[78px] object-contain lg:w-[120px]"
            />
            <span class="text-lg font-bold tracking-wider">開始對局</span>
          </div>
        </button>

        <button
          class="menu-btn left-[212px] top-[32px] h-[148px] w-[220px] lg:left-[353px] lg:top-[53px] lg:h-[247px] lg:w-[367px]"
        >
          <div class="btn-content">
            <img
              src="../../assets/images/icon-personal.png"
              alt="個人資料"
              class="h-auto w-[59px] object-contain lg:w-[90px]"
            />
            <span class="mt-2 text-lg font-bold tracking-wider">個人資料</span>
          </div>
        </button>

        <button
          class="menu-btn right-[40px] top-[32px] h-[88px] w-[96px] lg:right-[67px] lg:top-[53px] lg:h-[147px] lg:w-[160px]"
          :disabled="isSocialTransitioning"
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
          :disabled="isMallTransitioning"
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
          @click="$router.push('/')"
        >
          <div class="btn-content">
            <img
              src="../../assets/images/icon-quit.png"
              alt="離開遊戲"
              class="h-auto w-[32px] object-contain lg:w-[48px]"
            />
            <span class="mt-1 text-lg font-bold tracking-wider">離開遊戲</span>
          </div>
        </button>
      </section>

      <section
        class="social-flip-face social-flip-back relative h-full w-full bg-cover bg-center shadow-2xl"
        :style="{ backgroundImage: `url(${friendBg})` }"
      >
        <div class="social-flip-backdrop"></div>
        <div class="social-flip-copy">
          <span>社交通訊</span>
          <strong>同事連線中</strong>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import friendBg from "@/assets/images/bg-friend-view.webp";
import menuBg from "@/assets/images/menu.webp";

const router = useRouter();
const isSocialTransitioning = ref(false);
const isMallTransitioning = ref(false);
const SOCIAL_FLIP_DURATION = 700;

function openFriendPage() {
  if (isSocialTransitioning.value || isMallTransitioning.value) {
    return;
  }

  isSocialTransitioning.value = true;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    router.push("/friend");
    return;
  }

  window.setTimeout(() => {
    router.push("/friend");
  }, SOCIAL_FLIP_DURATION);
}

function openMallPage() {
  if (isMallTransitioning.value || isSocialTransitioning.value) {
    return;
  }

  isMallTransitioning.value = true;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    router.push("/mall");
    return;
  }

  window.setTimeout(() => {
    router.push("/mall");
  }, 180);
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
