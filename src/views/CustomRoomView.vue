<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { CheckCircle, Copy, Play } from "@lucide/vue";
import { useRoute, useRouter } from "vue-router";
import InviteFriendModal from "@/components/gameRoom/InviteFriendModal.vue";
import PlayerList from "@/components/gameRoom/CustomRoomPlayerList.vue";
import BG from "@/assets/images/bg-dashboard.webp";
import { createGuestNickname } from "@/constants/guestOptions.js";
import { useCurrentPlayerId } from "@/composables/useCurrentPlayerId.js";
import { useFriendStore } from "@/stores/friendStore.js";
import { useRoomInvitationStore } from "@/stores/roomInvitationStore.js";
import { useRoomStore } from "@/stores/roomStore.js";
import { resolveAvatarUrl } from "@/utils/playerUtils.js";

const router = useRouter();
const route = useRoute();
const friendStore = useFriendStore();
const roomInvitationStore = useRoomInvitationStore();
const roomStore = useRoomStore();
const { currentPlayerId } = useCurrentPlayerId();

const { roomCode, players, errorMessage, isLoading, isRoomReadyToStart } =
  storeToRefs(roomStore);

const showInviteFriendModal = ref(false);
const invitingSlotIndex = ref(null);
const isRestoringRoomState = ref(false);
const hasJoinedCurrentRoom = ref(false);
const kickedNotice = ref("");
const pendingComputerSlots = ref({});
const pendingRemovalSlots = ref({});
const REQUIRED_READY_PLAYERS_TO_START = 3;
const COMPUTER_JOIN_MIN_DISPLAY_MS = 900;
const PLAYER_REMOVE_MIN_DISPLAY_MS = 700;

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

function createRoomPlayerSlot(player, index) {
  return {
    id: player.playerId,
    isHost: player.role === "host",
    isReady: Boolean(player.isReady),
    name: player.username,
    avatar: player.avatarUrl
      ? player.avatarUrl
      : resolveAvatarUrl(player.avatarId ?? player.avatar_id, index),
    isComputer: Boolean(player.isComputer),
    canRemovePlayer:
      isHostPlayer.value && String(player.playerId) !== String(resolvedPlayerId.value),
  };
}

function createRestoringSlot(slot, index) {
  return {
    id: `restoring-${index}`,
    isHost: index === 0,
    name: index === 0 ? "房主載入中" : `等待玩家 ${index + 1}`,
    level: null,
    avatar: null,
    isReady: index === 0,
    isPlaceholder: true,
    placeholderLabel: index === 0 ? "正在還原房間狀態" : "載入玩家資料中",
    ...slot,
  };
}

function createPendingComputerSlot(slot, index, pendingState) {
  return {
    id: `pending-computer-${index}`,
    isHost: false,
    isReady: false,
    name: pendingState.name,
    avatar: null,
    isComputer: true,
    isPendingComputer: true,
    placeholderLabel: "電腦玩家加入中",
    canAddComputer: false,
    canInviteFriend: false,
    ...slot,
  };
}

function createPendingRemovalSlot(player, index, pendingState) {
  return {
    id: `pending-removal-${player.playerId}`,
    isHost: player.role === "host",
    isReady: false,
    name: player.username,
    avatar: player.avatarUrl
      ? player.avatarUrl
      : resolveAvatarUrl(player.avatarId ?? player.avatar_id, index),
    isComputer: Boolean(player.isComputer),
    isPendingRemoval: true,
    placeholderLabel: "移除中",
    canRemovePlayer: false,
  };
}

function createUniqueComputerNickname() {
  const usedNames = new Set(
    players.value
      .map((player) => player?.username?.trim())
      .filter(Boolean),
  );

  Object.values(pendingComputerSlots.value).forEach((slot) => {
    if (slot?.name) {
      usedNames.add(slot.name);
    }
  });

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const nickname = createGuestNickname()?.trim();

    if (nickname && !usedNames.has(nickname)) {
      return nickname;
    }
  }

  return `訪客${Date.now().toString().slice(-4)}`;
}

function setPendingComputerSlot(index, name) {
  pendingComputerSlots.value = {
    ...pendingComputerSlots.value,
    [index]: {
      name,
      startedAt: Date.now(),
    },
  };
}

