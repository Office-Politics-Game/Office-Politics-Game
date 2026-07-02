<template>
  <div
    class="friend-page-shell flex min-h-screen w-screen items-center justify-center overflow-hidden bg-cover bg-center p-3 md:p-4"
    :class="{ 'is-returning': isReturningToLobby }"
    :style="{ backgroundImage: `url(${BG_FriendView})` }"
  >
    <div
      class="friend-exit-layer"
      :style="{ backgroundImage: `url(${bgDashboard})` }"
      aria-hidden="true"
    ></div>

    <section
      class="friend-page-panel relative z-10 flex h-[92vh] w-[94vw] max-w-[1100px] flex-col overflow-hidden bg-white/95 shadow-2xl backdrop-blur md:h-[82vh] md:flex-row"
    >
      <aside class="flex min-h-0 w-full flex-col border-b border-[var(--gray-100)] md:w-[38%] md:border-b-0 md:border-r">
        <div class="flex h-14 shrink-0 items-center border-b border-[var(--gray-100)] px-5">
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
          :is-loading="friendStore.isLoading"
          :error-message="friendStore.errorMessage"
          @select="friendStore.selectFriend"
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

        <div v-else class="min-h-0 flex-1 overflow-y-auto p-5">
          <AddFriendForm
            :sent-invites="friendStore.sentInvites"
            :search-results="friendStore.searchResults"
            :notice="friendStore.noticeMessage"
            :error-message="friendStore.searchErrorMessage"
            :is-searching="friendStore.isSearching"
            :is-sending="friendStore.isSending"
            @search="friendStore.searchPlayers"
            @add-friend="friendStore.sendFriendRequest"
          />
        </div>
      </aside>

      <main class="flex min-h-0 flex-1 flex-col">
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
                  {{ friendStore.selectedFriend?.name || "尚未選擇好友" }}
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

        <section class="min-h-0 flex-1 overflow-y-auto bg-[rgba(244,247,251,0.74)] px-6 py-5">
          <article v-if="friendStore.selectedFriend" class="friend-detail">
            <div class="flex items-center gap-4 border-b border-[var(--gray-100)] pb-5">
              <img
                src="@/assets/images/player-1.png"
                alt=""
                class="h-16 w-16 shrink-0 border border-[var(--brand-primary)] object-cover"
              />

              <div class="min-w-0">
                <h2 class="truncate text-xl font-black text-[var(--brand-navy)]">
                  {{ friendStore.selectedFriend.name }}
                </h2>
                <p class="mt-1 text-sm font-bold text-[var(--gray-400)]">
                  玩家 ID {{ friendStore.selectedFriend.playerId }}
                </p>
              </div>
            </div>

            <dl class="mt-5 grid gap-3 sm:grid-cols-2">
              <div
                v-for="item in selectedFriendDetails"
                :key="item.label"
                class="border border-[var(--gray-100)] bg-white px-4 py-3"
              >
                <dt class="text-xs font-bold text-[var(--gray-400)]">
                  {{ item.label }}
                </dt>
                <dd class="mt-1 text-sm font-black text-[var(--brand-active)]">
                  {{ item.value }}
                </dd>
              </div>
            </dl>
          </article>

          <div v-else class="friend-detail friend-detail--empty">
            <h2 class="text-xl font-black text-[var(--brand-navy)]">
              選擇一位好友查看資料
            </h2>
            <p class="mt-2 text-sm font-bold text-[var(--gray-400)]">
              好友聊天尚未串接，本次先完成好友列表與邀請流程。
            </p>
          </div>
        </section>
      </main>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import AddFriendForm from "@/components/friend/AddFriendForm.vue";
import FriendList from "@/components/friend/FriendList.vue";
import FriendRequestList from "@/components/friend/FriendRequestList.vue";
import BG_FriendView from "@/assets/images/bg-friend-view.webp";
import bgDashboard from "@/assets/images/bg-dashboard.webp";
import { useFriendStore } from "@/stores/friendStore.js";

const router = useRouter();
const friendStore = useFriendStore();
const activeTab = ref("friends");
const isReturningToLobby = ref(false);
const RETURN_ANIMATION_DURATION = 520;

const selectedFriendStatus = computed(() => {
  const friend = friendStore.selectedFriend;

  if (!friend) {
    return "請從左側選擇好友";
  }

  return friend.status;
});

const selectedFriendDetails = computed(() => {
  const friend = friendStore.selectedFriend;

  if (!friend) {
    return [];
  }

  return [
    { label: "目前狀態", value: friend.status },
    { label: "等級", value: `Lv. ${friend.level}` },
    { label: "好友建立時間", value: formatDetailDate(friend.createdAt) },
    { label: "頭像 ID", value: friend.avatarId ?? "尚未設定" },
  ];
});

function getStatusColorClass(friend) {
  return friend.online ? "bg-green-500" : "bg-[var(--gray-200)]";
}

function formatDetailDate(value) {
  if (!value) {
    return "尚未記錄";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "尚未記錄";
  }

  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
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
  friendStore.loadFriendData();
});
</script>

<style scoped>
@reference "tailwindcss";

.tab {
  @apply mr-5 h-full shrink-0 border-b-2 border-transparent text-sm font-bold text-[var(--gray-400)] transition hover:text-[var(--brand-active)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--brand-focus)];
}

.tab.active {
  @apply border-[var(--brand-active)] text-[var(--brand-navy)];
}

.friend-page-shell {
  position: relative;
  isolation: isolate;
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
  animation: friendPageEnter 360ms ease both;
  will-change: transform, opacity;
}

.friend-page-shell.is-returning .friend-exit-layer {
  animation: dashboardReveal 520ms ease both;
}

.friend-page-shell.is-returning .friend-page-panel {
  opacity: 0;
  pointer-events: none;
  animation: none;
}

.friend-detail {
  @apply min-h-full border border-[rgba(134,179,224,0.38)] bg-[rgba(255,255,255,0.88)] p-5 shadow-[var(--shadow)];
}

.friend-detail--empty {
  @apply flex flex-col items-center justify-center text-center;
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
