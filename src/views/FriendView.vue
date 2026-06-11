<template>
  <div
    class="w-screen h-screen bg-cover bg-center flex items-center justify-center"
    :style="{ backgroundImage: `url(${BG_Personal})` }"
  >
    <!-- 白色面板 -->
    <div
      class="relative w-[900px] h-[500px] bg-cover bg-center rounded-xl overflow-hidden"
      :style="{ backgroundImage: `url(${WaitingRoom})` }"
    >
      <!-- 關閉 -->
      <button
        class="absolute top-5 right-5 text-3xl text-gray-600 hover:text-black"
      >
        ×
      </button>

      <div class="flex h-full">
        <!-- 左側 -->
        <div
          class="w-[240px] border-r border-gray-200 flex flex-col items-center p-6"
        >
          <!-- 頭像 -->
          <img
            src="@/assets/Player_1.png"
            class="w-28 h-28 rounded-full object-cover"
          />
          <h2 class="mt-4 text-xl font-bold">
            CEO小陳
          </h2>
          <div class="text-gray-500 text-sm">
            👑 房主
          </div>
          <!-- 等級 -->
          <div class="w-full mt-8">
            <div class="flex justify-between text-sm">
              <span>等級 12</span>
            </div>
            <div class="h-2 bg-gray-200 rounded-full mt-2">
              <div
                class="h-full bg-slate-600 rounded-full w-[65%]"
              ></div>
            </div>
            <div class="text-center text-xs mt-2 text-gray-500">
              3,250 / 5,000 XP
            </div>
          </div>
          <!-- 功能選單 -->
          <div class="w-full mt-8 space-y-2">
            <button class="menu-item">
              個人資料
            </button>
            <button class="menu-item">
              成就徽章
            </button>
            <button class="menu-item">
              遊戲統計
            </button>
          </div>
        </div>

        <!-- 右側 -->
        <div class="flex-1 p-6 flex flex-col min-h-0">
          <div class="flex border-b">
            <button class="tab active">
              好友列表
            </button>
            <button class="tab">
              邀請區
            </button>
            <button class="tab">
              對戰紀錄
            </button>
          </div>
          <!-- 在線好友 -->
          <div class="flex-1 overflow-y-auto pr-2">
            <div class="mt-6">
              <h3 class="font-bold text-gray-700">
                線上好友 (2)
              </h3>
              <FriendItem
                name="數據艾米"
                status="在線上"
              />
              <FriendItem
                name="策略大雄"
                status="在線上"
              />
            </div>
            <!-- 離線好友 -->
            <div class="mt-6">
              <h3 class="font-bold text-gray-700">
                離線好友 (5)
              </h3>
              <FriendItem
                name="設計花花"
                status="離線 2 小時"
              />
              <FriendItem
                name="行銷阿哲"
                status="離線 1 天"
              />
              <FriendItem
                name="工程阿凱"
                status="離線 3 天"
              />
            </div>
            <!-- 底部按鈕 -->
            <div class="flex justify-center mt-6">
              <button
                class="px-10 py-2 border rounded-md bg-gray-100 hover:bg-gray-200"
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
import BG_Personal from '@/assets/BG_Personal.jpg'
import WaitingRoom from '@/assets/WaitingRoom.png'
import FriendItem from '@/components/menu/FriendItem.vue'
</script>

<style scoped>
@reference "tailwindcss";
.menu-item {
  @apply w-full bg-gray-100 hover:bg-gray-200 rounded-lg px-4 py-3 text-left;
}
.tab {
  @apply px-8 py-3 text-gray-500;
}
.active {
  @apply border-b-2 border-gray-800 text-black font-bold;
}
</style>