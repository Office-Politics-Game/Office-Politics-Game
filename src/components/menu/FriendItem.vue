<template>
  <div
    class="flex items-center justify-between bg-gray-100 rounded-lg p-3 mt-2"
  >
    <div class="flex items-center gap-2">
      <img
        src="@/assets/images/player-1.png"
        class="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover"
      />
      <div>
        <div class="text-sm font-medium">
          {{ name }}
        </div>
        <div class="text-xs text-gray-500">
          {{ status }}
        </div>
      </div>
    </div>
    <button
      class="px-3 py-1 text-sm bg-white rounded-[4px] border hover:bg-gray-50"
    >
      發送訊息
    </button>
  </div>
</template>

<script setup>
defineProps({
  name: String,
  status: String,
});
</script>
