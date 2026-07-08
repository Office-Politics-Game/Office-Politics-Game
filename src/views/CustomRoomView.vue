<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { Copy, Play } from "@lucide/vue";
import { useRoute, useRouter } from "vue-router";
import InviteFriendModal from "@/components/gameRoom/InviteFriendModal.vue";
import PlayerList from "@/components/gameRoom/CustomRoomPlayerList.vue";
import { getRankingList } from "@/services/rankingService.js";
import BG from "@/assets/images/bg-dashboard.webp";
import { useCurrentPlayerId } from "@/composables/useCurrentPlayerId.js";
import { useFriendStore } from "@/stores/friendStore.js";
import { useRoomInvitationStore } from "@/stores/roomInvitationStore.js";
import { useRoomStore } from "@/stores/roomStore.js";

const router = useRouter();
const route = useRoute();
const friendStore = useFriendStore();
const roomInvitationStore = useRoomInvitationStore();
const roomStore = useRoomStore();
const { currentPlayerId } = useCurrentPlayerId();

const { roomCode, players, errorMessage, isLoading, isRoomReadyToStart } =
  storeToRefs(roomStore);

const availablePlayers = ref([]);
const localPlayerSlots = ref([]);
const showInviteFriendModal = ref(false);
const invitingSlotIndex = ref(null);
const isRestoringRoomState = ref(false);

const requestedRoomCode = computed(() =>
  typeof route.query.roomCode === "string" ? route.query.roomCode.trim().toUpperCase() : "",
);
const requestedPlayerId = computed(() =>
  typeof route.query.playerId === "string" && route.query.playerId
    ? route.query.playerId
    : null,
);
const resolvedPlayerId = computed(
  () => currentPlayerId.value ?? requestedPlayerId.value ?? null,
);

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
      String(player.playerId) === String(resolvedPlayerId.value) && player.role !== "host",
    canRemovePlayer:
      isHostPlayer.value && String(player.playerId) !== String(resolvedPlayerId.value),
  };
}

function createRestoringSlot(slot, index) {
  return {
    id: `restoring-${index}`,
    isHost: index === 0,
    name: index === 0 ? "房主連線中" : `等待玩家 ${index + 1}`,
    level: null,
    avatar: null,
    isReady: index === 0,
    isPlaceholder: true,
    placeholderLabel: index === 0 ? "正在同步房間資訊" : "同步玩家席位中",
    ...slot,
  };
}

const playerSlots = computed(() =>
  emptyPlayerSlots.map((slot, index) => {
    const roomPlayer = players.value[index];

    if (roomPlayer) {
      return createRoomPlayerSlot(roomPlayer);
    }

    if (localPlayerSlots.value[index]?.name) {
      return localPlayerSlots.value[index];
    }

    return {
      ...slot,
      canInviteFriend:
        Boolean(slot.option2) && Boolean(roomCode.value) && isHostPlayer.value,
    };
  }),
);

const displayRoomCode = computed(
  () => roomCode.value || requestedRoomCode.value || "------",
);

const displayPlayerSlots = computed(() => {
  if (isRestoringRoomState.value) {
    return emptyPlayerSlots.map((slot, index) => createRestoringSlot(slot, index));
  }

  return playerSlots.value;
});

const currentPlayerEntry = computed(() =>
  players.value.find(
    (player) => String(player.playerId) === String(resolvedPlayerId.value),
  ),
);

const isHostPlayer = computed(
  () => currentPlayerEntry.value?.role === "host",
);

const occupiedSlotCount = computed(
  () => displayPlayerSlots.value.filter((slot) => slot.name && !slot.isPlaceholder).length,
);

const readySlotCount = computed(
  () =>
    displayPlayerSlots.value.filter(
      (slot) => slot.name && slot.isReady && !slot.isPlaceholder,
    ).length,
);

const hasLocalComputerPlayers = computed(() =>
  localPlayerSlots.value.some((slot) => slot?.isComputer),
);

const inviteePlayerIds = computed(() =>
  new Set(players.value.map((player) => Number(player.playerId))),
);

