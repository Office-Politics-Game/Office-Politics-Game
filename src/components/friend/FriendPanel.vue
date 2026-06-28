<script setup>
import { computed, ref } from 'vue'
import FriendItem from './FriendItem.vue'
import FriendRequestItem from './FriendRequestItem.vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  friends: {
    type: Array,
    default: () => [],
  },
  requests: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits([
  'close',
  'add-friend',
  'invite-friend',
  'accept-request',
  'reject-request',
  'remove-friend',
])

const activeTab = ref('friends')
const keyword = ref('')

const filteredFriends = computed(() => {
  if (!keyword.value.trim()) return props.friends

  return props.friends.filter((friend) =>
    friend.nickname?.toLowerCase().includes(keyword.value.toLowerCase())
  )
})

function submitAddFriend() {
  const value = keyword.value.trim()
  if (!value) return

  emit('add-friend', value)
  keyword.value = ''
}
</script>

<template>
  <Transition name="friend-panel">
    <aside
      v-if="open"
      class="fixed right-0 top-0 z-50 h-full w-full border-l border-sky-200/70 bg-white/90 p-5 shadow-2xl backdrop-blur-md sm:w-[360px]"
    >
      <header class="mb-5 flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-slate-800">好友</h2>
          <p class="text-sm text-slate-500">
            {{ friends.filter((friend) => friend.status === 'online').length }}
            位好友在線
          </p>
        </div>

        <button
          class="rounded-full px-3 py-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          @click="emit('close')"
        >
          ✕
        </button>
      </header>

      <form class="mb-4 flex gap-2" @submit.prevent="submitAddFriend">
        <input
          v-model="keyword"
          type="text"
          placeholder="搜尋暱稱 / 輸入玩家 ID"
          class="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />

        <button
          type="submit"
          class="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-600"
        >
          加入
        </button>
      </form>

      <nav class="mb-4 grid grid-cols-3 rounded-xl bg-slate-100 p-1 text-sm">
        <button
          class="rounded-lg py-2 transition"
          :class="activeTab === 'friends' ? 'bg-white font-semibold text-sky-600 shadow-sm' : 'text-slate-500'"
          @click="activeTab = 'friends'"
        >
          好友
        </button>

        <button
          class="rounded-lg py-2 transition"
          :class="activeTab === 'requests' ? 'bg-white font-semibold text-sky-600 shadow-sm' : 'text-slate-500'"
          @click="activeTab = 'requests'"
        >
          邀請
        </button>

        <button
          class="rounded-lg py-2 transition"
          :class="activeTab === 'search' ? 'bg-white font-semibold text-sky-600 shadow-sm' : 'text-slate-500'"
          @click="activeTab = 'search'"
        >
          搜尋
        </button>
      </nav>

      <section class="space-y-3 overflow-y-auto pr-1">
        <template v-if="activeTab === 'friends'">
          <FriendItem
            v-for="friend in filteredFriends"
            :key="friend.id"
            :friend="friend"
            @invite="emit('invite-friend', friend.id)"
            @remove="emit('remove-friend', friend.id)"
          />

          <div
            v-if="filteredFriends.length === 0"
            class="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500"
          >
            目前沒有找到好友
          </div>
        </template>

        <template v-if="activeTab === 'requests'">
          <FriendRequestItem
            v-for="request in requests"
            :key="request.id"
            :request="request"
            @accept="emit('accept-request', request.id)"
            @reject="emit('reject-request', request.id)"
          />

          <div
            v-if="requests.length === 0"
            class="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500"
          >
            目前沒有好友邀請
          </div>
        </template>

        <template v-if="activeTab === 'search'">
          <div class="rounded-2xl bg-sky-50 p-4 text-sm text-slate-600">
            輸入玩家 ID 或暱稱後，可以送出好友邀請。
          </div>
        </template>
      </section>
    </aside>
  </Transition>
</template>

<style scoped>
.friend-panel-enter-active,
.friend-panel-leave-active {
  transition:
    transform 0.22s ease,
    opacity 0.22s ease;
}

.friend-panel-enter-from,
.friend-panel-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>