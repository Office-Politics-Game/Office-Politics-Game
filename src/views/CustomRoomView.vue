<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { Copy, Play } from "@lucide/vue";
import { useRouter } from "vue-router";
import PlayerList from "@/components/gameRoom/CustomRoomPlayerList.vue";
import { getRankingList } from "@/services/rankingService.js";
import BG from "@/assets/images/bg-dashboard.webp";
import { usePlayerStore } from "@/stores/playerStore.js";
import { useRoomStore } from "@/stores/roomStore.js";

const router = useRouter();
const roomStore = useRoomStore();
const playerStore = usePlayerStore();

const { roomCode, players, errorMessage, isLoading, isRoomReadyToStart } =
  storeToRefs(roomStore);

const availablePlayers = ref([]);
const localPlayerSlots = ref([]);

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

function createPlayerSlot(player, index) {
  return {
    id: player.id,
    isHost: index === 0,
    isReady: index !== 0,
    name: player.name,
    level: player.level,
    stars: player.stars,
    avatar: player.avatar,
    isComputer: true,
  };
}

function createEmptySlot(index) {
  return { ...emptyPlayerSlots[index] };
}

function createRoomPlayerSlot(player) {
  return {
    id: player.playerId,
    isHost: player.role === "host",
    isReady: Boolean(player.isReady),
    name: player.username,
    avatar: null,
    canToggleReady:
      player.playerId === playerStore.currentPlayerId && player.role !== "host",
    showActionButton:
      player.playerId === playerStore.currentPlayerId && player.role !== "host",
    actionLabel: Boolean(player.isReady) ? "取消準備" : "準備",
  };
}

const playerSlots = computed(() =>
  emptyPlayerSlots.map((slot, index) => {
    const roomPlayer = players.value[index];

    if (roomPlayer) {
      return createRoomPlayerSlot(roomPlayer);
    }

    if (roomCode.value) {
      return {
        isHost: false,
        option1: "等待玩家",
        showActionButton: false,
        isActionDisabled: true,
      };
    }

    if (localPlayerSlots.value[index]) {
      return localPlayerSlots.value[index];
    }

    return { ...slot };
  }),
);

const currentPlayerEntry = computed(() =>
  players.value.find((player) => player.playerId === playerStore.currentPlayerId),
);

const isHostPlayer = computed(
  () => currentPlayerEntry.value?.role === "host",
);

const occupiedSlotCount = computed(
  () => playerSlots.value.filter((slot) => slot.name).length,
);

const readySlotCount = computed(
  () => playerSlots.value.filter((slot) => slot.name && slot.isReady).length,
);

const hasLocalComputerPlayers = computed(() =>
  localPlayerSlots.value.some((slot) => slot?.isComputer),
);

const isRoomReadyToStartWithLocalPlayers = computed(
  () =>
    occupiedSlotCount.value === 4 &&
    playerSlots.value.every((slot) => !slot.name || slot.isReady),
);

async function toggleReady(slot) {
  if (!roomCode.value || slot.isHost) {
    return;
  }

  await roomStore.updateRoomState(roomCode.value, {
    playerId: slot.id,
    isReady: !slot.isReady,
  });
}

function handleAddComputer(index) {
  if (roomCode.value || index === 0 || players.value[index]) {
    return;
  }

  const player = availablePlayers.value.find(
    (candidate) =>
      !playerSlots.value.some((slot) => slot.id === candidate.id),
  );

  if (!player) {
    return;
  }

  localPlayerSlots.value[index] = createPlayerSlot(player, index);
}

function handleRemovePlayer(index) {
  if (roomCode.value || index === 0) {
    return;
  }

  if (players.value[index]) {
    players.value.splice(index, 1);
    return;
  }

  localPlayerSlots.value[index] = createEmptySlot(index);
}

