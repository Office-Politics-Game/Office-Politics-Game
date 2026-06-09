<template>
  <main class="w-screen min-h-screen bg-[#1e1e1e] flex items-center justify-center overflow-hidden">
    <div
      class="relative w-full min-h-screen bg-cover bg-center flex items-center justify-center"
      :style="{ backgroundImage: `url(${bgDashboard})` }"
    >
      <div class="absolute inset-0 bg-black/45"></div>

      <section
        class="relative w-[80vw] max-w-[760px] aspect-[16/9] bg-[length:100%_100%] bg-center shadow-2xl"
        :style="{ backgroundImage: `url(${menuBg})` }"
      >
        <!-- 開始遊玩 -->
        <button class="menu-btn gap-6 left-[6%] top-[10%] w-[29.5%] h-[75%]">
          <img src="../assets/Icon_Card.png" alt="開始遊玩" class="w-[35%] h-auto object-contain" />
          <span class="text-[20px] font-bold tracking-wider">開始遊玩</span>
        </button>

        <!-- 個人區域 -->
        <button class="menu-btn left-[36.5%] top-[10%] w-[39%] h-[45.5%]">
          <img src="../assets/Icon_Personal.png" alt="個人區域" class="w-[20%] h-auto object-contain" />
          <span class="text-[20px] font-bold mt-2 tracking-wider">個人區域</span>
        </button>

        <!-- 社交 -->
        <button class="menu-btn left-[76%] top-[10%] w-[17.5%] h-[27%]">
          <img src="../assets/Icon_Social.png" alt="社交" class="w-[35%] h-auto object-contain" />
          <span class="text-[20px] font-bold mt-1 tracking-wider">社交</span>
        </button>

        <!-- 設定 -->
        <button class="menu-btn left-[76.3%] top-[39%] w-[17%] h-[22.5%]">
          <img src="../assets/Icon_Setting.png" alt="設定" class="w-[30%] h-auto object-contain" />
          <span class="text-[20px] font-bold mt-1 tracking-wider">設定</span>
        </button>

        <!-- 招募 -->
        <button class="menu-btn left-[36%] top-[57%] w-[18%] h-[28%]">
          <img src="../assets/Icon_Recruit.png" alt="招募" class="w-[32%] h-auto object-contain" />
          <span class="text-[18px] font-bold mt-1 tracking-wider">招募</span>
        </button>

        <!-- 商城 -->
        <button class="menu-btn left-[53%] top-[57%] w-[17%] h-[28%]">
          <img src="../assets/Icon_Mall.png" alt="商城" class="w-[32%] h-auto object-contain" />
          <span class="text-[18px] font-bold mt-1 tracking-wider">商城</span>
        </button>

        <!-- 打卡下班 -->
        <button class="menu-btn left-[70%] top-[62%] w-[23%] h-[23%]">
          <img src="../assets/Icon_Quit.png" alt="打卡下班" class="w-[23%] h-auto object-contain" />
          <span class="text-[16px] font-bold mt-1 tracking-wider">打卡下班</span>
        </button>
      </section>
    </div>
  </main>
</template>

<script setup>
import bgDashboard from '@/assets/BG_Dashboard.jpg'
import menuBg from '@/assets/Menu.png'
</script>

<style scoped>
.menu-btn {
  position: absolute;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
}

.menu-btn:hover {
  background-color: rgba(39, 35, 35, 0.12);
}
</style>