function clearPendingComputerSlot(index) {
  if (!(index in pendingComputerSlots.value)) {
    return;
  }

  const nextPendingSlots = { ...pendingComputerSlots.value };
  delete nextPendingSlots[index];
  pendingComputerSlots.value = nextPendingSlots;
}

function setPendingRemovalSlot(index, player) {
  pendingRemovalSlots.value = {
    ...pendingRemovalSlots.value,
    [index]: {
      playerId: player.playerId,
      startedAt: Date.now(),
    },
  };
}

function clearPendingRemovalSlot(index) {
  if (!(index in pendingRemovalSlots.value)) {
    return;
  }

  const nextPendingSlots = { ...pendingRemovalSlots.value };
  delete nextPendingSlots[index];
  pendingRemovalSlots.value = nextPendingSlots;
}

async function clearPendingRemovalSlotWithDelay(index) {
  const pendingState = pendingRemovalSlots.value[index];

  if (!pendingState) {
    return;
  }

  const elapsed = Date.now() - pendingState.startedAt;
  const remainingDelay = Math.max(0, PLAYER_REMOVE_MIN_DISPLAY_MS - elapsed);

  if (remainingDelay > 0) {
    await new Promise((resolve) => {
      window.setTimeout(resolve, remainingDelay);
    });
  }

  clearPendingRemovalSlot(index);
}

async function clearPendingComputerSlotWithDelay(index) {
  const pendingState = pendingComputerSlots.value[index];

  if (!pendingState) {
    return;
  }

  const elapsed = Date.now() - pendingState.startedAt;
  const remainingDelay = Math.max(0, COMPUTER_JOIN_MIN_DISPLAY_MS - elapsed);

  if (remainingDelay > 0) {
    await new Promise((resolve) => {
      window.setTimeout(resolve, remainingDelay);
    });
  }

  clearPendingComputerSlot(index);
}

