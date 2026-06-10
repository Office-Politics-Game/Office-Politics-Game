<script setup>
defineProps({
  name: String,
  level: Number,
  score: Number,
  avatar: String,
});
</script>

<template>
  <div class="relative flex h-[40px] w-47 items-center justify-between">
    <div class="flex min-w-0 items-center gap-4 ali justify-between">
      <div>
        <div class="flex">
          <img
            :src="avatar"
            :alt="name"
            class="h-9 w-9 rounded-full border-2 border-blue-600 object-cover"
          />
          <span
            class="absolute bottom-0 left-7 flex h-5 w-5 items-center justify-center rounded-full border-1 border-white bg-blue-600 text-[9px] font-bold leading-none text-white shadow"
          >
            {{ level }}
          </span>
        </div>
      </div>

      <span class="truncate text-[14px] font-bold text-slate-700">
        {{ name }}
      </span>
    </div>

    <div class="flex shrink-0 gap-1">
      <span
        v-for="star in 3"
        :key="star"
        class="flex h-4 w-4 items-center justify-center rounded-full text-sm font-bold text-white"
        :class="star <= score ? 'bg-blue-600' : 'bg-gray-300'"
      >
        ★
      </span>
    </div>
  </div>
</template>
