<template>
  <div
    class="flex items-center justify-between bg-gray-100 rounded-lg p-3 mt-2"
  >
    <div class="flex items-center gap-3">
      <img
        src="@/assets/Player_1.png"
        class="w-10 h-10 rounded-full object-cover"
      />
      <div>
        <div class="font-medium">
          {{ name }}
        </div>
        <div class="text-sm text-gray-500">
          {{ status }}
        </div>
      </div>
    </div>
    <button
      class="px-4 py-2 bg-white rounded-md border hover:bg-gray-50"
    >
      發送訊息
    </button>
  </div>
</template>

<script setup>
defineProps({
  name: String,
  status: String
})
</script>