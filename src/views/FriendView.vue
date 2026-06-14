<template>
  <div
    class="w-screen h-screen p-2 md:p-0 bg-cover bg-center flex items-center justify-center overflow-hidden"
    :style="{ backgroundImage: `url(${BG_Personal})` }"
  >
    <!-- 白色面板 -->
    <div
      class="relative w-[90vw] h-[86vh] md:w-[92vw] md:h-[86vh] md:max-w-[900px] md:max-h-[500px] bg-cover bg-center rounded-xl overflow-hidden"
      :style="{ backgroundImage: `url(${WaitingRoom})` }"
    >
      <!-- 關閉 -->
      <button
        class="absolute top-3 right-4 md:top-5 md:right-5 text-2xl md:text-3xl text-gray-600 hover:text-black z-20"
        @click="$router.push('/lobby')"
      >
        ×
      </button>

      <div class="flex h-full">
        <!-- 左側 -->
        <div
          class="w-[24%] md:w-[25%] border-r border-gray-200 flex flex-col items-center p-3 md:p-4"
        >
          <!-- 頭像 -->
          <img
            src="@/assets/images/player-1.png"
            class="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover"
          />

          <h2 class="mt-2 md:mt-3 text-base md:text-lg font-bold">CEO小陳</h2>

          <div class="text-gray-500 text-xs md:text-sm">👑 稱號</div>

          <!-- 等級 -->
          <div class="w-full mt-2 ml-3 md:mt-8">
            <div class="flex justify-between text-xs md:text-sm">
              <span>等級 12</span>
            </div>

            <div class="h-1.5 md:h-2 bg-gray-200 rounded-full mt-2">
              <div class="h-full bg-slate-600 rounded-full w-[65%]"></div>
            </div>

            <div class="text-center text-[11px] md:text-xs mt-2 text-gray-500">
              3,250 / 5,000 XP
            </div>
          </div>

          <!-- 功能選單 -->
          <div class="w-full ml-3 md:mt-8 space-y-2">
            <button class="menu-item">個人資料</button>

            <button class="menu-item">成就徽章</button>

            <button class="menu-item">遊戲統計</button>
          </div>
        </div>

        <!-- 右側 -->
        <div class="flex-1 p-3 md:p-4 flex flex-col min-h-0">
          <div class="flex border-b shrink-0">
            <button class="tab active">好友列表</button>

            <button class="tab">邀請區</button>

            <button class="tab">對戰紀錄</button>
          </div>

          <!-- 好友列表 -->
          <div class="flex-1 overflow-y-auto pr-2">
            <div class="mt-4 md:mt-6">
              <h3 class="font-bold text-gray-700 text-sm md:text-base">
                線上好友 (2)
              </h3>

              <FriendItem name="數據艾米" status="在線上" />
              <FriendItem name="策略大雄" status="在線上" />
            </div>

            <div class="mt-4 md:mt-6">
              <h3 class="font-bold text-gray-700 text-sm md:text-base">
                離線好友 (5)
              </h3>

              <FriendItem name="設計花花" status="離線 2 小時" />
              <FriendItem name="行銷阿哲" status="離線 1 天" />
              <FriendItem name="工程阿凱" status="離線 3 天" />
            </div>

            <div class="flex justify-center my-4 md:mt-6">
              <button
                class="px-6 py-1.5 md:px-10 md:py-2 border rounded-[4px] bg-gray-100 hover:bg-gray-200 text-sm md:text-base"
              >
                查看全部好友
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import BG_Personal from "@/assets/images/bg-personal.webp";
import WaitingRoom from "@/assets/images/waiting-room.webp";
import FriendItem from "@/components/menu/FriendItem.vue";
</script>

<style scoped>
@reference "tailwindcss";

.menu-item {
  @apply w-full bg-gray-100 hover:bg-gray-200 rounded-[4px] px-4 py-2 text-sm text-center md:px-4 md:py-3 md:text-base;
}

.tab {
  @apply px-4 py-2 text-gray-500 text-sm md:px-6 md:py-2 md:text-sm;
}

.active {
  @apply border-b-2 border-gray-800 text-black font-bold;
}
</style>
