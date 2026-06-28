<template>
  <div
    class="flex h-screen w-screen items-center justify-center overflow-hidden bg-cover bg-center p-4"
    :style="{ backgroundImage: `url(${BG_FriendView})` }"
  >
    <section
      class="flex h-[76vh] w-[76vw] max-w-[980px] overflow-hidden bg-white/95 shadow-2xl backdrop-blur"
    >
      <!-- 左側好友列表 -->
      <aside class="flex w-[38%] min-w-[280px] flex-col border-r border-gray-200">
        <!-- tabs -->
        <div class="flex h-14 items-center border-b border-gray-200 px-5">
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
            :class="{ active: activeTab === 'add' }"
            @click="activeTab = 'add'"
          >
            加入好友
          </button>
        </div>

        <!-- 好友列表 -->
        <template v-if="activeTab === 'friends'">
          <div class="border-b border-gray-100 p-4">
            <input
              v-model="keyword"
              type="text"
              placeholder="搜尋好友暱稱"
              class="w-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </div>

          <div class="flex-1 overflow-y-auto px-4 py-3">
            <section>
              <div class="mb-2 flex items-center justify-between">
                <h3 class="text-sm font-bold text-gray-700">
                  線上好友 ({{ onlineFriends.length }})
                </h3>
              </div>

              <FriendItem
                v-for="friend in onlineFriends"
                :key="friend.id"
                :friend="friend"
                :active="selectedFriendId === friend.id"
                @select="selectedFriendId = friend.id"
              />
            </section>

            <section class="mt-5">
              <div class="mb-2 flex items-center justify-between">
                <h3 class="text-sm font-bold text-gray-700">
                  離線好友 ({{ offlineFriends.length }})
                </h3>

                <button
                  type="button"
                  class="text-xs text-gray-400 hover:text-gray-600"
                >
                  ˅
                </button>
              </div>

              <FriendItem
                v-for="friend in offlineFriends"
                :key="friend.id"
                :friend="friend"
                :active="selectedFriendId === friend.id"
                @select="selectedFriendId = friend.id"
              />
            </section>
          </div>
        </template>

        <!-- 加入好友 -->
        <template v-else>
          <div class="flex flex-1 flex-col justify-center px-8">
            <h3 class="mb-2 text-lg font-bold text-gray-800">
              加入好友
            </h3>

            <p class="mb-4 text-sm text-gray-500">
              輸入玩家暱稱或玩家 ID，送出好友邀請。
            </p>

            <input
              v-model="addFriendKeyword"
              type="text"
              placeholder="輸入玩家 ID / 暱稱"
              class="mb-3 border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:bg-white"
            />

            <button
              type="button"
              class="bg-slate-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700"
              @click="handleAddFriend"
            >
              送出邀請
            </button>
          </div>
        </template>
      </aside>

      <!-- 右側聊天區 -->
      <main class="flex min-w-0 flex-1 flex-col">
        <!-- header -->
        <header class="flex h-14 items-center justify-between border-b border-gray-200 px-5">
          <div class="flex items-center gap-3">
            <img
              src="@/assets/images/player-1.png"
              alt=""
              class="h-9 w-9 object-cover"
            />

            <div>
              <div class="flex items-center gap-2 text-sm font-bold text-gray-800">
                {{ selectedFriend?.name || "尚未選擇好友" }}

                <span
                  v-if="selectedFriend"
                  class="h-2 w-2 rounded-full"
                  :class="selectedFriend.online ? 'bg-green-500' : 'bg-gray-400'"
                ></span>
              </div>

              <div class="text-xs text-gray-500">
                {{ selectedFriend?.status || "請從左側選擇好友" }}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-4 text-gray-500">
            <button
              type="button"
              class="hover:text-gray-800"
              aria-label="關閉好友頁"
              @click="$router.push('/lobby')"
            >
              <X class="h-5 w-5" />
            </button>
          </div>
        </header>

        <!-- messages -->
        <section class="flex-1 overflow-y-auto bg-gray-50/70 px-6 py-5">
          <template v-if="selectedFriend">
            <div
              v-for="message in currentMessages"
              :key="message.id"
              class="mb-4 flex"
              :class="message.from === 'me' ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[68%] px-4 py-2 text-sm leading-relaxed shadow-sm"
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
          </template>

          <div
            v-else
            class="flex h-full items-center justify-center text-sm text-gray-400"
          >
            選擇一位好友開始聊天
          </div>
        </section>

        <!-- input -->
        <footer class="flex h-16 items-center gap-3 border-t border-gray-200 px-5">
          <input
            v-model="messageText"
            type="text"
            placeholder="輸入訊息"
            class="flex-1 border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:bg-white"
            @keydown.enter="sendMessage"
          />

          <button
            type="button"
            class="bg-slate-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700"
            aria-label="送出訊息"
            @click="sendMessage"
          >
            <Send class="h-4 w-4" />
          </button>
        </footer>
      </main>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { Send, X } from "lucide-vue-next";
