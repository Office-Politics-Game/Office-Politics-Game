<script setup>
import {
  ArrowLeft,
  Copy,
  Play,
  Settings,
} from '@lucide/vue';
// import InviteFriendModal from '@/components/gameRoom/InviteFriendModal.vue';
import CustomRoomPlayerList from '@/components/gameRoom/CustomRoomPlayerList.vue';
import customRoomBackground from '../assets/images/custom-room-bg.png';

// defineProps({
//   modalPreview: {
//     type: String,
//     default: 'none',
//     validator: (value) => ['none', 'invite-friend'].includes(value),
//   },
// });

const roomId = 'JO7K3L';

const playerSlots = [
  {
    isHost: true,
    option1: '玩家ID',
  },
  {
    isHost: false,
    option1: '加入電腦',
    option2: '邀請好友',
  },
  {
    isHost: false,
    option1: '加入電腦',
    option2: '邀請好友',
  },
  {
    isHost: false,
    option1: '加入電腦',
    option2: '邀請好友',
  },
];
</script>

<template>
  <main class="flex h-[100svh] min-h-[100svh] w-screen items-center justify-center overflow-hidden p-0 text-stone-900">
    <section
      class="relative h-[100svh] w-screen overflow-hidden bg-cover bg-center"
      :style="{ backgroundImage: `url(${customRoomBackground})` }"
      aria-label="自訂遊戲局"
    >
      <button
        class="room-icon-button room-back-button pointer-events-auto absolute top-[5%] z-[3] grid aspect-square w-6 cursor-pointer place-items-center backdrop-blur"
        type="button"
        aria-label="返回"
      >
        <ArrowLeft :stroke-width="3.2" />
      </button>
      <button
        class="room-icon-button room-setting-button pointer-events-auto absolute top-[5%] z-[3] grid aspect-square w-6 cursor-pointer place-items-center backdrop-blur"
        type="button"
        aria-label="設定"
      >
        <Settings :stroke-width="3" />
      </button>
      <div class="room-id-badge absolute left-1/2 top-[8%] z-[2] flex w-[36%] min-w-[120px] -translate-x-1/2 items-center justify-center gap-2 px-2 py-1 font-black leading-none">
        <span>房間ID：</span>
        <span class="tracking-[0.08em]">{{ roomId }}</span>
        <Copy class="room-id-icon" :stroke-width="2.3" />
      </div>
      <CustomRoomPlayerList :slots="playerSlots" />
      <div class="room-action-area pointer-events-auto absolute bottom-[6%] left-1/2 z-10 grid w-[44%] -translate-x-1/2 grid-cols-2 gap-[16%]">
        <button class="room-action-button room-action-button-light pointer-events-auto flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap" type="button">
          返回大廳
        </button>
        <button class="room-action-button room-action-button-primary pointer-events-auto flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap" type="button">
          <Play class="room-action-icon fill-current" :stroke-width="2.4" />
          開始遊戲
        </button>
      </div>
      <!-- <InviteFriendModal v-if="modalPreview === 'invite-friend'" /> -->
    </section>
  </main>
</template>

