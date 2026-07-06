<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { Mail, RefreshCw } from "@lucide/vue";
import { useRoomInvitationStore } from "@/stores/roomInvitationStore.js";
import { useAuthStore } from "@/stores/authStore.js";
import { usePlayerStore } from "@/stores/playerStore.js";

const roomInvitationStore = useRoomInvitationStore();
const authStore = useAuthStore();
const playerStore = usePlayerStore();
const router = useRouter();
const isOpen = ref(false);
let pollTimerId = null;

function stopPolling() {
  if (!pollTimerId) {
    return;
  }

  window.clearInterval(pollTimerId);
  pollTimerId = null;
}

function startPolling() {
  stopPolling();

  if (!roomInvitationStore.canUseRoomInvitations) {
    return;
  }

  pollTimerId = window.setInterval(() => {
    roomInvitationStore.loadInvitations();
  }, 15000);
}

async function refreshInvitations() {
  await roomInvitationStore.loadInvitations();
}

async function acceptInvitation(invitation) {
  const result = await roomInvitationStore.acceptInvitation(invitation.id);
  const playerId = authStore.currentPlayer?.id ?? playerStore.currentPlayerId ?? "";

  if (result?.room?.roomCode) {
    router.push({
      name: "CustomRoom",
      query: {
        roomCode: result.room.roomCode,
        playerId: String(playerId),
      },
    });
  }
}

function rejectInvitation(invitation) {
  roomInvitationStore.rejectInvitation(invitation.id);
}

watch(
  () => roomInvitationStore.canUseRoomInvitations,
  (canUse) => {
    if (canUse) {
      refreshInvitations();
      startPolling();
      return;
    }

    stopPolling();
    roomInvitationStore.clearInvitations();
    isOpen.value = false;
  },
);

onMounted(() => {
  if (roomInvitationStore.canUseRoomInvitations) {
    refreshInvitations();
    startPolling();
  }
});

onBeforeUnmount(stopPolling);
</script>

<template>
  <div v-if="roomInvitationStore.canUseRoomInvitations" class="room-invitation-notice">
    <button
      class="room-invitation-trigger"
      type="button"
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
    >
      <Mail class="room-invitation-icon" :stroke-width="2.2" />
      <span>房間邀請</span>
      <span
        v-if="roomInvitationStore.hasPendingInvitations"
        class="room-invitation-badge"
      >
        {{ roomInvitationStore.pendingInvitationCount }}
      </span>
    </button>

    <section v-if="isOpen" class="room-invitation-panel" aria-label="待處理房間邀請">
      <header class="room-invitation-panel-header">
        <div>
          <h2>待處理邀請</h2>
          <p>{{ roomInvitationStore.pendingInvitationCount }} 筆房間邀請</p>
        </div>
        <button
          class="room-invitation-refresh"
          type="button"
          :disabled="roomInvitationStore.isLoading"
          aria-label="重新整理房間邀請"
          @click="refreshInvitations"
        >
          <RefreshCw :stroke-width="2.2" />
        </button>
      </header>

      <div v-if="roomInvitationStore.isLoading" class="room-invitation-empty">
        邀請載入中...
      </div>
      <div v-else-if="roomInvitationStore.errorMessage" class="room-invitation-empty is-error">
        {{ roomInvitationStore.errorMessage }}
      </div>
      <div v-else-if="!roomInvitationStore.invitations.length" class="room-invitation-empty">
        目前沒有房間邀請
      </div>
      <div v-else class="room-invitation-list">
        <article
          v-for="invitation in roomInvitationStore.invitations"
          :key="invitation.id"
          class="room-invitation-item"
        >
          <div class="room-invitation-item-copy">
            <h3>{{ invitation.inviter.name }} 邀請你加入房間</h3>
            <p>
              房間 {{ invitation.roomCode }}｜{{ invitation.playerCount }}/4 人
            </p>
            <p v-if="invitation.expiresAtLabel">
              有效至 {{ invitation.expiresAtLabel }}
            </p>
          </div>

          <div class="room-invitation-actions">
            <button
              type="button"
              :disabled="roomInvitationStore.isInvitationProcessing(invitation.id)"
              @click="rejectInvitation(invitation)"
            >
              拒絕
            </button>
            <button
              type="button"
              class="is-primary"
              :disabled="roomInvitationStore.isInvitationProcessing(invitation.id)"
              @click="acceptInvitation(invitation)"
            >
              {{
                roomInvitationStore.isInvitationProcessing(invitation.id)
                  ? "處理中"
                  : "接受"
              }}
            </button>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
@reference "../../assets/styles/main.css";

.room-invitation-notice {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 24;
  font-family: var(--font-sans);
}

