<template>
  <section class="space-y-3">
    <div
      v-if="isLoading"
      class="border border-dashed border-[var(--gray-100)] bg-white/70 p-6 text-center text-sm font-bold text-[var(--gray-400)]"
    >
      好友邀請載入中...
    </div>

    <div
      v-else-if="errorMessage"
      class="border border-[var(--brand-hover)] bg-[rgba(0,70,244,0.08)] p-6 text-center text-sm font-bold text-[var(--feedback-error)]"
    >
      {{ errorMessage }}
    </div>

    <div
      v-else-if="requests.length === 0"
      class="border border-dashed border-gray-300 bg-white/70 p-6 text-center text-sm text-gray-500"
    >
      目前沒有好友邀請
    </div>

    <article
      v-for="request in requests"
      :key="request.id"
      class="border border-gray-200 bg-white p-4"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h3 class="truncate text-sm font-bold text-gray-800">
            {{ request.name }}
          </h3>
          <p class="mt-1 text-xs text-gray-500">
            {{ request.playerId }}｜{{ request.requestedAt }}
          </p>
        </div>
      </div>

      <p class="mt-3 text-sm leading-relaxed text-gray-600">
        {{ request.note }}
      </p>

      <div class="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          class="border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
          :disabled="isProcessing(request.id)"
          @click="emit('reject', request.id)"
        >
          {{ isProcessing(request.id) ? "處理中..." : "拒絕" }}
        </button>

        <button
          type="button"
          class="bg-slate-800 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
          :disabled="isProcessing(request.id)"
          @click="emit('accept', request.id)"
        >
          {{ isProcessing(request.id) ? "處理中..." : "接受" }}
        </button>
      </div>
    </article>
  </section>
</template>

<script setup>
const props = defineProps({
  requests: {
    type: Array,
    default: () => [],
  },
  processingRequestIds: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["accept", "reject"]);

function isProcessing(requestId) {
  return props.processingRequestIds.includes(requestId);
}
</script>
