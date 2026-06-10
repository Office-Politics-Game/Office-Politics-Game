<script setup>
  import matchIcon from '@/assets/images/icon-match.png';
  import joinIcon from '@/assets/images/icon-join.png';
  import createIcon from '@/assets/images/icon-create.png';
  import waitingRoomOne from '@/assets/images/waiting-room-1.png';
  import waitingRoomTwo from '@/assets/images/waiting-room-2.png';
  import waitingRoomThree from '@/assets/images/waiting-room-3.png';

  const roomActions = [
    {
      title: '開始配對',
      description: ['快速匹配玩家', '開始職場對局'],
      icon: matchIcon,
      paper: waitingRoomOne,
      alt: '尋找玩家圖示'
    },
    {
      title: '加入房間',
      description: ['輸入房間代號', '加入好友對局'],
      icon: joinIcon,
      paper: waitingRoomTwo,
      alt: '文件夾板圖示'
    },
    {
      title: '建立房間',
      description: ['自訂專屬房間', '邀請好友加入'],
      icon: createIcon,
      paper: waitingRoomThree,
      alt: '辦公大樓圖示'
    }
  ];
</script>

<template>
  <div class="waiting-room-menu pointer-events-none absolute inset-0" aria-label="遊戲入口選單">
    <div
      v-for="action in roomActions"
      :key="action.title"
      class="waiting-room-item pointer-events-auto absolute"
    >
      <img
        class="waiting-room-paper pointer-events-none absolute inset-0 h-full w-full object-contain"
        :src="action.paper"
        alt=""
        aria-hidden="true"
      />

      <button
        class="waiting-room-button absolute border-0 bg-transparent p-0 text-center"
        type="button"
        :aria-label="action.title"
      >
        <span class="waiting-room-content pointer-events-none flex h-full w-full flex-col items-center text-[#282623]">
          <img
            class="waiting-room-icon object-contain mix-blend-multiply contrast-125"
            :src="action.icon"
            :alt="action.alt"
          />

          <span class="waiting-room-copy block w-full">
            <span class="waiting-room-title block font-black leading-none text-[#2d2b29]">
              {{ action.title }}
            </span>
            <span class="waiting-room-desc block font-sans font-bold leading-relaxed text-[#3d3934]">
              <span v-for="line in action.description" :key="line" class="block">{{ line }}</span>
            </span>
          </span>

          <span class="waiting-room-rule flex items-center">
            <span class="waiting-room-line flex-1"></span>
            <span class="waiting-room-arrow rotate-45 bg-transparent"></span>
          </span>
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
  .waiting-room-item {
    --hover-y: 0px;
    --room-line-color: #1f5fc2;
    left: 20.55%;
    top: 46.7%;
    aspect-ratio: 520 / 820;
    height: 66%;
    transform: translate(-50%, calc(-50% + var(--hover-y)));
    transition:
      transform 180ms ease,
      filter 180ms ease;
  }

  .waiting-room-item:nth-child(2) {
    --room-line-color: #1f6f48;
    left: 50%;
  }

  .waiting-room-item:nth-child(3) {
    --room-line-color: #c51f28;
    left: 79.45%;
  }

  .waiting-room-item:hover,
  .waiting-room-item:focus-within {
    --hover-y: -2px;
    filter: drop-shadow(0 12px 18px rgba(0, 70, 244, 0.22));
  }

  .waiting-room-item:active {
    --hover-y: 2px;
    filter: drop-shadow(0 8px 14px rgba(70, 85, 99, 0.24));
  }

  .waiting-room-button {
    left: 8.1%;
    top: 35%;
    width: 83.8%;
    height: 41%;
    cursor: pointer;
    outline: 0;
  }

  .waiting-room-button:focus-visible {
    box-shadow: 0 0 0 4px var(--brand-focus, rgba(0, 70, 244, 0.24));
  }

  .waiting-room-content {
    height: auto;
    max-height: 100%;
    gap: clamp(4px, 1.2svh, 7px);
    justify-content: flex-start;
  }

  .waiting-room-icon {
    width: clamp(34px, 9.4svh, 48px);
    height: clamp(34px, 9.4svh, 48px);
    flex: 0 0 auto;
  }

  .waiting-room-title {
    font-family: var(--font-sans, Inter, "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", Arial, sans-serif);
    font-size: clamp(18px, 6.2svh, 24px);
    transition:
      color 180ms ease,
      text-shadow 180ms ease;
  }

  .waiting-room-desc {
    margin-top: clamp(4px, 1.2svh, 7px);
    font-size: clamp(11px, 3.2svh, 14px);
    transition: color 180ms ease;
  }

  .waiting-room-rule {
    width: 70%;
    margin-top: clamp(5px, 1.4svh, 8px);
  }

  .waiting-room-line {
    height: 2px;
  }

  .waiting-room-arrow {
    width: clamp(6px, 1.8svh, 9px);
    height: clamp(6px, 1.8svh, 9px);
    margin-left: -5px;
    border-top: 2px solid var(--room-line-color);
    border-right: 2px solid var(--room-line-color);
  }

  .waiting-room-line,
  .waiting-room-arrow {
    background-color: var(--room-line-color);
    transition:
      background-color 180ms ease,
      border-color 180ms ease;
  }

  .waiting-room-item:hover .waiting-room-title,
  .waiting-room-item:focus-within .waiting-room-title {
    color: var(--brand-hover, #0046f4);
    text-shadow: 0 2px 0 rgba(255, 255, 255, 0.6);
  }

  .waiting-room-item:hover .waiting-room-desc,
  .waiting-room-item:focus-within .waiting-room-desc {
    color: var(--brand-hover, #0046f4);
  }

  .waiting-room-item:hover .waiting-room-line,
  .waiting-room-item:hover .waiting-room-arrow,
  .waiting-room-item:focus-within .waiting-room-line,
  .waiting-room-item:focus-within .waiting-room-arrow {
    --room-line-color: var(--brand-hover, #0046f4);
  }

  .waiting-room-item:active .waiting-room-title,
  .waiting-room-item:active .waiting-room-desc {
    color: var(--brand-active, #465563);
  }

  .waiting-room-item:active .waiting-room-line,
  .waiting-room-item:active .waiting-room-arrow {
    --room-line-color: var(--brand-active, #465563);
  }

  @media (min-width: 768px) {
    .waiting-room-item {
      top: 46.4%;
      height: 68%;
    }

    .waiting-room-button {
      top: 35%;
      height: 41%;
    }

    .waiting-room-content {
      gap: clamp(5px, 0.9svh, 9px);
    }

    .waiting-room-icon {
      width: clamp(52px, 7svh, 68px);
      height: clamp(52px, 7svh, 68px);
    }

    .waiting-room-title {
      font-size: clamp(25px, 3.7svh, 33px);
    }

    .waiting-room-desc {
      margin-top: clamp(6px, 1svh, 10px);
      font-size: clamp(13px, 1.8svh, 17px);
    }

    .waiting-room-rule {
      margin-top: clamp(6px, 1svh, 10px);
    }
  }

  @media (min-width: 1024px) {
    .waiting-room-item {
      top: 46.4%;
      height: 69%;
    }

    .waiting-room-button {
      top: 33%;
      height: 44%;
    }

    .waiting-room-content {
      gap: clamp(6px, 1svh, 12px);
    }

    .waiting-room-icon {
      width: clamp(70px, 8svh, 92px);
      height: clamp(70px, 8svh, 92px);
    }

    .waiting-room-title {
      font-size: clamp(34px, 4.3svh, 46px);
    }

    .waiting-room-desc {
      margin-top: clamp(8px, 1.2svh, 14px);
      font-size: clamp(15px, 1.8svh, 19px);
    }

    .waiting-room-rule {
      margin-top: clamp(8px, 1.2svh, 14px);
    }
  }

  @media (orientation: landscape) and (max-height: 500px) {
    .waiting-room-item {
      top: 46.6%;
      height: 67%;
    }

    .waiting-room-button {
      top: 35%;
      height: 40%;
    }

    .waiting-room-content {
      gap: clamp(4px, 1svh, 6px);
    }

    .waiting-room-icon {
      width: clamp(34px, 8.8svh, 44px);
      height: clamp(34px, 8.8svh, 44px);
    }

    .waiting-room-title {
      font-size: clamp(18px, 5.5svh, 22px);
    }

    .waiting-room-desc {
      margin-top: clamp(3px, 0.9svh, 6px);
      font-size: clamp(10px, 2.7svh, 12px);
    }

    .waiting-room-rule {
      margin-top: clamp(4px, 1.1svh, 7px);
    }
  }
</style>
