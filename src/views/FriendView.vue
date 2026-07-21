<template>
  <div
    class="friend-page-shell flex h-full w-full items-center justify-center overflow-hidden bg-cover bg-center"
    :class="{ 'is-returning': isReturningToLobby }"
    :style="{ backgroundImage: `url(${BG_FriendView})` }"
    @click.capture="handleButtonClick"
  >
    <div
      class="friend-exit-layer"
      :style="{ backgroundImage: `url(${bgDashboard})` }"
      aria-hidden="true"
    ></div>

    <div class="friend-canvas-frame" :style="frameStyle">
      <div class="friend-page-canvas" :style="canvasStyle">
        <section
          class="friend-page-panel relative z-10 flex flex-row overflow-hidden bg-white/95 shadow-2xl backdrop-blur"
          :style="panelStyle"
        >
      <aside class="friend-social-column flex min-h-0 shrink-0 flex-col overflow-hidden border-r border-[var(--gray-100)]">
        <div class="friend-tabs grid h-14 shrink-0 grid-cols-4 items-center border-b border-[var(--gray-100)] px-2">
          <button
            type="button"
            class="tab"
            :class="{ active: friendStore.canUseFriendSystem && activeTab === 'friends' }"
            :disabled="!friendStore.canUseFriendSystem"
            @click="setActiveTab('friends')"
          >
            好友列表
          </button>

          <button
            type="button"
            class="tab"
            :class="{ active: friendStore.canUseFriendSystem && activeTab === 'requests' }"
            :disabled="!friendStore.canUseFriendSystem"
            @click="setActiveTab('requests')"
          >
            好友邀請 {{ friendStore.pendingRequestCount }}
          </button>

          <button
            type="button"
            class="tab"
            :class="{ active: friendStore.canUseFriendSystem && activeTab === 'add' }"
            :disabled="!friendStore.canUseFriendSystem"
            @click="setActiveTab('add')"
          >
            加入好友
          </button>

          <button
            type="button"
            class="tab"
            :class="{ active: friendStore.canUseFriendSystem && activeTab === 'blocks' }"
            :disabled="!friendStore.canUseFriendSystem"
            @click="setActiveTab('blocks')"
          >
            封鎖 {{ friendStore.blockedPlayerCount }}
          </button>
        </div>

        <div v-if="!friendStore.canUseFriendSystem" class="min-h-0 flex-1 overflow-y-auto p-5">
          <FriendAuthRequiredState compact @login="goLogin" />
        </div>

        <FriendList
          v-else-if="activeTab === 'friends'"
          :friends="friendStore.friends"
          :selected-friend-id="friendStore.selectedFriendId"
          :is-loading="friendStore.isLoading"
          :error-message="friendStore.errorMessage"
          :show-actions="true"
          :is-friend-processing="friendStore.isFriendshipProcessing"
          :is-player-processing="friendStore.isPlayerProcessing"
          @select="friendStore.selectFriend"
          @remove="confirmRemoveFriend"
          @block="confirmBlockPlayer"
        />

        <div v-else-if="activeTab === 'requests'" class="min-h-0 flex-1 overflow-y-auto p-5">
          <FriendRequestList
            :requests="friendStore.requests"
            :processing-request-ids="friendStore.processingRequestIds"
            :is-loading="friendStore.isLoading"
            :error-message="friendStore.errorMessage"
            @accept="friendStore.acceptRequest"
            @reject="friendStore.rejectRequest"
          />
        </div>

        <div v-else-if="activeTab === 'add'" class="min-h-0 flex-1 overflow-y-auto p-5">
          <AddFriendForm
            :sent-invites="friendStore.sentInvites"
            :search-results="friendStore.searchResults"
            :notice="friendStore.noticeMessage"
            :error-message="friendStore.searchErrorMessage"
            :is-searching="friendStore.isSearching"
            :is-sending="friendStore.isSending"
            :is-player-processing="friendStore.isPlayerProcessing"
            @search="friendStore.searchPlayers"
            @add-friend="friendStore.sendFriendRequest"
            @block-player="confirmBlockPlayer"
          />
        </div>

        <div v-else class="min-h-0 flex-1 overflow-y-auto p-5">
          <BlockedPlayerList
            :blocked-players="friendStore.blockedPlayers"
            :is-loading="friendStore.isLoading"
            :error-message="friendStore.errorMessage"
            :is-block-processing="friendStore.isBlockProcessing"
            @unblock="confirmUnblockPlayer"
          />
        </div>
      </aside>

      <main class="friend-chat-column flex min-h-0 flex-col">
        <header class="flex h-14 shrink-0 items-center justify-between border-b border-[var(--gray-100)] px-5">
          <div class="flex min-w-0 items-center gap-3">
            <img
              src="@/assets/images/player-1.png"
              alt=""
              class="h-9 w-9 shrink-0 object-cover"
            />

            <div class="min-w-0">
              <div class="flex items-center gap-2 text-sm font-bold text-[var(--brand-active)]">
                <span class="truncate">
                  {{ selectedFriendName }}
                </span>

                <span
                  v-if="friendStore.selectedFriend"
                  class="h-2 w-2 shrink-0"
                  :class="getStatusColorClass(friendStore.selectedFriend)"
                ></span>
              </div>

              <div class="truncate text-xs text-[var(--gray-400)]">
                {{ selectedFriendStatus }}
              </div>
            </div>
          </div>

          <button
            type="button"
            class="close-button"
            :disabled="isReturningToLobby"
            aria-label="返回大廳"
            @click="returnToLobby"
          >
            ×
          </button>
        </header>

        <section class="flex min-h-0 flex-1 flex-col overflow-hidden bg-[rgba(244,247,251,0.74)] px-6 py-5">
          <FriendAuthRequiredState
            v-if="!friendStore.canUseFriendSystem"
            @login="goLogin"
          />

          <FriendChatPanel
            v-else-if="friendStore.selectedFriend"
            :friend="friendStore.selectedFriend"
            :current-player-id="friendStore.currentPlayerId"
          />

          <div v-else class="friend-empty-state">
            <h2 class="text-xl font-black text-[var(--brand-navy)]">
              選擇一位好友開始聊天
            </h2>
            <p class="mt-2 text-sm font-bold text-[var(--gray-400)]">
              從左側好友列表選擇對象後，就可以讀取聊天紀錄並送出訊息。
            </p>
          </div>
        </section>
      </main>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import AddFriendForm from "@/components/friend/AddFriendForm.vue";
