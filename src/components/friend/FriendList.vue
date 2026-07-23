<template>
  <section class="flex min-h-0 flex-1 flex-col">
    <div v-if="searchable" class="border-b border-gray-100 p-4">
      <input
        v-model="keyword"
        type="text"
        placeholder="搜尋好友暱稱或 ID"
        class="w-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
      />
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto px-4 py-3">
      <div
        v-if="isLoading"
        class="border border-dashed border-[var(--gray-100)] bg-white/70 p-6 text-center text-sm font-bold text-[var(--gray-400)]"
      >
        好友資料載入中...
      </div>

      <div
        v-else-if="errorMessage"
        class="border border-[var(--brand-hover)] bg-[rgba(0,70,244,0.08)] p-6 text-center text-sm font-bold text-[var(--feedback-error)]"
      >
        {{ errorMessage }}
      </div>

      <template v-else-if="filteredFriends.length">
        <section
          v-for="group in visibleGroups"
          :key="group.key"
          class="mb-5 last:mb-0"
        >
          <div class="mb-2 flex items-center justify-between">
            <h3 class="text-sm font-bold text-gray-700">
              {{ group.title }} ({{ group.friends.length }})
            </h3>
          </div>

          <FriendItem
            v-for="friend in group.friends"
            :key="friend.id"
            :friend="friend"
            :active="selectedFriendId === friend.id"
            :show-actions="showActions"
            :is-friend-processing="isFriendProcessing(friend.friendshipId)"
            :is-player-processing="isPlayerProcessing(friend.playerId)"
            @select="emit('select', $event)"
            @remove="emit('remove', $event)"
            @block="emit('block', $event)"
          />
        </section>
      </template>

      <div
        v-else
        class="border border-dashed border-gray-300 bg-white/70 p-6 text-center text-sm text-gray-500"
      >
        目前沒有找到好友
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from "vue";
import FriendItem from "@/components/friend/FriendItem.vue";

const props = defineProps({
  friends: {
    type: Array,
    default: () => [],
  },
  selectedFriendId: {
    type: String,
    default: "",
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: "",
  },
  searchable: {
    type: Boolean,
    default: true,
  },
  showActions: {
    type: Boolean,
    default: false,
  },
  isFriendProcessing: {
    type: Function,
    default: () => false,
  },
  isPlayerProcessing: {
    type: Function,
    default: () => false,
  },
});

const emit = defineEmits(["select", "remove", "block"]);
const keyword = ref("");

const filteredFriends = computed(() => {
  const value = keyword.value.trim().toLowerCase();

  if (!value) {
    return props.friends;
  }

  return props.friends.filter((friend) => {
    return [friend.name, friend.playerId, friend.status]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(value));
  });
});

const visibleGroups = computed(() => {
  const groups = [
    {
      key: "playing",
      title: "遊戲中",
      friends: filteredFriends.value.filter(
        (friend) => friend.statusType === "playing",
      ),
    },
    {
      key: "online",
      title: "在線好友",
      friends: filteredFriends.value.filter(
        (friend) => friend.statusType === "online",
      ),
    },
    {
      key: "offline",
      title: "離線好友",
      friends: filteredFriends.value.filter(
        (friend) => friend.statusType === "offline",
      ),
    },
  ];

  return groups.filter((group) => group.friends.length > 0);
});
</script>