import BG_FriendView from "@/assets/images/bg-friend-view.webp";
import FriendItem from "@/components/friend/FriendItem.vue";

const activeTab = ref("friends");
const keyword = ref("");
const addFriendKeyword = ref("");
const messageText = ref("");

const selectedFriendId = ref(1);

const friends = ref([
  {
    id: 1,
    name: "策略大雄",
    status: "在線上｜牌局中 2/5",
    online: true,
  },
  {
    id: 2,
    name: "數據艾米",
    status: "在線上",
    online: true,
  },
  {
    id: 3,
    name: "設計花花",
    status: "在線上",
    online: true,
  },
  {
    id: 4,
    name: "行銷阿哲",
    status: "在線上｜對戰中",
    online: true,
  },
  {
    id: 5,
    name: "夜貓子 Leo",
    status: "在線上",
    online: true,
  },
  {
    id: 6,
    name: "邏輯怪 Max",
    status: "在線上",
    online: true,
  },
  {
    id: 7,
    name: "工程阿凱",
    status: "離線 2 小時",
    online: false,
  },
  {
    id: 8,
    name: "產品小李",
    status: "離線 1 天",
    online: false,
  },
]);

const messages = ref([
  {
    id: 1,
    friendId: 1,
    from: "me",
    time: "14:32",
    text: "策略大雄，剛剛那場打得不錯耶！",
  },
  {
    id: 2,
    friendId: 1,
    from: "friend",
    time: "14:33",
    text: "謝謝！那波真的有點驚險，如果沒猜到我可能就輸掉了。",
  },
  {
    id: 3,
    friendId: 1,
    from: "friend",
    time: "14:35",
    text: "可以啊～我這邊還有五分鐘就可以。",
  },
  {
    id: 4,
    friendId: 1,
    from: "me",
    time: "14:36",
    text: "好啊，我先去上個廁所。",
  },
]);

const filteredFriends = computed(() => {
  const value = keyword.value.trim().toLowerCase();

  if (!value) {
    return friends.value;
  }

  return friends.value.filter((friend) =>
    friend.name.toLowerCase().includes(value)
  );
});

const onlineFriends = computed(() => {
  return filteredFriends.value.filter((friend) => friend.online);
});

const offlineFriends = computed(() => {
  return filteredFriends.value.filter((friend) => !friend.online);
});

const selectedFriend = computed(() => {
  return friends.value.find((friend) => friend.id === selectedFriendId.value);
});

const currentMessages = computed(() => {
  return messages.value.filter(
    (message) => message.friendId === selectedFriendId.value
  );
});

function handleAddFriend() {
  if (!addFriendKeyword.value.trim()) {
    return;
  }

  console.log("送出好友邀請：", addFriendKeyword.value);
  addFriendKeyword.value = "";
}

function sendMessage() {
  const text = messageText.value.trim();

  if (!text || !selectedFriend.value) {
    return;
  }

  messages.value.push({
    id: Date.now(),
    friendId: selectedFriend.value.id,
    from: "me",
    time: "現在",
    text,
  });

  messageText.value = "";
}
</script>

<style scoped>
@reference "tailwindcss";

.tab {
  @apply mr-6 h-full border-b-2 border-transparent text-sm font-bold text-gray-400 transition hover:text-gray-700;
}

.active {
  @apply border-gray-800 text-gray-900;
}
</style>
