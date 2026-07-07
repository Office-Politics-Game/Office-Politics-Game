<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import loadingBackground from "@/assets/images/bg-loading.webp";

const router = useRouter();
const route = useRoute();

const loadingMessages = [
  "辦公室開啟中...",
  "員工報到中...",
  "會議室整理中...",
  "座位安排中...",
  "投影設備啟動中...",
  "簡報資料載入中...",
  "會議文件準備中...",
  "茶水準備中...",
  "與會人員確認中...",
  "主管陸續進場...",
];

const finalMessage = "會議即將開始...";

function createLoadingSequence() {
  return [...loadingMessages]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .concat(finalMessage);
}

const activeMessages = createLoadingSequence();
const currentMessageIndex = ref(0);
const fadePhase = ref("intro");
const isProgressActive = ref(false);
const currentMessage = computed(
  () => activeMessages[currentMessageIndex.value],
);

let messageTimer = null;
let introTimer = null;
let fadeOutTimer = null;
let loadingTimer = null;

onMounted(() => {
  window.requestAnimationFrame(() => {
    fadePhase.value = "dim";
  });

  introTimer = window.setTimeout(() => {
    isProgressActive.value = true;

    messageTimer = window.setInterval(() => {
      if (currentMessageIndex.value < activeMessages.length - 1) {
        currentMessageIndex.value += 1;
      }
    }, 1000);
  }, 600);

  fadeOutTimer = window.setTimeout(() => {
    if (messageTimer) {
      window.clearInterval(messageTimer);
      messageTimer = null;
    }

    fadePhase.value = "out";
  }, 4600);

  loadingTimer = window.setTimeout(() => {
    router.replace({
      name: "Game",
      query: route.query,
    });
  }, 5200);
});

onBeforeUnmount(() => {
  if (messageTimer) {
    window.clearInterval(messageTimer);
  }

  if (introTimer) {
    window.clearTimeout(introTimer);
  }

  if (fadeOutTimer) {
    window.clearTimeout(fadeOutTimer);
  }

  if (loadingTimer) {
    window.clearTimeout(loadingTimer);
  }
});
</script>

<template>
  <main
    class="loading-view grid h-[100svh] min-h-[100svh] w-screen overflow-hidden bg-cover bg-center bg-no-repeat text-white"
    :style="{ backgroundImage: `url(${loadingBackground})` }"
  >
    <section
      class="absolute flex flex-col w-50 lg:w-90 right-[50%] translate-[50%] bottom-20 lg:bottom-40"
      aria-live="polite"
    >
      <p class="text-white m-0 text-lg text-center font-bold">
        {{ currentMessage }}
      </p>
      <div
        class="loading-progress h-2 mt-3 overflow-hidden w-full lg:mt-5 lg:h-3"
        role="progressbar"
        aria-label="遊戲載入進度"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          class="loading-progress-bar h-full w-full"
          :class="{ 'loading-progress-bar--active': isProgressActive }"
        ></div>
      </div>
    </section>
    <div
      class="loading-fade pointer-events-none absolute inset-0"
      :class="`loading-fade--${fadePhase}`"
      aria-hidden="true"
    ></div>
  </main>
</template>

<style scoped>
.loading-view {
  position: relative;
}

.loading-progress {
  border: 1px solid rgba(255, 255, 255, 0.76);
  background: rgba(255, 255, 255, 0.18);
}

.loading-progress-bar {
  transform: scaleX(0);
  transform-origin: left center;
  background: #ffffff;
}

.loading-progress-bar--active {
  animation: loading-progress-fill 4s linear forwards;
}

.loading-fade {
  background: #000000;
  opacity: 1;
  transition: opacity 600ms ease;
}

.loading-fade--intro,
.loading-fade--out {
  opacity: 1;
}

.loading-fade--dim {
  opacity: 0.2;
}

@keyframes loading-progress-fill {
  from {
    transform: scaleX(0);
  }

  to {
    transform: scaleX(1);
  }
}
</style>
