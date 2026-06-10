<script setup>
    import gameRoomBackground from '@/assets/BG_Dashboard.jpg';
    import roomMenu from '@/assets/RoomMenu.png';
    import WaitingRoomMenu from '@/components/gameRoom/WaitingRoomMenu.vue';
</script>

<template>
  <main class="game-view">
    <section
      class="lobby-stage game-stage relative overflow-hidden text-[#282623]"
      :style="{ backgroundImage: `url(${gameRoomBackground})` }"
      aria-label="職場風雲橫向遊戲房間"
    >
      <section class="lobby-blueprint-frame absolute" aria-label="遊戲入口">
        <img
          class="pointer-events-none absolute inset-0 h-full w-full object-contain"
          :src="roomMenu"
          alt=""
          aria-hidden="true"
        />
        <WaitingRoomMenu />
      </section>
    </section>
  </main>
</template>

<style scoped>
  .game-view {
    display: flex;
    width: 100vw;
    height: 100svh;
    min-height: 100svh;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 0;
  }

  .game-stage {
    width: 100vw;
    height: 100svh;
    background-size: cover;
    background-position: center center;
  }

  .lobby-stage {
    background-position: center center;
  }

  .lobby-blueprint-frame {
    top: 50%;
    left: 50%;
    aspect-ratio: 3 / 2;
    height: min(73svh, calc(94vw * 2 / 3));
    max-height: 1024px;
    transform: translate(-50%, -50%);
  }

@media (min-width: 768px) {
  .lobby-blueprint-frame {
    height: min(73svh, calc(94vw * 2 / 3));
  }
}

@media (min-width: 1024px) {
  .lobby-blueprint-frame {
    height: min(73svh, calc(76vw * 2 / 3));
  }
}

@media (orientation: landscape) and (max-height: 500px) {
  .lobby-blueprint-frame {
    height: min(73svh, calc(94vw * 2 / 3));
  }
}
</style>