import FriendAuthRequiredState from "@/components/friend/FriendAuthRequiredState.vue";
import BlockedPlayerList from "@/components/friend/BlockedPlayerList.vue";
import FriendChatPanel from "@/components/friend/FriendChatPanel.vue";
import FriendList from "@/components/friend/FriendList.vue";
import FriendRequestList from "@/components/friend/FriendRequestList.vue";
import BG_FriendView from "@/assets/images/bg-friend-view.webp";
import bgDashboard from "@/assets/images/bg-dashboard.webp";
import { useButtonClickAudio } from "@/composables/UseButtonClickAudio";
import { useFriendSocialCanvas } from "@/composables/UseFriendSocialCanvas.js";
import { useChatStore } from "@/stores/chatStore.js";
import { useFriendStore } from "@/stores/friendStore.js";

const router = useRouter();
const chatStore = useChatStore();
const friendStore = useFriendStore();
const { handleButtonClick } = useButtonClickAudio();
const { frameStyle, canvasStyle, panelStyle } = useFriendSocialCanvas();
const activeTab = ref("friends");
const isReturningToLobby = ref(false);
const RETURN_ANIMATION_DURATION = 520;

const selectedFriendName = computed(() => {
  if (!friendStore.canUseFriendSystem) {
    return "好友功能已鎖定";
  }

  return friendStore.selectedFriend?.name || "尚未選擇好友";
});

const selectedFriendStatus = computed(() => {
  if (!friendStore.canUseFriendSystem) {
    return friendStore.friendLoginRequiredMessage;
  }

  const friend = friendStore.selectedFriend;

  if (!friend) {
    return "請從左側選擇好友";
  }

  return friend.status;
});

function getStatusColorClass(friend) {
  return friend.online ? "bg-green-500" : "bg-[var(--gray-200)]";
}

function setActiveTab(tab) {
  if (!friendStore.canUseFriendSystem) {
    return;
  }

  activeTab.value = tab;
}

function goLogin() {
  router.push({
    name: "Entry",
    query: { auth: "login" },
  });
}

function loadFriendDataIfAllowed() {
  if (friendStore.canUseFriendSystem) {
    chatStore.startRealtime();
    friendStore.loadFriendData();
    return;
  }

  friendStore.clearFriendData();
  chatStore.clearChatData();
}

