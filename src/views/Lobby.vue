<script setup>
import { ref } from 'vue'
const isProfileOpen = ref(false)
</script>

<template>
  <div class="relative w-screen h-screen bg-white text-black flex flex-col justify-center items-center overflow-hidden p-4 select-none">
    <div class="absolute top-[0vh] left-[10vw] w-[6vw] h-[15vh] bg-[#d9d9d9] flex flex-col justify-center items-center text-[2.5vh] font-medium leading-relaxed rounded-sm">
      <span>活動</span>
      <span>宣傳</span>
    </div>
    <main class="flex flex-col gap-[4vh] w-[40vw]">
      <button class="w-full h-[12vh] bg-[#d9d9d9] text-[2.8vh] font-medium hover:bg-gray-300 active:scale-98 transition-all flex justify-center items-center rounded-sm">
        開始遊戲
      </button>
      <button 
        @click="isProfileOpen = true"
        class="w-full h-[12vh] bg-[#d9d9d9] text-[2.8vh] font-medium hover:bg-gray-300 active:scale-98 transition-all flex justify-center items-center rounded-sm"
      >
        個人空間
      </button>
      <button class="w-full h-[12vh] bg-[#d9d9d9] text-[2.8vh] font-medium hover:bg-gray-300 active:scale-98 transition-all flex justify-center items-center rounded-sm">
        商城/抽卡
      </button>
    </main>
    <div 
      v-if="isProfileOpen" 
      class="absolute inset-0 bg-black/40 flex justify-center items-center z-50 animate-fade-in"
    >
      <div class="relative w-[75vw] h-[75vh] flex gap-[3vw] p-4 items-end">
        <div class="w-[22vw] h-full bg-[#d9d9d9] rounded-sm flex flex-col items-center pt-[6vh] px-4 gap-[3vh]">
          <div class="w-[12vw] h-[12vw] max-w-[120px] max-h-[120px] bg-gray-400 rounded-full shadow-inner"></div>
          <div class="w-full flex flex-col gap-[3vh]">
            <div class="w-full h-[4vh] bg-gray-400 rounded-sm"></div>
            <div class="w-full h-[4vh] bg-gray-400 rounded-sm"></div>
            <div class="w-full h-[4vh] bg-gray-400 rounded-sm"></div>
          </div>
        </div>
        <div class="flex-1 h-full flex flex-col relative">
          <button 
            @click="isProfileOpen = false"
            class="absolute -top-[1vh] -right-[1vw] text-[6vh] font-light text-black hover:text-gray-600 transition-colors z-10 line-height-none flex items-center justify-center w-[6vh] h-[6vh]"
          >
            ×
          </button>
          <div class="flex gap-[1vw] pl-[1vw]">
            <button class="w-32 px-[2vw] py-[1vh] bg-[#d9d9d9] text-[2.2vh] font-medium rounded-t-sm border-b-2 border-[#d9d9d9]">
              好友列表
            </button>
            <button class="w-32 px-[2vw] py-[1vh] bg-[#d9d9d9] text-[2.2vh] font-medium rounded-t-sm">
              造型庫
            </button>
            <button class="w-32 px-[2vw] py-[1vh] bg-[#d9d9d9] text-[2.2vh] font-medium rounded-t-sm">
              對戰紀錄
            </button>
          </div>
          <div class="flex-1 bg-[#d9d9d9] rounded-sm shadow-md"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.15s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>