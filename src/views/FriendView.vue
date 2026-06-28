<template>
  <div
    class="flex min-h-screen w-screen items-center justify-center overflow-hidden bg-cover bg-center p-3 md:p-4"
    :style="{ backgroundImage: `url(${BG_FriendView})` }"
  >
    <section
      class="friend-page-panel flex h-[92vh] w-[94vw] max-w-[1100px] flex-col overflow-hidden bg-white/95 shadow-2xl backdrop-blur md:h-[82vh] md:flex-row"
    >
      <aside class="flex min-h-0 w-full flex-col border-b border-gray-200 md:w-[38%] md:border-b-0 md:border-r">
        <div class="flex h-14 shrink-0 items-center border-b border-gray-200 px-5">
          <button
            type="button"
            class="tab"
            :class="{ active: activeTab === 'friends' }"
            @click="activeTab = 'friends'"
          >
            好友列表
          </button>

          <button
            type="button"
            class="tab"
            :class="{ active: activeTab === 'requests' }"
            @click="activeTab = 'requests'"
          >
            好友邀請 {{ friendStore.pendingRequestCount }}
          </button>

          <button
            type="button"
            class="tab"
            :class="{ active: activeTab === 'add' }"
            @click="activeTab = 'add'"
          >
            加入好友
          </button>
        </div>

        <FriendList
          v-if="activeTab === 'friends'"
          :friends="friendStore.friends"
          :selected-friend-id="friendStore.selectedFriendId"
          @select="friendStore.selectFriend"
        />

        <div v-else-if="activeTab === 'requests'" class="min-h-0 flex-1 overflow-y-auto p-5">
          <FriendRequestList
            :requests="friendStore.requests"
            @accept="friendStore.acceptRequest"
            @reject="friendStore.rejectRequest"
          />
        </div>

        <div v-else class="min-h-0 flex-1 overflow-y-auto p-5">
          <AddFriendForm
            :sent-invites="friendStore.sentInvites"
            :notice="friendStore.noticeMessage"
            @add-friend="friendStore.sendFriendRequest"
          />
        </div>
      </aside>

      <main class="flex min-h-0 flex-1 flex-col">
        <header class="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-5">
          <div class="flex min-w-0 items-center gap-3">
            <img
              src="@/assets/images/player-1.png"
              alt=""
              class="h-9 w-9 shrink-0 object-cover"
            />

            <div class="min-w-0">
              <div class="flex items-center gap-2 text-sm font-bold text-gray-800">
                <span class="truncate">
                  {{ friendStore.selectedFriend?.name || "尚未選擇好友" }}
                </span>

                <span
                  v-if="friendStore.selectedFriend"
                  class="h-2 w-2 shrink-0"
                  :class="getStatusColorClass(friendStore.selectedFriend)"
                ></span>
              </div>

              <div class="truncate text-xs text-gray-500">
                {{ selectedFriendStatus }}
              </div>
            </div>
          </div>

          <button
            type="button"
            class="border border-gray-300 px-3 py-1 text-sm font-bold text-gray-600 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
            @click="$router.push('/lobby')"
          >
            返回大廳
          </button>
        </header>

        <section class="min-h-0 flex-1 overflow-y-auto bg-gray-50/70 px-6 py-5">
          <template v-if="friendStore.selectedFriend">
            <div
              v-for="message in friendStore.selectedFriendMessages"
              :key="message.id"
              class="mb-4 flex"
              :class="message.from === 'me' ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[72%] px-4 py-2 text-sm leading-relaxed shadow-sm"
                :class="
                  message.from === 'me'
                    ? 'bg-sky-100 text-gray-700'
                    : 'bg-white text-gray-700'
                "
              >
                <div class="mb-1 text-[11px] text-gray-400">
                  {{ message.time }}
                </div>

                {{ message.text }}
              </div>
            </div>

            <div
              v-if="friendStore.selectedFriendMessages.length === 0"
              class="flex h-full items-center justify-center text-sm text-gray-400"
            >
              還沒有訊息，送出第一句招呼吧
            </div>
          </template>

          <div
            v-else
            class="flex h-full items-center justify-center text-sm text-gray-400"
          >
            選擇一位好友開始聊天
          </div>
        </section>

        <footer class="flex h-16 shrink-0 items-center gap-3 border-t border-gray-200 px-5">
          <input
            v-model="messageText"
            type="text"
            placeholder="輸入訊息"
            class="min-w-0 flex-1 border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:bg-white"
            @keydown.enter="sendMessage"
          />

          <button
            type="button"
            class="bg-slate-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-400"
            :disabled="!messageText.trim() || !friendStore.selectedFriend"
            @click="sendMessage"
          >
            送出
          </button>
        </footer>
      </main>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import AddFriendForm from "@/components/friend/AddFriendForm.vue";
import FriendList from "@/components/friend/FriendList.vue";
import FriendRequestList from "@/components/friend/FriendRequestList.vue";
import BG_FriendView from "@/assets/images/bg-friend-view.webp";
import { useFriendStore } from "@/stores/friendStore.js";

const friendStore = useFriendStore();
const activeTab = ref("friends");
const messageText = ref("");

const selectedFriendStatus = computed(() => {
  const friend = friendStore.selectedFriend;

  if (!friend) {
    return "請從左側選擇好友";
  }

  if (friend.statusType === "playing") {
    return `遊戲中｜${friend.status}`;
  }

  return friend.status;
});

function getStatusColorClass(friend) {
  if (friend.statusType === "playing") {
    return "bg-blue-500";
  }

  return friend.online ? "bg-green-500" : "bg-gray-400";
}

function sendMessage() {
  const text = messageText.value.trim();

  if (!text) {
    return;
  }

  friendStore.sendMessage(text);
  messageText.value = "";
}
</script>

<style scoped>
@reference "tailwindcss";

.tab {
  @apply mr-5 h-full shrink-0 border-b-2 border-transparent text-sm font-bold text-gray-400 transition hover:text-gray-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200;
}

.tab.active {
  @apply border-gray-800 text-gray-900;
}

.friend-page-panel {
  animation: friendPageEnter 360ms ease both;
  will-change: transform, opacity;
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

@media (prefers-reduced-motion: reduce) {
  .friend-page-panel {
    animation: none;
  }
}
</style>
