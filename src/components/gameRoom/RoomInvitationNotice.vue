<script setup>
import { computed, onBeforeUnmount, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { Mail } from "@lucide/vue";
import { useRoomInvitationStore } from "@/stores/roomInvitationStore.js";

const roomInvitationStore = useRoomInvitationStore();
const router = useRouter();
let pollTimerId = null;
const stackedInvitations = computed(() =>
  [...roomInvitationStore.invitations].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  ),
);

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

  if (result?.room?.roomCode) {
    router.push({
      name: "CustomRoom",
      query: {
        roomCode: result.room.roomCode,
        playerId: String(
          result.invitation?.inviteePlayerId ?? invitation.inviteePlayerId ?? "",
        ),
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
  <div
    v-if="roomInvitationStore.canUseRoomInvitations && stackedInvitations.length"
    class="room-invitation-toast-stack"
    aria-live="polite"
    aria-label="房間邀請通知"
  >
    <article
      v-for="invitation in stackedInvitations"
      :key="invitation.id"
      class="room-invitation-toast"
    >
      <Mail class="room-invitation-toast-icon" :stroke-width="2.2" />
      <div class="room-invitation-toast-copy">
        <h3>{{ invitation.inviter.name }} 邀請你加入房間</h3>
        <p>房間 {{ invitation.roomCode }}｜{{ invitation.playerCount }}/4 人</p>
        <p v-if="invitation.expiresAtLabel">有效至 {{ invitation.expiresAtLabel }}</p>
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
          {{ roomInvitationStore.isInvitationProcessing(invitation.id) ? "處理中" : "接受" }}
        </button>
      </div>
    </article>
  </div>
</template>

<style scoped>
@reference "../../assets/styles/main.css";

.room-invitation-toast-stack {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 80;
  display: flex;
  width: 320px;
  flex-direction: column;
  gap: 10px;
  font-family: var(--font-sans);
  pointer-events: none;
}

.room-invitation-toast {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  border: 1px solid rgba(134, 179, 224, 0.68);
  background: rgba(255, 255, 255, 0.94);
  padding: 12px;
  color: var(--brand-active, #465563);
  box-shadow: var(--shadow, 0 20px 60px rgba(0, 19, 50, 0.14));
  pointer-events: auto;
}

.room-invitation-toast-icon {
  width: 20px;
  height: 20px;
  color: var(--brand-hover, #0046f4);
}

.room-invitation-toast-copy h3 {
  margin: 0;
  color: var(--brand-navy, #001332);
  font-size: var(--text-sm);
  font-weight: 900;
  line-height: 1.3;
}

.room-invitation-toast-copy p {
  margin: 4px 0 0;
  color: var(--gray-400, #6f7b8a);
  font-size: var(--text-xs);
  font-weight: 700;
  line-height: 1.25;
}

.room-invitation-actions {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.room-invitation-actions button {
  min-height: 32px;
  cursor: pointer;
  border: 1px solid var(--brand-primary, #86b3e0);
  background: var(--surface-glass, rgba(255, 255, 255, 0.3));
  color: var(--brand-active, #465563);
  font-size: var(--text-xs);
  font-weight: 900;
  transition:
    transform 180ms ease,
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
  transform: translateY(-1px);
  border-color: var(--brand-hover, #0046f4);
  background: var(--brand-hover, #0046f4);
  color: #ffffff;
}

.room-invitation-actions button:active:not(:disabled) {
  transform: translateY(1px);
  border-color: var(--brand-active, #465563);
  background: var(--brand-active, #465563);
  color: #ffffff;
}

.room-invitation-actions button:focus-visible {
  outline: 0;
  box-shadow: 0 0 0 4px var(--brand-focus, rgba(0, 70, 244, 0.24));
}

.room-invitation-actions button:disabled {
  cursor: wait;
  opacity: 0.64;
}

@media (orientation: landscape) and (max-width: 1023px) and (max-height: 640px) {
  .room-invitation-toast-stack {
    right: 10px;
    bottom: 10px;
    width: 260px;
    gap: 6px;
  }

  .room-invitation-toast {
    grid-template-columns: 16px 1fr;
    gap: 8px;
    padding: 8px;
  }

  .room-invitation-toast-icon {
    width: 16px;
    height: 16px;
  }

  .room-invitation-toast-copy h3 {
    font-size: 12px;
    line-height: 1.2;
  }

  .room-invitation-toast-copy p {
    margin-top: 2px;
    font-size: 11px;
  }

  .room-invitation-actions {
    gap: 6px;
  }

  .room-invitation-actions button {
    min-height: 28px;
    font-size: 11px;
  }
}
</style>
