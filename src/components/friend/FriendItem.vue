<template>
  <button
    class="mb-1 flex w-full items-center justify-between rounded-lg px-2 py-2 text-left transition"
    :class="active ? 'bg-gray-100' : 'hover:bg-gray-50'"
    @click="emit('select')"
  >
    <div class="flex min-w-0 items-center gap-2">
      <img
        src="@/assets/images/player-1.png"
        class="h-9 w-9 shrink-0 rounded-full object-cover"
      />

      <div class="min-w-0">
        <div class="truncate text-sm font-bold text-gray-800">
          {{ friend.name }}
        </div>

        <div class="truncate text-xs text-gray-500">
          {{ friend.status }}
        </div>
      </div>
    </div>

    <div class="flex shrink-0 items-center gap-3">
      <button
        class="text-xs text-gray-400 hover:text-gray-700"
        @click.stop="emit('message')"
      >
        💬
      </button>

      <span
        class="h-2 w-2 rounded-full"
        :class="friend.online ? 'bg-green-500' : 'bg-gray-400'"
      ></span>
    </div>
  </button>
</template>

<script setup>
defineProps({
  friend: {
    type: Object,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["select", "message"]);
</script>