function confirmRemoveFriend(friend) {
  if (!friendStore.canUseFriendSystem) {
    return;
  }

  if (!friend?.friendshipId) {
    return;
  }

  const confirmed = window.confirm(
    `確定要解除與 ${friend.name} 的好友關係嗎？`,
  );

  if (confirmed) {
    friendStore.removeFriend(friend.friendshipId);
  }
}

function confirmBlockPlayer(player) {
  if (!friendStore.canUseFriendSystem) {
    return;
  }

  if (!player?.playerId) {
    return;
  }

  const confirmed = window.confirm(
    `確定要封鎖 ${player.name} 嗎？封鎖後將無法互相送出好友邀請。`,
  );

  if (confirmed) {
    friendStore.blockPlayer(player.playerId);
  }
}

function confirmUnblockPlayer(player) {
  if (!friendStore.canUseFriendSystem) {
    return;
  }

  if (!player?.blockId) {
    return;
  }

  const confirmed = window.confirm(`確定要取消封鎖 ${player.name} 嗎？`);

  if (confirmed) {
    friendStore.unblockPlayer(player.blockId);
  }
}

function returnToLobby() {
  if (isReturningToLobby.value) {
    return;
  }

  isReturningToLobby.value = true;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    router.push("/lobby");
    return;
  }

  window.setTimeout(() => {
    router.push("/lobby");
  }, RETURN_ANIMATION_DURATION);
}

onMounted(() => {
  loadFriendDataIfAllowed();
});

onUnmounted(() => {
  chatStore.stopRealtime();
});

watch(
  () => friendStore.canUseFriendSystem,
  () => {
    loadFriendDataIfAllowed();
  },
);
</script>

<style scoped>
@reference "tailwindcss";

.tab {
  @apply h-full min-w-0 border-b-2 border-transparent px-1 text-sm font-bold whitespace-nowrap text-[var(--gray-400)] transition hover:text-[var(--brand-active)];
}

.tab.active {
  @apply border-[var(--brand-active)] text-[var(--brand-navy)];
}

.tab:disabled {
  cursor: not-allowed;
  border-color: transparent;
  color: var(--brand-disabled);
  opacity: 0.68;
}

.tab:disabled:hover {
  color: var(--brand-disabled);
}

.tab:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 4px var(--brand-focus);
}

.friend-page-shell {
  position: relative;
  isolation: isolate;
}

.friend-canvas-frame {
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
}

.friend-page-canvas {
  display: grid;
  place-items: center;
  will-change: transform;
}

.friend-exit-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    linear-gradient(135deg, rgba(0, 19, 50, 0.12), rgba(0, 19, 50, 0.24)),
    rgba(0, 0, 0, 0.08);
  background-position: center;
  background-size: cover;
  opacity: 0;
  will-change: opacity;
}

.friend-page-panel {
  width: var(--friend-panel-width);
  height: var(--friend-panel-height);
  animation: friendPageEnter 360ms ease both;
  will-change: transform, opacity;
}

.friend-social-column {
  width: var(--friend-left-column-width);
}

.friend-chat-column {
  width: var(--friend-right-column-width);
}

.friend-page-shell.is-returning .friend-exit-layer {
  animation: dashboardReveal 520ms ease both;
}

.friend-page-shell.is-returning .friend-page-panel {
  opacity: 0;
  pointer-events: none;
  animation: none;
}

.friend-empty-state {
  @apply flex min-h-full flex-col items-center justify-center border border-[rgba(134,179,224,0.38)] bg-[rgba(255,255,255,0.88)] p-5 text-center shadow-[var(--shadow)];
}

.close-button {
  display: inline-flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--gray-200);
  background: rgba(255, 255, 255, 0.72);
  color: var(--brand-active);
  font-size: 26px;
  font-weight: 700;
  line-height: 1;
  transition:
    transform 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
}

.close-button:hover {
  transform: translateY(-1px);
  border-color: var(--brand-hover);
  background: var(--brand-hover);
  color: white;
}

.close-button:active {
  transform: translateY(1px);
  border-color: var(--brand-active);
  background: var(--brand-active);
  color: white;
}

.close-button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 5px var(--brand-focus);
}

.close-button:disabled {
  cursor: wait;
  border-color: transparent;
  background: rgba(160, 166, 179, 0.62);
  color: white;
}

@keyframes friendPageEnter {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes dashboardReveal {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .friend-page-shell.is-returning .friend-exit-layer,
  .friend-page-shell.is-returning .friend-page-panel,
  .friend-page-panel {
    animation: none;
  }
}
</style>
