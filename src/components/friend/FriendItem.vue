<template>
  <button
    type="button"
    class="mb-1 flex w-full items-center justify-between border border-transparent px-2 py-2 text-left transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
    :class="active ? 'border-gray-500 bg-gray-100' : ''"
    @click="emit('select', friend.id)"
  >
    <div class="flex min-w-0 items-center gap-2">
      <img
        src="@/assets/images/player-1.png"
        alt=""
        class="h-9 w-9 shrink-0 object-cover"
      />

      <div class="min-w-0">
        <div class="truncate text-sm font-bold text-gray-800">
          {{ friend.name }}
        </div>

        <div class="truncate text-xs text-gray-500">
          {{ friend.playerId }}｜{{ friend.status }}
        </div>
      </div>
    </div>

    <div class="flex shrink-0 items-center gap-2">
      <span class="text-xs font-semibold text-gray-500">
        {{ statusLabel }}
      </span>

      <span
        class="h-2 w-2"
        :class="statusColorClass"
      ></span>
    </div>
  </button>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  friend: {
    type: Object,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["select"]);

const statusLabel = computed(() => {
  if (props.friend.statusType === "playing") {
    return "遊戲中";
  }

  return props.friend.online ? "在線" : "離線";
});

const statusColorClass = computed(() => {
  if (props.friend.statusType === "playing") {
    return "bg-blue-500";
  }

  return props.friend.online ? "bg-green-500" : "bg-gray-400";
});
</script>
