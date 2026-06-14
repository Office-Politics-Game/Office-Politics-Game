<script setup>
import { onMounted, ref } from "vue";
import { Copy, Play } from "@lucide/vue";
import PlayerList from "@/components/gameRoom/CustomRoomPlayerList.vue";
import { getRankingList } from "@/services/rankingService.js";
import BG from "@/assets/images/bg-dashboard.webp";

const roomId = "JO7K3L";
const availablePlayers = ref([]);

const emptyPlayerSlots = [
  {
    isHost: true,
    option1: "等待玩家",
  },
  {
    isHost: false,
    option1: "加入電腦",
    option2: "邀請好友",
  },
  {
    isHost: false,
    option1: "加入電腦",
    option2: "邀請好友",
  },
  {
    isHost: false,
    option1: "加入電腦",
    option2: "邀請好友",
  },
];

const playerSlots = ref(emptyPlayerSlots);

function createPlayerSlot(player, index) {
  return {
    id: player.id,
    isHost: index === 0,
    isReady: index !== 0,
    name: player.name,
    level: player.level,
    stars: player.stars,
    avatar: player.avatar,
  };
}

function createEmptySlot(index) {
  return { ...emptyPlayerSlots[index] };
}

function handleAddComputer(index) {
  if (index === 0) {
    return;
  }

  const player = availablePlayers.value.find(
    (candidate) => !playerSlots.value.some((slot) => slot.id === candidate.id),
  );

  if (!player) {
    return;
  }

  playerSlots.value[index] = createPlayerSlot(player, index);
}

function handleRemovePlayer(index) {
  if (index === 0) {
    return;
  }

  playerSlots.value[index] = createEmptySlot(index);
}

onMounted(async () => {
  const players = await getRankingList();
  availablePlayers.value = players;
  const occupiedSlots = players
    .slice(0, 3)
    .map((player, index) => createPlayerSlot(player, index));

  playerSlots.value = emptyPlayerSlots.map((slot, index) => ({
    ...slot,
    ...occupiedSlots[index],
  }));
});
</script>

<template>
  <main
    class="flex h-[100svh] min-h-[100svh] w-screen items-center justify-center overflow-hidden bg-cover bg-center bg-blend-multiply p-0 text-[var(--brand-active)]"
    :style="{
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      backgroundImage: `url(${BG})`,
    }"
  >
    <section
      class="flex h-90 w-600 flex-col items-center overflow-hidden pt-5 lg:h-170 lg:w-400 lg:pt-14"
      aria-label="自訂遊戲局"
    >
      <div
        class="flex w-52 items-center justify-center gap-2 text-sm font-bold leading-none text-white lg:w-80 lg:text-2xl"
      >
        <span>房間ID：</span>
        <span class="tracking-[0.08em]">{{ roomId }}</span>
        <Copy class="h-4 w-4 lg:h-5 lg:w-5" :stroke-width="2.3" />
      </div>
      <PlayerList
        :slots="playerSlots"
        @add-computer="handleAddComputer"
        @remove-player="handleRemovePlayer"
        class="mt-3 lg:mt-5"
      />
      <div
        class="pointer-events-auto mt-5 grid w-72 grid-cols-2 gap-3 lg:mt-10 lg:w-[416px] lg:gap-8"
      >
        <button
          class="btn-glass tap-pop pointer-events-auto flex h-9 cursor-pointer items-center justify-center overflow-hidden text-sm lg:h-12 lg:text-base"
          type="button"
        >
          返回大廳
        </button>
        <button
          class="btn-dark tap-pop pointer-events-auto flex h-9 cursor-pointer items-center justify-center gap-2 overflow-hidden text-sm font-bold lg:h-12 lg:text-base"
          type="button"
          @click="$router.push('/matching')"
        >
          <Play
            class="h-4 w-4 fill-current lg:h-5 lg:w-5"
            :stroke-width="2.4"
          />
          開始遊戲
        </button>
      </div>
    </section>
  </main>
</template>
