<template>
  <form class="space-y-4" @submit.prevent="submitForm">
    <div>
      <h3 class="text-lg font-bold text-gray-800">加入好友</h3>
      <p class="mt-1 text-sm text-gray-500">
        輸入玩家暱稱或玩家 ID，先以假資料流程送出好友邀請。
      </p>
    </div>

    <div class="flex gap-2">
      <input
        v-model="keyword"
        type="text"
        placeholder="玩家 ID / 暱稱"
        class="min-w-0 flex-1 border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
      />

      <button
        type="submit"
        class="bg-slate-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
      >
        送出邀請
      </button>
    </div>

    <p
      v-if="notice"
      class="border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800"
    >
      {{ notice }}
    </p>

    <section v-if="sentInvites.length" class="space-y-2">
      <h4 class="text-sm font-bold text-gray-700">已送出的邀請</h4>

      <div
        v-for="invite in sentInvites"
        :key="invite.id"
        class="border border-gray-200 bg-white px-3 py-2"
      >
        <div class="text-sm font-bold text-gray-800">
          {{ invite.keyword }}
        </div>
        <div class="text-xs text-gray-500">
          {{ invite.sentAt }}送出｜等待回覆
        </div>
      </div>
    </section>
  </form>
</template>

<script setup>
import { ref } from "vue";

defineProps({
  sentInvites: {
    type: Array,
    default: () => [],
  },
  notice: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["add-friend"]);
const keyword = ref("");

function submitForm() {
  const value = keyword.value.trim();

  if (!value) {
    return;
  }

  emit("add-friend", value);
  keyword.value = "";
}
</script>
