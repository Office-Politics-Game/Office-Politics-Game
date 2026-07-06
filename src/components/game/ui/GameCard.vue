<script setup>
defineProps({
  name: {
    type: String,
    required: true,
  },
  backgroundUrl: {
    type: String,
    required: true,
  },
  frameUrl: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <div
    class="relative block size-full select-none"
    role="img"
    :aria-label="name"
  >
    <img
      :src="backgroundUrl"
      alt=""
      aria-hidden="true"
      class="absolute inset-0 block size-full object-contain"
      draggable="false"
    />
    <img
      :src="frameUrl"
      alt=""
      aria-hidden="true"
      class="absolute inset-0 block size-full object-contain"
      draggable="false"
    />
  </div>
</template>
