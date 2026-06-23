<script setup>
import { computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { Copy, Play } from "@lucide/vue";
import { useRouter } from "vue-router";
import PlayerList from "@/components/gameRoom/CustomRoomPlayerList.vue";
import BG from "@/assets/images/bg-dashboard.webp";
import { usePlayerStore } from "@/stores/playerStore.js";
import { useRoomStore } from "@/stores/roomStore.js";

const router = useRouter();
const roomStore = useRoomStore();
const playerStore = usePlayerStore();

const { roomCode, players, errorMessage, isLoading, isRoomReadyToStart } =
  storeToRefs(roomStore);

const emptyPlayerSlots = [
  { isHost: true, option1: "等待房主" },
  { isHost: false, option1: "等待加入" },
  { isHost: false, option1: "等待加入" },
  { isHost: false, option1: "等待加入" },
];

const playerSlots = computed(() =>
  emptyPlayerSlots.map((slot, index) => {
    const player = players.value[index];

    if (!player) {
      return { ...slot };
    }

    return {
      id: player.playerId,
      isHost: player.role === "host",
      isReady: Boolean(player.isReady),
      name: player.username,
      avatar: null,
      canToggleReady:
        player.playerId === playerStore.currentPlayerId && player.role !== "host",
    };
  }),
);

const currentPlayerEntry = computed(() =>
  players.value.find((player) => player.playerId === playerStore.currentPlayerId),
);

const isHostPlayer = computed(
  () => currentPlayerEntry.value?.role === "host",
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

async function handleStartRoom() {
  if (!roomCode.value) {
    roomStore.errorMessage = "目前沒有房間可以開始。";
    return;
  }

  await roomStore.startRoom(roomCode.value, {
    playerId: playerStore.currentPlayerId,
  });

  router.push("/loading");
}

async function copyRoomCode() {
  if (!roomCode.value || !navigator?.clipboard?.writeText) {
    return;
  }

  await navigator.clipboard.writeText(roomCode.value);
}

onMounted(async () => {
  if (roomCode.value && !players.value.length) {
    await roomStore.fetchRoomState();
  }
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
      aria-label="Custom room"
    >
      <div
        class="flex w-52 items-center justify-center gap-2 text-sm font-bold leading-none text-white lg:w-80 lg:text-2xl"
      >
        <span>Room ID</span>
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
        @toggle-ready="toggleReady"
        class="mt-3 lg:mt-5"
      />

      <div class="mt-4 text-sm font-bold text-white">
        {{ players.length }}/4 players
        <span class="ml-3">{{ roomStore.readyPlayerCount }} ready</span>
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
          :disabled="isLoading || !isHostPlayer || !isRoomReadyToStart"
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
