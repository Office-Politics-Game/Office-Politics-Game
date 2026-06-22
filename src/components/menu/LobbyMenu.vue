<template>
  <section
    class="relative h-81 w-144 bg-[length:100%_100%] bg-center shadow-2xl lg:h-135 lg:w-240"
    :style="{ backgroundImage: `url(${menuBg})` }"
  >
    <!-- 開始遊玩 -->
    <button
      class="menu-btn left-[35px] top-[32px] h-[244px] w-[170px] gap-6 lg:left-[58px] lg:top-[53px] lg:h-[407px] lg:w-[283px]"
      @click="$router.push({ name: 'LobbyGameMenu' })"
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

    <!-- 個人區域 -->
    <button
      class="menu-btn left-[212px] top-[32px] h-[148px] w-[220px] lg:left-[353px] lg:top-[53px] lg:h-[247px] lg:w-[367px]"
      @click="$router.push('/friend')"
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

    <!-- 社交 -->
    <button
      class="menu-btn right-[40px] top-[32px] h-[88px] w-[96px] lg:right-[67px] lg:top-[53px] lg:h-[147px] lg:w-[160px]"
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

    <!-- 設定 -->
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

    <!-- 招募 -->
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

    <!-- 商城 -->
    <button
      class="menu-btn left-[314px] bottom-[47px] h-[90px] w-[86px] lg:left-[523px] lg:bottom-[79px] lg:h-[150px] lg:w-[143px]"
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

    <!-- 打卡下班 -->
    <button
      class="menu-btn right-[40px] bottom-[47px] h-[74px] w-[130px] lg:right-[67px] lg:bottom-[79px] lg:h-[124px] lg:w-[217px]"
      @click="$router.push('/')"
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
</template>

<script setup>
import menuBg from "@/assets/images/menu.webp";
</script>

<style scoped>
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
</style>
