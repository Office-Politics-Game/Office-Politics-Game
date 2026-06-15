<script setup>
  import { UserPlus } from '@lucide/vue';
  import waitingRoomPlayer from '@/assets/images/waiting-room-player.png';

  defineProps({
    slots: {
      type: Array,
      required: true,
    },
  });
</script>

<template>
  <section class="custom-room-player-list pointer-events-none absolute" aria-label="玩家席位">
    <div class="custom-room-player-row absolute flex items-center justify-center">
      <article
        v-for="(slot, index) in slots"
        :key="`${slot.option1}-${index}`"
        class="room-player-slot pointer-events-auto relative"
        :class="{ 'room-player-slot--host': slot.isHost }"
      >
        <img
          class="room-player-paper pointer-events-none absolute inset-0 h-full w-full object-contain"
          :src="waitingRoomPlayer"
          alt=""
          aria-hidden="true"
        />

        <div class="room-player-safe-zone absolute flex flex-col items-center justify-center text-center">
          <UserPlus class="room-player-avatar" :stroke-width="1.9" />

          <div v-if="slot.isHost" class="room-host-info flex w-full flex-col items-center">
            <p class="room-host-label">房主</p>
            <p class="room-player-title">{{ slot.option1 }}</p>
          </div>

          <div v-else class="room-player-options flex w-full flex-col items-center">
            <button class="room-player-option-button" type="button">{{ slot.option1 }}</button>
            <button v-if="slot.option2" class="room-player-option-button" type="button">
              {{ slot.option2 }}
            </button>
          </div>

          <button v-if="!slot.isHost" class="room-ready-button" type="button">準備中</button>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
  .custom-room-player-list {
    inset: 0;
    z-index: 2;
  }

  .custom-room-player-row {
    top: 52%;
    left: 50%;
    width: 86%;
    height: 60%;
    gap: 0.42%;
    transform: translate(-50%, -50%);
  }

  .room-player-slot {
    aspect-ratio: 979 / 1606;
    height: 100%;
    flex: 0 0 auto;
    color: #2c2925;
  }

  .room-player-safe-zone {
    left: 10%;
    top: 20%;
    width: 80%;
    height: 70%;
    color: #2c2925;
  }

  .room-player-avatar {
    width: clamp(22px, 9svh, 34px);
    height: clamp(22px, 9svh, 34px);
    flex: 0 0 auto;
    color: #6e6a60;
  }

  .room-host-info,
  .room-player-options {
    margin-top: clamp(8px, 2.6svh, 12px);
    gap: clamp(6px, 1.8svh, 9px);
  }

  .room-host-label {
    margin: 0;
    color: #1f607f;
    font-family: var(--font-sans, "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", Arial, sans-serif);
    font-size: clamp(8px, 2.6svh, 11px);
    font-weight: 900;
    line-height: 1;
  }

  .room-player-title,
  .room-player-option-button {
    margin: 0;
    width: 100%;
    border: 0;
    border-radius: var(--radius-md, 0);
    background: transparent;
    color: #2c2925;
    font-family: var(--font-sans, "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", Arial, sans-serif);
    font-size: clamp(10px, 3.4svh, 14px);
    font-weight: 900;
    line-height: 1.12;
    text-align: center;
    white-space: nowrap;
  }

  .room-player-option-button {
    cursor: pointer;
    transition:
      color 180ms ease,
      opacity 180ms ease,
      transform 180ms ease;
  }

  .room-player-option-button:hover {
    color: #1f607f;
    opacity: 0.92;
    transform: translateY(-1px);
  }

  .room-player-option-button:active {
    color: var(--brand-active, #465563);
    transform: translateY(1px);
  }

  .room-player-option-button:focus-visible {
    outline: 0;
    box-shadow: 0 0 0 4px var(--brand-focus, rgba(0, 70, 244, 0.24));
  }

  .room-ready-button {
    position: relative;
    z-index: 1;
    margin-top: clamp(10px, 3svh, 16px);
    align-self: center;
    border: 1px solid rgba(244, 223, 184, 0.38);
    border-radius: 4px;
    background: rgba(51, 40, 30, 0.94);
    padding: clamp(4px, 1.1svh, 6px) clamp(10px, 2.4svh, 14px);
    color: #f4dfb8;
    font-family: var(--font-sans, "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", Arial, sans-serif);
    font-size: clamp(8px, 2.5svh, 11px);
    font-weight: 900;
    line-height: 1;
    pointer-events: auto;
    cursor: pointer;
    transition:
      transform 180ms ease,
      border-color 180ms ease,
      background-color 180ms ease,
      box-shadow 180ms ease,
      color 180ms ease;
  }

  .room-ready-button:hover {
    transform: translateY(-2px);
    border-color: rgba(244, 223, 184, 0.64);
    background: rgba(64, 50, 37, 0.98);
    color: #fff1cf;
    box-shadow: 0 10px 18px rgba(15, 11, 7, 0.34);
  }

  .room-ready-button:active {
    transform: translateY(1px);
    border-color: rgba(244, 223, 184, 0.5);
    background: rgba(43, 34, 26, 0.98);
    color: #f4dfb8;
    box-shadow: 0 6px 12px rgba(15, 11, 7, 0.28);
  }

  .room-ready-button:focus-visible {
    outline: 0;
    box-shadow: 0 0 0 4px var(--brand-focus, rgba(0, 70, 244, 0.24));
  }

  @media (min-width: 768px) {
    .custom-room-player-row {
      width: 84%;
      height: 60%;
      gap: 0.36%;
    }

    .room-player-avatar {
      width: clamp(42px, 6svh, 54px);
      height: clamp(42px, 6svh, 54px);
    }

    .room-host-info,
    .room-player-options {
      margin-top: clamp(14px, 2.1svh, 20px);
      gap: clamp(8px, 1.2svh, 12px);
    }

    .room-host-label {
      font-size: clamp(12px, 1.7svh, 15px);
    }

    .room-player-title,
    .room-player-option-button {
      font-size: clamp(16px, 2.2svh, 22px);
    }

    .room-ready-button {
      margin-top: clamp(18px, 2.7svh, 28px);
      padding: clamp(6px, 0.9svh, 9px) clamp(14px, 1.8svh, 20px);
      font-size: clamp(11px, 1.4svh, 14px);
    }
  }

  @media (min-width: 1024px) {
    .custom-room-player-row {
      width: 84%;
      height: 60%;
      gap: 0.32%;
    }

    .room-player-avatar {
      width: clamp(52px, 6.2svh, 76px);
      height: clamp(52px, 6.2svh, 76px);
    }

    .room-host-info,
    .room-player-options {
      margin-top: clamp(18px, 2.2svh, 30px);
      gap: clamp(10px, 1.2svh, 18px);
    }

    .room-host-label {
      font-size: clamp(14px, 1.6svh, 16px);
    }

    .room-player-title,
    .room-player-option-button {
      font-size: clamp(20px, 2.4svh, 32px);
    }

    .room-ready-button {
      margin-top: clamp(24px, 3svh, 34px);
      padding: clamp(7px, 0.9svh, 10px) clamp(16px, 1.8svh, 22px);
      font-size: clamp(12px, 1.4svh, 16px);
    }
  }

  @media (orientation: landscape) and (max-height: 500px) {
    .custom-room-player-row {
      top: 52%;
      height: 60%;
      gap: 0.42%;
    }

    .room-player-avatar {
      width: clamp(22px, 9svh, 34px);
      height: clamp(22px, 9svh, 34px);
    }

    .room-host-info,
    .room-player-options {
      margin-top: clamp(8px, 2.6svh, 12px);
      gap: clamp(6px, 1.8svh, 9px);
    }

    .room-host-label {
      font-size: clamp(8px, 2.6svh, 11px);
    }

    .room-player-title,
    .room-player-option-button {
      font-size: clamp(10px, 3.4svh, 14px);
    }

    .room-ready-button {
      margin-top: clamp(10px, 3svh, 16px);
      padding: clamp(4px, 1.1svh, 6px) clamp(10px, 2.4svh, 14px);
      font-size: clamp(8px, 2.5svh, 11px);
    }
  }
</style>