.room-invitation-trigger {
  position: relative;
  display: inline-flex;
  min-height: 34px;
  cursor: pointer;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(255, 255, 255, 0.54);
  border-radius: var(--radius-md, 0);
  background: rgba(255, 255, 255, 0.3);
  padding: 6px 10px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 900;
  line-height: 1;
  box-shadow: 0 10px 24px rgba(0, 19, 50, 0.18);
  backdrop-filter: blur(10px);
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    background-color 180ms ease,
    box-shadow 180ms ease;
}

.room-invitation-trigger:hover {
  transform: translateY(-1px);
  border-color: var(--brand-hover, #0046f4);
  background: var(--brand-hover, #0046f4);
}

.room-invitation-trigger:active {
  transform: translateY(1px);
  border-color: var(--brand-active, #465563);
  background: var(--brand-active, #465563);
}

.room-invitation-trigger:focus-visible,
.room-invitation-refresh:focus-visible,
.room-invitation-actions button:focus-visible {
  outline: 0;
  box-shadow: 0 0 0 4px var(--brand-focus, rgba(0, 70, 244, 0.24));
}

.room-invitation-icon {
  width: 16px;
  height: 16px;
}

.room-invitation-badge {
  display: grid;
  min-width: 18px;
  height: 18px;
  place-items: center;
  border: 1px solid #ffffff;
  background: var(--brand-hover, #0046f4);
  color: #ffffff;
  font-size: 11px;
  line-height: 1;
}

.room-invitation-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: min(330px, calc(100vw - 20px));
  border: 1px solid rgba(134, 179, 224, 0.68);
  border-radius: var(--radius-md, 0);
  background: rgba(255, 255, 255, 0.94);
  color: var(--brand-active, #465563);
  box-shadow: var(--shadow, 0 20px 60px rgba(0, 19, 50, 0.14));
}

.room-invitation-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--gray-100, #d6d7dc);
  padding: 12px;
}

.room-invitation-panel-header h2 {
  margin: 0;
  color: var(--brand-navy, #001332);
  font-size: var(--text-sm);
  font-weight: 900;
  line-height: 1.2;
}

.room-invitation-panel-header p {
  margin: 3px 0 0;
  color: var(--gray-400, #6f7b8a);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
}

.room-invitation-refresh {
  display: grid;
  width: 32px;
  height: 32px;
  cursor: pointer;
  place-items: center;
  border: 1px solid var(--brand-primary, #86b3e0);
  border-radius: var(--radius-md, 0);
  background: var(--surface-glass, rgba(255, 255, 255, 0.3));
  color: var(--brand-active, #465563);
}

.room-invitation-refresh:disabled {
  cursor: wait;
  opacity: 0.6;
}

.room-invitation-refresh svg {
  width: 16px;
  height: 16px;
}

.room-invitation-empty {
  padding: 18px 12px;
  text-align: center;
  color: var(--gray-400, #6f7b8a);
  font-size: 13px;
  font-weight: 800;
}

.room-invitation-empty.is-error {
  color: var(--brand-hover, #0046f4);
}

.room-invitation-list {
  display: grid;
  max-height: 260px;
  gap: 8px;
  overflow-y: auto;
  padding: 10px;
}

.room-invitation-item {
  display: grid;
  gap: 10px;
  border: 1px solid var(--gray-100, #d6d7dc);
  border-radius: var(--radius-md, 0);
  background: rgba(255, 255, 255, 0.72);
  padding: 10px;
}

.room-invitation-item-copy h3 {
  margin: 0;
  color: var(--brand-active, #465563);
  font-size: 13px;
  font-weight: 900;
  line-height: 1.3;
}

.room-invitation-item-copy p {
  margin: 4px 0 0;
  color: var(--gray-400, #6f7b8a);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.25;
}

.room-invitation-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.room-invitation-actions button {
  min-height: 32px;
  cursor: pointer;
  border: 1px solid var(--brand-primary, #86b3e0);
  border-radius: var(--radius-md, 0);
  background: var(--surface-glass, rgba(255, 255, 255, 0.3));
  color: var(--brand-active, #465563);
  font-size: 13px;
  font-weight: 900;
  transition:
    border-color 180ms ease,
    background-color 180ms ease,
    color 180ms ease,
    box-shadow 180ms ease;
}

.room-invitation-actions button.is-primary {
  background: var(--brand-active, #465563);
  color: #ffffff;
}

.room-invitation-actions button:hover:not(:disabled) {
  border-color: var(--brand-hover, #0046f4);
  background: var(--brand-hover, #0046f4);
  color: #ffffff;
}

.room-invitation-actions button:disabled {
  cursor: wait;
  opacity: 0.64;
}

@media (min-width: 1024px) {
  .room-invitation-notice {
    top: 16px;
    right: 16px;
  }

  .room-invitation-trigger {
    min-height: 40px;
    gap: 8px;
    padding: 8px 12px;
    font-size: 14px;
  }
}
</style>
