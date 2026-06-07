<script setup>
    import { Crown } from '@lucide/vue';
    import gameRoomBackground from '@/assets/image/game-room-bg.jpg';
    import matchIcon from '@/assets/image/icon-match.png';
    import joinIcon from '@/assets/image/icon-join.png';
    import createIcon from '@/assets/image/icon-create.png';

    const lobbyEntries = [
            {
                title: "開始配對",
                description: ["快速匹配玩家", "開始職場對局"],
                icon: matchIcon,
                alt:"尋找玩家圖示"
            },
            {
                title: "加入房間",
                description: ["輸入房間代號", "加入好友對局"],
                icon: joinIcon,
                alt:"文件夾板圖示"
            },
            {
                title: "建立房間",
                description: ["自訂專屬房間", "邀請好友加入"],
                icon: createIcon,
                alt:"辦公大樓圖示"
            }
        ]
</script>

<template>
  <main class="game-view">
    <section
      class="lobby-stage game-stage relative overflow-hidden text-[#282623]"
      :style="{ backgroundImage: `url(${gameRoomBackground})` }"
      aria-label="職場風雲橫向遊戲房間"
    >
      <div class="absolute inset-x-[18%] top-0 h-[28%] bg-[radial-gradient(circle_at_center,rgba(255,235,196,0.72),rgba(255,235,196,0)_70%)]"></div>
      <header class="lobby-title-area absolute text-center">
        <div class="lobby-brand-mark mx-auto flex items-center justify-center">
          <span class="h-px flex-1 bg-[#3b342d]/55"></span>
          <Crown class="lobby-crown fill-[#2e2924] stroke-[#2e2924]" :stroke-width="1.6" />
          <span class="h-px flex-1 bg-[#3b342d]/55"></span>
        </div>
        <h1 class="lobby-title font-display font-black leading-none tracking-normal text-[#292522]">
          職場風雲
        </h1>
        <div class="lobby-subtitle flex items-center justify-center font-display font-bold text-[#3a332b]">
          <span class="h-px bg-[#54483a]/55"></span>
          <span>升職之路・由你決定</span>
          <span class="h-px bg-[#54483a]/55"></span>
        </div>
      </header>

      <section class="absolute inset-0" aria-label="遊戲入口">
        <button
          v-for="entry in lobbyEntries"
          :key="entry.title"
          class="lobby-entry-card group absolute text-center transition duration-200 active:translate-y-[2px]"
          type="button"
        >
          <img
            class="lobby-entry-icon pointer-events-none absolute object-contain mix-blend-multiply contrast-125"
            :src="entry.icon"
            :alt="entry.alt"
          />

          <span class="lobby-entry-content pointer-events-none absolute block">
            <span class="lobby-entry-title block font-display font-black leading-none text-[#2d2b29]">
              {{ entry.title }}
            </span>
            <span class="lobby-entry-desc block font-sans font-bold leading-relaxed text-[#605548]">
              <span v-for="line in entry.description" :key="line" class="block">{{ line }}</span>
            </span>
          </span>

          <span class="lobby-entry-rule pointer-events-none absolute flex items-center">
            <span class="lobby-entry-line flex-1"></span>
            <span class="lobby-entry-arrow rotate-45 bg-transparent"></span>
          </span>
        </button>
      </section>
    </section>
  </main>
</template>