async function handleStartRoom() {
  if (hasLocalComputerPlayers.value) {
    if (!isRoomReadyToStartWithLocalPlayers.value) {
      return;
    }

    router.push("/loading");
    return;
  }

  if (!roomCode.value) {
    roomStore.errorMessage = "目前沒有房間可以開始。";
    return;
  }

  await roomStore.startRoom(roomCode.value, {
    playerId: playerStore.currentPlayerId,
  });

  navigateToLoading();
}

async function copyRoomCode() {
  if (!roomCode.value || !navigator?.clipboard?.writeText) {
    return;
  }

  await navigator.clipboard.writeText(roomCode.value);
}

function navigateToLoading() {
  router.push({
    name: "Loading",
    query: {
      roomCode: roomCode.value,
      playerId: playerStore.currentPlayerId,
    },
  });
}

onMounted(async () => {
  const rankingPlayers = await getRankingList();
  availablePlayers.value = rankingPlayers;

  if (roomCode.value && playerStore.currentPlayerId) {
    await roomStore.subscribeToRoom({
      roomCode: roomCode.value,
      playerId: playerStore.currentPlayerId,
      force: true,
    }).catch(() => roomStore.fetchRoomState());
  } else if (roomCode.value && !players.value.length) {
    await roomStore.fetchRoomState();
  }

  if (!players.value.length) {
    const occupiedSlots = rankingPlayers
      .slice(0, 3)
      .map((player, index) => createPlayerSlot(player, index));

    localPlayerSlots.value = emptyPlayerSlots.map((slot, index) => ({
      ...slot,
      ...occupiedSlots[index],
    }));
  }
});

onBeforeUnmount(() => {
  if (roomCode.value) {
    roomStore.unsubscribeFromRoom(roomCode.value);
  }
});

watch(
  () => roomStore.room?.status,
  (status, previousStatus) => {
    if (status !== "playing" || status === previousStatus || !roomCode.value) {
      return;
    }

    navigateToLoading();
  },
);
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
        <span class="tracking-[0.08em]">{{ roomCode || "------" }}</span>
        <button
          class="pointer-events-auto cursor-pointer border-0 bg-transparent p-0 text-white"
          type="button"
          @click="copyRoomCode"
        >
          <Copy class="h-4 w-4 lg:h-5 lg:w-5" :stroke-width="2.3" />
        </button>
      </div>

      <p
        v-if="errorMessage"
        class="mt-3 rounded bg-white/80 px-4 py-2 text-sm font-bold text-red-700"
      >
        {{ errorMessage }}
      </p>

      <PlayerList
        :slots="playerSlots"
        @add-computer="handleAddComputer"
        @remove-player="handleRemovePlayer"
        @toggle-ready="toggleReady"
        class="mt-3 lg:mt-5"
      />

      <div class="mt-4 text-sm font-bold text-white">
        {{ occupiedSlotCount }}/4 players
        <span class="ml-3">{{ readySlotCount }} ready</span>
      </div>

      <div
        class="pointer-events-auto mt-5 grid w-72 grid-cols-2 gap-3 lg:mt-10 lg:w-[416px] lg:gap-8"
      >
        <button
          class="btn-glass tap-pop pointer-events-auto flex h-9 cursor-pointer items-center justify-center overflow-hidden text-sm lg:h-12 lg:text-base"
          type="button"
          @click="router.push({ name: 'LobbyHome' })"
        >
          返回大廳
        </button>
        <button
          class="btn-dark tap-pop pointer-events-auto flex h-9 cursor-pointer items-center justify-center gap-2 overflow-hidden text-sm font-bold lg:h-12 lg:text-base"
          type="button"
          :disabled="
            isLoading ||
            (!hasLocalComputerPlayers && (!isHostPlayer || !isRoomReadyToStart))
          "
          @click="handleStartRoom"
        >
          <Play
            class="h-4 w-4 fill-current lg:h-5 lg:w-5"
            :stroke-width="2.4"
          />
          {{ isLoading ? "處理中" : "開始遊戲" }}
        </button>
      </div>
    </section>
  </main>
</template>
