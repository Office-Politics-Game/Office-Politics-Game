<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import loadingBackground from '@/assets/images/bg-loading.webp'

const props = defineProps({
  errorMessage: {
    type: String,
    default: '',
  },
  isExiting: {
    type: Boolean,
    default: false,
  },
  progress: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['retry'])

const loadingMessages = [
  '整理辦公桌面...',
  '確認會議行程...',
  '準備茶水間情報...',
  '更新同事名單...',
  '整理辦公室政治...',
  '載入遊戲資料...',
]
const activeMessages = [...loadingMessages]
  .sort(() => Math.random() - 0.5)
  .slice(0, 4)
const currentMessageIndex = ref(0)
const fadePhase = ref('intro')
const currentMessage = computed(
  () => props.errorMessage || activeMessages[currentMessageIndex.value],
)
const progressScale = computed(() =>
  Math.min(Math.max(props.progress, 0), 100) / 100,
)

let messageTimer = null
let introTimer = null

function clearLoadingTimers() {
  if (messageTimer) {
    window.clearInterval(messageTimer)
    messageTimer = null
  }

  if (introTimer) {
    window.clearTimeout(introTimer)
    introTimer = null
  }
}

function stopLoadingAnimation() {
  clearLoadingTimers()
}

onMounted(() => {
  window.requestAnimationFrame(() => {
    fadePhase.value = 'dim'
  })

  introTimer = window.setTimeout(() => {
    if (props.errorMessage) {
      return
    }

    messageTimer = window.setInterval(() => {
      currentMessageIndex.value =
        (currentMessageIndex.value + 1) % activeMessages.length
    }, 1000)
  }, 600)
})

watch(
  () => props.errorMessage,
  (errorMessage) => {
    if (errorMessage) {
      stopLoadingAnimation()
    }
  },
)

onBeforeUnmount(clearLoadingTimers)
</script>

<template>
  <main
    class="loading-screen grid h-[100svh] min-h-[100svh] w-screen overflow-hidden bg-cover bg-center bg-no-repeat text-white"
    :style="{ backgroundImage: `url(${loadingBackground})` }"
  >
    <section
      class="absolute right-[50%] bottom-20 flex w-64 translate-x-[50%] flex-col lg:bottom-40 lg:w-96"
      aria-live="polite"
    >
      <p class="m-0 text-center text-lg font-bold text-white">
        {{ currentMessage }}
      </p>

      <button
        v-if="errorMessage"
        type="button"
        class="mx-auto mt-5 border border-white bg-black/45 px-6 py-2 font-bold text-white transition hover:bg-white hover:text-black"
        @click="emit('retry')"
      >
        重新嘗試
      </button>

      <div
        v-else
        class="loading-progress mt-3 h-2 w-full overflow-hidden lg:mt-5 lg:h-3"
        role="progressbar"
        aria-label="遊戲資料載入中"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          class="loading-progress-bar h-full w-full"
          :style="{ transform: `scaleX(${progressScale})` }"
        ></div>
      </div>
    </section>

    <div
      class="loading-fade pointer-events-none absolute inset-0"
      :class="isExiting ? 'loading-fade--out' : `loading-fade--${fadePhase}`"
      aria-hidden="true"
    ></div>
  </main>
</template>

<style scoped>
.loading-screen {
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
  transition: transform 240ms ease;
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

</style>