<style>
  .preview-section {
    padding: 8px 0;
  }

  .game-view {
    display: flex;
    width: 100%;
    min-height: auto;
    align-items: flex-start;
    justify-content: center;
  }

  .game-stage {
    aspect-ratio: 16 / 9;
    width: 100%;
    max-width: 100vw;
    background-size: 100% 100%;
    background-position: center center;
  }

  .lobby-stage {
    aspect-ratio: 16 / 9;
    background-position: center center;
  }

  .lobby-title-area {
    left: 50%;
    top: 4%;
    width: 44%;
    transform: translateX(-50%);
  }

  .lobby-brand-mark {
    width: 30%;
    min-width: 48px;
    height: 8px;
  }

  .lobby-crown {
    width: 18px;
    height: 18px;
    margin: 0 8px;
  }

  .lobby-title {
    font-size: 24px;
    text-shadow: 0 2px 0 rgba(255, 235, 200, 0.25);
  }

  .lobby-subtitle {
    margin-top: 2px;
    gap: 4px;
    font-size: clamp(8px, 2vw, 20px);
  }

  .lobby-subtitle span:first-child,
  .lobby-subtitle span:last-child {
    width: 18px;
  }

  .lobby-entry-card {
    left: 13.2%;
    top: 37%;
    width: 22.6%;
    height: 55%;
    border: 0;
    background: transparent;
    box-shadow: none;
    transform: rotate(-0.2deg);
  }

  .lobby-entry-card:nth-child(2) {
    left: 38.4%;
    transform: rotate(0.2deg);
  }

  .lobby-entry-card:nth-child(3) {
    left: 63.4%;
    transform: rotate(-0.2deg);
  }

  .lobby-entry-icon {
    top: 18%;
    left: 50%;
    width: 36%;
    transform: translateX(-50%);
  }

  .lobby-entry-content {
    top: 48%;
    left: 50%;
    width: 82%;
    transform: translateX(-50%);
    font-size: 6px;
  }

  .lobby-entry-title {
    font-size: 12px;
  }

  .lobby-entry-desc {
    margin-top: 6px;
  }

  .lobby-entry-rule {
    bottom: 8%;
    left: 50%;
    width: 66%;
    transform: translateX(-50%);
  }

  .lobby-entry-line {
    height: 2px;
  }

  .lobby-entry-arrow {
    width: 6px;
    height: 6px;
    margin-left: -4px;
    border-right-width: 2px;
    border-top-width: 2px;
  }

  .lobby-entry-line,
  .lobby-entry-arrow {
    background-color: #1f607f;
    border-color: #1f607f;
  }

  .lobby-entry-card:nth-child(2) .lobby-entry-line,
  .lobby-entry-card:nth-child(2) .lobby-entry-arrow {
    background-color: #2a694c;
    border-color: #2a694c;
  }

  .lobby-entry-card:nth-child(3) .lobby-entry-line,
  .lobby-entry-card:nth-child(3) .lobby-entry-arrow {
    background-color: #963026;
    border-color: #963026;
  }

@media (min-width: 768px) {
  .preview-section {
    padding: 24px 0;
  }

  .game-view {
    min-height: auto;
    align-items: flex-start;
    padding: 24px;
  }

  .game-stage {
    width: min(100%, calc(100svh * 16 / 9));
    max-width: 1024px;
  }

  .lobby-title-area {
    top: 4%;
    width: 42%;
  }

  .lobby-brand-mark {
    width: 28%;
    min-width: 96px;
    height: 20px;
  }

  .lobby-crown {
    width: 32px;
    height: 32px;
    margin: 0 12px;
  }

  .lobby-title {
    font-size: 48px;
  }

  .lobby-subtitle {
    margin-top: 6px;
    gap: 8px;
  }

  .lobby-subtitle span:first-child,
  .lobby-subtitle span:last-child {
    width: 40px;
  }

  .lobby-entry-content {
    font-size: 12px;
  }

  .lobby-entry-title {
    font-size: 28px;
  }

  .lobby-entry-desc {
    margin-top: 16px;
  }

  .lobby-entry-rule {
    width: 72%;
  }

  .lobby-entry-arrow {
    width: 10px;
    height: 10px;
  }
}

@media (min-width: 1024px) {
  .preview-section {
    padding: 32px 0;
  }

  .game-view {
    padding: 32px;
  }

  .game-stage {
    max-width: 1280px;
  }

  .lobby-title-area {
    top: 4%;
    width: 40%;
  }

  .lobby-brand-mark {
    min-width: 128px;
    height: 30px;
  }

  .lobby-crown {
    width: 40px;
    height: 40px;
  }

  .lobby-title {
    font-size: 64px;
  }

  .lobby-entry-content {
    font-size: 16px;
  }

  .lobby-entry-title {
    font-size: 40px;
  }
}
</style>