const playerSlots = computed(() =>
  emptyPlayerSlots.map((slot, index) => {
    const roomPlayer = players.value[index];
    const displaySlot =
      index === 0
        ? { ...slot, option1: "等待玩家" }
        : { ...slot, option1: "加入電腦", option2: "邀請好友" };

    if (roomPlayer) {
      const pendingRemovalState = pendingRemovalSlots.value[index];

      if (
        pendingRemovalState &&
        String(pendingRemovalState.playerId) === String(roomPlayer.playerId)
      ) {
        return createPendingRemovalSlot(roomPlayer, index, pendingRemovalState);
      }

      return createRoomPlayerSlot(roomPlayer, index);
    }

    const pendingComputerState = pendingComputerSlots.value[index];

    if (pendingComputerState) {
      return createPendingComputerSlot(displaySlot, index, pendingComputerState);
    }

    return {
      ...displaySlot,
      canAddComputer: index !== 0 && Boolean(roomCode.value) && isHostPlayer.value,
      canInviteFriend:
        Boolean(displaySlot.option2) && Boolean(roomCode.value) && isHostPlayer.value,
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

const isHostPlayer = computed(() => currentPlayerEntry.value?.role === "host");
const canCurrentPlayerToggleReady = computed(
  () =>
    Boolean(currentPlayerEntry.value) &&
    !isHostPlayer.value &&
    !currentPlayerEntry.value?.isComputer,
);
const isCurrentPlayerReady = computed(() => Boolean(currentPlayerEntry.value?.isReady));
const primaryActionLabel = computed(() => {
  if (isLoading.value) {
    return "載入中";
  }

  if (isHostPlayer.value) {
    return "開始遊戲";
  }

  return isCurrentPlayerReady.value ? "取消準備" : "準備";
});
const isPrimaryActionDisabled = computed(() => {
  if (isRestoringRoomState.value || isLoading.value) {
    return true;
  }

  if (isHostPlayer.value) {
    return !isRoomReadyToStart.value;
  }

  return !canCurrentPlayerToggleReady.value;
});

const occupiedSlotCount = computed(
  () => displayPlayerSlots.value.filter((slot) => slot.name && !slot.isPlaceholder).length,
);

const readySlotCount = computed(
  () =>
    displayPlayerSlots.value.filter(
      (slot) => slot.name && slot.isReady && !slot.isPlaceholder && !slot.isHost,
    ).length,
);

const remainingReadySlotCount = computed(() =>
  Math.max(0, REQUIRED_READY_PLAYERS_TO_START - readySlotCount.value),
);

const inviteePlayerIds = computed(() =>
  new Set(players.value.map((player) => Number(player.playerId))),
);

const availableInviteFriends = computed(() =>
  friendStore.friends.filter(
    (friend) => !inviteePlayerIds.value.has(Number(friend.playerId)),
  ),
);

async function toggleReady(slot) {
  if (!roomCode.value || slot.isHost || slot.isComputer) {
    return;
  }

  await roomStore.updateRoomState(roomCode.value, {
    playerId: slot.id,
    isReady: !slot.isReady,
  });
}

async function toggleCurrentPlayerReady() {
  if (!currentPlayerEntry.value) {
    return;
  }

  await toggleReady({
    id: currentPlayerEntry.value.playerId,
    isHost: isHostPlayer.value,
    isComputer: Boolean(currentPlayerEntry.value.isComputer),
    isReady: Boolean(currentPlayerEntry.value.isReady),
  });
}

async function handlePrimaryRoomAction() {
  if (isPrimaryActionDisabled.value) {
    return;
  }

  if (isHostPlayer.value) {
    await handleStartRoom();
    return;
  }

  await toggleCurrentPlayerReady();
}

async function handleAddComputer(index) {
  if (index === 0 || players.value[index]) {
    return;
  }

  if (!roomCode.value || !resolvedPlayerId.value || !isHostPlayer.value) {
    return;
  }

  const computerName = createUniqueComputerNickname();
  setPendingComputerSlot(index, computerName);

  try {
    await roomStore.addComputerPlayer(roomCode.value, {
      hostPlayerId: resolvedPlayerId.value,
      username: computerName,
    });
  } catch (error) {
    clearPendingComputerSlot(index);
    throw error;
  }
}

async function handleRemovePlayer(index) {
  if (index === 0 || !isHostPlayer.value) {
    return;
  }

  const targetPlayer = players.value[index];

  if (!roomCode.value || !resolvedPlayerId.value || !targetPlayer?.playerId) {
    return;
  }

  setPendingRemovalSlot(index, targetPlayer);

  try {
    await roomStore.removePlayer(roomCode.value, {
      requesterPlayerId: resolvedPlayerId.value,
      targetPlayerId: targetPlayer.playerId,
    });
  } catch (error) {
    clearPendingRemovalSlot(index);
    throw error;
  }
}

async function handleStartRoom() {
  if (!roomCode.value) {
    roomStore.errorMessage = "找不到房間，無法開始遊戲";
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
    roomInvitationStore.sendErrorMessage = "只有房主可以邀請好友";
    return;
  }

  if (!roomCode.value) {
    roomInvitationStore.sendErrorMessage = "找不到房間，無法邀請好友";
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

function isCurrentPlayerInRoom() {
  if (!resolvedPlayerId.value) {
    return false;
  }

  return players.value.some(
    (player) => String(player.playerId) === String(resolvedPlayerId.value),
  );
}

async function handleKickedFromRoom() {
  if (kickedNotice.value) {
    return;
  }

  kickedNotice.value = "你已被房主移出房間";
  showInviteFriendModal.value = false;

  const leavingRoomCode = roomCode.value || requestedRoomCode.value;

  if (leavingRoomCode) {
    roomStore.unsubscribeFromRoom(leavingRoomCode).catch(() => null);
  }
}

function confirmKickedNotice() {
  kickedNotice.value = "";
  roomStore.resetRoom();
  router.replace({ name: "LobbyHome" });
}

onMounted(async () => {
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
    } catch {
      await roomStore.fetchRoomState(roomCodeToRestore).catch(() => null);
    } finally {
      window.setTimeout(() => {
        isRestoringRoomState.value = false;
      }, 220);
    }
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
  [displayRoomCode, resolvedPlayerId],
  ([nextRoomCode, nextPlayerId]) => {
    if (!nextRoomCode || nextRoomCode === "------" || !nextPlayerId || kickedNotice.value) {
      return;
    }

    roomStore.subscribeToRoom({
      roomCode: nextRoomCode,
      playerId: nextPlayerId,
      force: true,
    }).catch(() => null);
  },
  { immediate: true },
);

watch(
  [players, resolvedPlayerId],
  () => {
    if (!resolvedPlayerId.value || isRestoringRoomState.value || kickedNotice.value) {
      return;
    }

    if (isCurrentPlayerInRoom()) {
      hasJoinedCurrentRoom.value = true;
      return;
    }

    if (hasJoinedCurrentRoom.value && players.value.length > 0) {
      handleKickedFromRoom();
    }
  },
  { immediate: true },
);

watch(
  players,
  (nextPlayers) => {
    Object.keys(pendingComputerSlots.value).forEach((slotIndex) => {
      const index = Number(slotIndex);
      const nextPlayer = nextPlayers[index];

      if (nextPlayer) {
        clearPendingComputerSlotWithDelay(index).catch(() => null);
      }
    });

    Object.entries(pendingRemovalSlots.value).forEach(([slotIndex, pendingState]) => {
      const index = Number(slotIndex);
      const nextPlayer = nextPlayers[index];

      if (!nextPlayer || String(nextPlayer.playerId) !== String(pendingState.playerId)) {
        clearPendingRemovalSlotWithDelay(index).catch(() => null);
      }
    });
  },
  { deep: true },
);

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
      aria-label="自訂房間大廳"
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
          正在還原房間與玩家狀態
        </template>
        <template v-else>
          <span>
            {{
              remainingReadySlotCount === 0
                ? "已達開始遊戲的打卡條件"
                : `還需要 ${remainingReadySlotCount} 名玩家打卡才可開始遊戲`
            }}
          </span>
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
          :class="[
            'primary-room-action flex h-9 items-center justify-center gap-2 overflow-hidden text-sm font-bold transition-opacity lg:h-12 lg:text-base',
            isPrimaryActionDisabled
              ? 'pointer-events-auto opacity-50'
              : 'btn-dark tap-pop pointer-events-auto',
          ]"
          type="button"
          :disabled="isPrimaryActionDisabled"
          @click="handlePrimaryRoomAction"
        >
          <Play
            v-if="isHostPlayer"
            class="h-4 w-4 fill-current lg:h-5 lg:w-5"
            :stroke-width="2.4"
          />
          <CheckCircle
            v-else
            class="h-4 w-4 lg:h-5 lg:w-5"
            :stroke-width="2.4"
          />
          {{ primaryActionLabel }}
        </button>
      </div>
    </section>

    <div
      v-if="kickedNotice"
      class="kicked-modal-backdrop pointer-events-auto fixed inset-0 z-50 grid place-items-center px-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kicked-modal-title"
    >
      <section class="kicked-modal-card w-full max-w-[460px] text-center">
        <p class="kicked-modal-kicker m-0 text-xs font-black tracking-[0.24em]">
          ROOM NOTICE
        </p>
        <h2
          id="kicked-modal-title"
          class="m-0 mt-3 text-3xl font-black tracking-[0.06em]"
        >
          已離開房間
        </h2>
        <p class="m-0 mt-5 text-lg font-bold leading-8">
          {{ kickedNotice }}
        </p>
        <p class="m-0 mt-2 text-sm font-bold leading-6 text-slate-500">
          按下確定後會返回大廳。
        </p>
        <button
          class="btn-dark tap-pop mt-7 h-12 w-full cursor-pointer text-base font-black"
          type="button"
          @click="confirmKickedNotice"
        >
          確定
        </button>
      </section>
    </div>
  </main>
</template>

<style scoped>
.kicked-modal-backdrop {
  background: rgba(0, 19, 50, 0.58);
  backdrop-filter: blur(5px);
}

.kicked-modal-card {
  border: 1px solid rgba(255, 255, 255, 0.62);
  border-radius: var(--radius-md, 0);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(236, 242, 248, 0.94));
  padding: 34px 32px 30px;
  color: var(--brand-active, #465563);
  box-shadow:
    0 28px 70px rgba(0, 19, 50, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.92);
}

.kicked-modal-kicker {
  color: var(--brand-hover, #0046f4);
}

.primary-room-action:disabled,
.primary-room-action:disabled:hover,
.primary-room-action:disabled:active {
  pointer-events: auto;
  cursor: not-allowed;
  transform: none;
  border: 1px solid var(--brand-disabled, #a0a6b3);
  border-color: var(--brand-disabled, #a0a6b3);
  background: var(--brand-disabled, #a0a6b3);
  color: white;
  box-shadow: none;
}

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