const availableInviteFriends = computed(() =>
  friendStore.friends.filter(
    (friend) => !inviteePlayerIds.value.has(Number(friend.playerId)),
  ),
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
  if (index === 0 || players.value[index]) {
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
  if (index === 0 || !isHostPlayer.value) {
    return;
  }

  if (players.value[index]) {
    players.value.splice(index, 1);
    return;
  }

  localPlayerSlots.value[index] = null;
}

async function handleStartRoom() {
  if (hasLocalComputerPlayers.value) {
    if (!isRoomReadyToStartWithLocalPlayers.value) {
      return;
    }

    router.push({
      name: "Loading",
      query: {
        roomCode: roomCode.value,
        playerId: String(resolvedPlayerId.value ?? ""),
      },
    });
    return;
  }

  if (!roomCode.value) {
    roomStore.errorMessage = "目前沒有房間可以開始。";
    return;
  }

  await roomStore.startRoom(roomCode.value, {
    playerId: resolvedPlayerId.value,
  });

  router.push({
    name: "Loading",
    query: {
      roomCode: roomCode.value,
      playerId: String(resolvedPlayerId.value ?? ""),
    },
  });
}

async function openInviteFriendModal(index) {
  if (!isHostPlayer.value) {
    roomInvitationStore.sendErrorMessage = "只有房主可以邀請好友。";
    return;
  }

  if (!roomCode.value) {
    roomInvitationStore.sendErrorMessage = "目前沒有房間可以邀請好友。";
    return;
  }

  invitingSlotIndex.value = index;
  showInviteFriendModal.value = true;
  roomInvitationStore.clearMessages();

  if (friendStore.canUseFriendSystem) {
    await friendStore.loadFriendData();
    return;
  }

  friendStore.markLoginRequired();
}

function closeInviteFriendModal() {
  showInviteFriendModal.value = false;
  invitingSlotIndex.value = null;
}

async function sendRoomInvitation(friend) {
  const invitation = await roomInvitationStore.sendInvitation({
    roomCode: roomCode.value,
    inviteePlayerId: friend?.playerId,
  });

  if (invitation) {
    window.setTimeout(closeInviteFriendModal, 450);
  }
}

async function copyRoomCode() {
  if (!roomCode.value || !navigator?.clipboard?.writeText) {
    return;
  }

  await navigator.clipboard.writeText(roomCode.value);
}

onMounted(async () => {
  const rankingPlayers = await getRankingList();
  availablePlayers.value = rankingPlayers;

  let hasRestoredRoomState = false;
  const roomCodeToRestore = requestedRoomCode.value || roomCode.value;

  if (roomCodeToRestore && !players.value.length) {
    isRestoringRoomState.value = true;

    try {
      if (resolvedPlayerId.value) {
        await roomStore.subscribeToRoom({
          roomCode: roomCodeToRestore,
          playerId: resolvedPlayerId.value,
          force: true,
        });
      } else {
        await roomStore.fetchRoomState(roomCodeToRestore);
      }
      hasRestoredRoomState = roomStore.players.length > 0;
    } catch {
      hasRestoredRoomState = false;
      await roomStore.fetchRoomState(roomCodeToRestore).catch(() => null);
    } finally {
      window.setTimeout(() => {
        isRestoringRoomState.value = false;
      }, 220);
    }
  }

  if (!players.value.length && !hasRestoredRoomState) {
    const occupiedSlots = rankingPlayers
      .slice(0, 3)
      .map((player, index) => createPlayerSlot(player, index));

    localPlayerSlots.value = emptyPlayerSlots.map((slot, index) =>
      occupiedSlots[index]
        ? {
            ...slot,
            ...occupiedSlots[index],
          }
        : null,
    );
  }

  if (!roomCodeToRestore) {
    isRestoringRoomState.value = false;
  }
});

onBeforeUnmount(() => {
  const subscribedRoom = roomCode.value || requestedRoomCode.value;

  if (subscribedRoom) {
    roomStore.unsubscribeFromRoom(subscribedRoom);
  }
});

watch(
  () => roomStore.room?.status,
  (status, previousStatus) => {
    if (status !== "playing" || status === previousStatus || !roomCode.value) {
      return;
    }

    router.push({
      name: "Loading",
      query: {
        roomCode: roomCode.value,
        playerId: String(resolvedPlayerId.value ?? ""),
      },
    });
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
        <span class="tracking-[0.08em]">{{ displayRoomCode }}</span>
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
        :slots="displayPlayerSlots"
        :is-restoring="isRestoringRoomState"
        @add-computer="handleAddComputer"
        @invite-friend="openInviteFriendModal"
        @remove-player="handleRemovePlayer"
        @toggle-ready="toggleReady"
        class="mt-3 lg:mt-5"
      />

      <InviteFriendModal
        v-if="showInviteFriendModal"
        :friends="availableInviteFriends"
        :is-loading="friendStore.isLoading"
        :is-sending="roomInvitationStore.isSending"
        :error-message="
          roomInvitationStore.sendErrorMessage || friendStore.errorMessage
        "
        :notice="roomInvitationStore.noticeMessage"
        @close="closeInviteFriendModal"
        @send="sendRoomInvitation"
      />

      <div class="custom-room-status mt-4 text-sm font-bold text-white">
        <template v-if="isRestoringRoomState">
          正在同步房間玩家狀態
        </template>
        <template v-else>
          {{ occupiedSlotCount }}/4 players
          <span class="ml-3">{{ readySlotCount }} ready</span>
        </template>
      </div>
      <div
        class="custom-room-actions pointer-events-auto mt-5 grid w-72 grid-cols-2 gap-3 lg:mt-10 lg:w-[416px] lg:gap-8"
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
            isRestoringRoomState ||
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

<style scoped>
@media (max-width: 900px) and (max-height: 520px) and (orientation: landscape) {
  .custom-room-status {
    position: relative;
    top: -12px;
  }

  .custom-room-actions {
    position: relative;
    top: -16px;
  }
}
</style>