<style scoped>
.room-icon-button {
  border: 1px solid var(--brand-primary, #86b3e0);
  border-radius: var(--radius-md, 0);
  background: var(--surface-glass, rgba(255, 255, 255, 0.3));
  color: var(--brand-active, #465563);
  box-shadow: 0 8px 22px rgba(0, 19, 50, 0.2);
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    background-color 180ms ease,
    box-shadow 180ms ease,
    color 180ms ease;
}

.room-icon-button:hover {
  transform: translateY(-2px);
  border-color: var(--brand-hover, #0046f4);
  background: var(--brand-hover, #0046f4);
  color: #ffffff;
  box-shadow: 0 10px 24px rgba(0, 70, 244, 0.24);
}

.room-icon-button:active {
  transform: translateY(1px);
  border-color: var(--brand-active, #465563);
  background: var(--brand-active, #465563);
  color: #ffffff;
  box-shadow: 0 6px 14px rgba(70, 85, 99, 0.24);
}

.room-icon-button:focus-visible {
  outline: 0;
  box-shadow: 0 0 0 4px var(--brand-focus, rgba(0, 70, 244, 0.24));
}

.room-icon-button svg {
  width: 48%;
  height: 48%;
}

.room-back-button {
  left: 4%;
}

.room-setting-button {
  right: 4%;
}

.room-id-badge {
  border: 1px solid rgba(211, 183, 131, 0.35);
  border-radius: var(--radius-md, 0);
  background: rgba(33, 26, 20, 0.92);
  color: #ead2a5;
  font-family: var(--font-sans, "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", Arial, sans-serif);
  font-size: 8px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.35);
}

.room-id-icon {
  width: 12px;
  height: 12px;
}

.room-action-button {
  height: clamp(16px, 5vw, 64px);
  gap: clamp(2px, 0.8vw, 8px);
  border: 1px solid var(--brand-primary, #86b3e0);
  border-radius: var(--radius-md, 0);
  background: var(--surface-glass, rgba(255, 255, 255, 0.3));
  color: var(--brand-active, #465563);
  font-family: var(--font-sans, "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", Arial, sans-serif);
  font-size: clamp(var(--text-sm, 14px), 2vw, 18px);
  font-weight: 700;
  line-height: 1;
  box-shadow: 0 10px 18px rgba(0, 19, 50, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.3);
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    background-color 180ms ease,
    box-shadow 180ms ease,
    color 180ms ease;
}

.room-action-button-light {
  background: var(--surface-glass, rgba(255, 255, 255, 0.3));
}

.room-action-button-primary {
  background: rgba(134, 179, 224, 0.34);
}

.room-action-button:hover {
  transform: translateY(-2px);
  border-color: var(--brand-hover, #0046f4);
  background: var(--brand-hover, #0046f4);
  color: #ffffff;
  box-shadow: 0 10px 24px rgba(0, 70, 244, 0.24);
}

.room-action-button:active {
  transform: translateY(1px);
  border-color: var(--brand-active, #465563);
  background: var(--brand-active, #465563);
  color: #ffffff;
  box-shadow: 0 6px 14px rgba(70, 85, 99, 0.24);
}

.room-action-button:focus-visible {
  outline: 0;
  box-shadow: 0 0 0 4px var(--brand-focus, rgba(0, 70, 244, 0.24));
}

.room-action-icon {
  width: clamp(8px, 2.2vw, 28px);
  height: clamp(8px, 2.2vw, 28px);
}

@media (max-width: 767px) {
  .room-icon-button,
  .room-id-badge,
  .room-action-button {
    border-radius: 4px;
  }
}

@media (min-width: 768px) {
  .room-icon-button {
    top: 6%;
    width: 44px;
  }

  .room-id-badge {
    top: 9%;
    width: 34%;
    min-width: 220px;
    font-size: 18px;
    padding: 8px 16px;
  }

  .room-id-icon {
    width: 20px;
    height: 20px;
  }
}

@media (min-width: 1024px) {
  .room-icon-button {
    width: 56px;
  }

  .room-id-badge {
    font-size: 24px;
  }

  .room-action-button {
    font-size: 15px;
  }
}

@media (orientation: landscape) and (max-height: 500px) {
  .room-icon-button,
  .room-id-badge {
    border-radius: 4px;
  }

  .room-icon-button {
    top: 4%;
    width: clamp(24px, 6vh, 32px);
  }

  .room-id-badge {
    top: 6%;
    min-width: 150px;
    padding: 4px 8px;
    font-size: clamp(10px, 2.4vw, 14px);
  }

  .room-id-icon {
    width: clamp(12px, 3vw, 16px);
    height: clamp(12px, 3vw, 16px);
  }

  .room-action-area {
    bottom: 5%;
    width: 44%;
    gap: 14%;
  }

  .room-action-button {
    height: clamp(28px, 8vh, 36px);
    font-size: clamp(12px, 2.6vw, 15px);
  }

  .room-action-icon {
    width: clamp(12px, 3vw, 16px);
    height: clamp(12px, 3vw, 16px);
  }
}
</style>
