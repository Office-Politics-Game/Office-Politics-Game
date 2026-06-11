<template>
  <div class="relative min-h-screen w-full overflow-hidden bg-gray-900">
    <!-- 背景圖片 -->
    <div
      class="absolute inset-0 bg-cover bg-center"
      :style="{
        backgroundImage: `url(${bgEntrance})`,
        filter: 'blur(4px)'
      }"
    />

    <!-- 暗色遮罩 -->
    <div class="absolute inset-0 bg-black/40" />

    <!-- 內容容器 -->
    <div class="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
      <!-- Logo 和標題 -->
      <div class="flex flex-col items-center gap-6 mb-12">
        <!-- Logo 圖片 -->
        <img
          src="@/assets/LOGO_Main.png"
          alt="Office Politics Logo"
          class="w-24 h-24 object-contain drop-shadow-lg"
        />

        <!-- 中文標題 -->
        <h1 class="text-4xl font-bold text-white text-center">職場風雲</h1>

        <!-- 英文標題 -->
        <h2 class="text-5xl font-bold text-white text-center tracking-widest">OFFICE POLITICS</h2>
      </div>

      <!-- 按鈕容器 -->
      <div class="flex flex-col gap-4 w-full max-w-xs">
        <!-- 登入遊玩按鈕 -->
        <button
          @click="$router.push('/login')"
          class="px-8 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-colors shadow-lg"
        >
          登入遊玩
        </button>

        <!-- 訪客遊玩按鈕 -->
        <button
          @click="$router.push('/lobby')"
          class="px-8 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors shadow-lg border border-gray-500"
        >
          訪客遊玩
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import bgEntrance from '@/assets/BG_Entrance.jpg'

const router = useRouter()
</script>

<style scoped>
/* 按鈕樣式微調 */
button {
  transition: all 0.3s ease;
}

button:active {
  transform: scale(0.98);
}
</style>
