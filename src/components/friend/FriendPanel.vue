<template>
  <Transition name="friend-panel">
    <div v-if="open" class="fixed inset-0 z-50">
      <button
        type="button"
        class="absolute inset-0 bg-slate-950/35"
        aria-label="關閉好友面板"
        @click="emit('close')"
      ></button>

      <aside
        class="absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col border-l border-gray-200 bg-white/95 shadow-2xl backdrop-blur"
      >
        <header class="border-b border-gray-200 px-5 py-4">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-xl font-bold text-gray-900">好友</h2>
              <p class="mt-1 text-sm text-gray-500">
                {{ friendStore.friends.length }} 位好友，{{ activeFriendCount }} 位可互動
              </p>
            </div>

            <button
              type="button"
              class="border border-gray-300 px-3 py-1 text-sm font-bold text-gray-600 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
              @click="emit('close')"
            >
              關閉
            </button>
          </div>

          <nav class="mt-4 grid grid-cols-4 border border-gray-200 bg-gray-50 text-sm">
            <button
              type="button"
              class="panel-tab"
              :class="{ active: activeTab === 'friends' }"
              @click="activeTab = 'friends'"
            >
              好友
            </button>

            <button
              type="button"
              class="panel-tab"
              :class="{ active: activeTab === 'requests' }"
              @click="activeTab = 'requests'"
            >
              邀請 {{ friendStore.pendingRequestCount }}
            </button>

            <button
              type="button"
              class="panel-tab"
              :class="{ active: activeTab === 'add' }"
              @click="activeTab = 'add'"
            >
              加入
            </button>

            <button
              type="button"
              class="panel-tab"
              :class="{ active: activeTab === 'blocks' }"
              @click="activeTab = 'blocks'"
            >
              封鎖 {{ friendStore.blockedPlayerCount }}
            </button>
          </nav>
        </header>

        <section class="min-h-0 flex-1 overflow-hidden">
          <FriendList
            v-if="activeTab === 'friends'"
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

          <div v-else-if="activeTab === 'requests'" class="h-full overflow-y-auto p-5">
            <FriendRequestList
              :requests="friendStore.requests"
              :processing-request-ids="friendStore.processingRequestIds"
              :is-loading="friendStore.isLoading"
              :error-message="friendStore.errorMessage"
              @accept="friendStore.acceptRequest"
              @reject="friendStore.rejectRequest"
            />
          </div>

          <div v-else-if="activeTab === 'add'" class="h-full overflow-y-auto p-5">
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

          <div v-else class="h-full overflow-y-auto p-5">
            <BlockedPlayerList
              :blocked-players="friendStore.blockedPlayers"
              :is-loading="friendStore.isLoading"
              :error-message="friendStore.errorMessage"
              :is-block-processing="friendStore.isBlockProcessing"
              @unblock="confirmUnblockPlayer"
            />
          </div>
        </section>
      </aside>
    </div>
  </Transition>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import AddFriendForm from "@/components/friend/AddFriendForm.vue";
import BlockedPlayerList from "@/components/friend/BlockedPlayerList.vue";
import FriendList from "@/components/friend/FriendList.vue";
import FriendRequestList from "@/components/friend/FriendRequestList.vue";
import { useFriendStore } from "@/stores/friendStore.js";

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close"]);
const friendStore = useFriendStore();
const activeTab = ref("friends");

const activeFriendCount = computed(() => {
  return friendStore.friends.filter((friend) => friend.online).length;
});

function confirmRemoveFriend(friend) {
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
  if (!player?.blockId) {
    return;
  }

  const confirmed = window.confirm(`確定要取消封鎖 ${player.name} 嗎？`);

  if (confirmed) {
    friendStore.unblockPlayer(player.blockId);
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      friendStore.loadFriendData();
    }
  },
);
</script>

<style scoped>
@reference "tailwindcss";

.panel-tab {
  @apply border-r border-gray-200 px-3 py-2 font-bold text-gray-500 transition last:border-r-0 hover:bg-white hover:text-gray-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200;
}

.panel-tab.active {
  @apply bg-slate-800 text-white hover:bg-slate-800 hover:text-white;
}

.friend-panel-enter-active,
.friend-panel-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.friend-panel-enter-from,
.friend-panel-leave-to {
  opacity: 0;
  transform: translateX(24px);
}
</style>
